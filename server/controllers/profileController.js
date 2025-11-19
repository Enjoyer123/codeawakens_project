const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const { uploadDir } = require("../middleware/upload");

const prisma = new PrismaClient();

exports.checkProfile = async (req, res) => {
  try {
    const clerkId = req.user.id;
    const firstName = req.user.firstName || "";
    const lastName = req.user.lastName || "";
    const email = req.user.emailAddresses[0]?.emailAddress;
    const profileImageUrl = req.user.imageUrl || "";
    const username = req.user.username || email?.split('@')[0] || `user_${clerkId.slice(0, 8)}`;

    let userInDb = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
    });

    if (!userInDb) {
      userInDb = await prisma.user.create({
        data: {
          clerk_user_id: clerkId,
          username,
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          profile_image: profileImageUrl || null,
          role: "user",
        },
      });
    } else {
      const updateData = {};

      if (userInDb.email !== email) updateData.email = email;

      if (!userInDb.profile_image || userInDb.profile_image.includes("clerk")) {
        if (userInDb.profile_image !== profileImageUrl) {
          updateData.profile_image = profileImageUrl || null;
        }
      }

      if (Object.keys(updateData).length > 0) {
        userInDb = await prisma.user.update({
          where: { clerk_user_id: clerkId },
          data: updateData,
        });
      }
    }

    res.json({
      loggedIn: true,
      hasProfile: true,
      user_id: userInDb.user_id,
      clerkId: userInDb.clerk_user_id,
      username: userInDb.username,
      firstName: userInDb.first_name,
      lastName: userInDb.last_name,
      email: userInDb.email,
      profile_image: userInDb.profile_image,
      role: userInDb.role,
    });

  } catch (err) {
    res.json({ loggedIn: false, hasProfile: false });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const clerkId = req.user.id;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkId },
      data: { username: username.trim() },
    });

    res.json({
      message: "Username updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update username" });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const clerkId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: { profile_image: true }
    });

    if (
      currentUser?.profile_image &&
      !currentUser.profile_image.includes("clerk") &&
      !currentUser.profile_image.startsWith("http")
    ) {
      const oldImagePath = path.join(uploadDir, path.basename(currentUser.profile_image));
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    const imageUrl = `/uploads/userprofile/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkId },
      data: { profile_image: imageUrl },
    });

    res.json({
      message: "Profile image uploaded successfully",
      profileImageUrl: imageUrl,
      user: updatedUser,
    });

  } catch (error) {
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json({ message: "Failed to upload profile image" });
  }
};

exports.deleteProfileImage = async (req, res) => {
  try {
    const clerkId = req.user.id;

    const currentUser = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: { profile_image: true }
    });

    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (
      currentUser.profile_image &&
      !currentUser.profile_image.includes("clerk") &&
      !currentUser.profile_image.startsWith("http")
    ) {
      const imagePath = path.join(uploadDir, path.basename(currentUser.profile_image));
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    const clerkImage = req.user.imageUrl;

    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkId },
      data: { profile_image: clerkImage },
    });

    res.json({
      message: "Profile image deleted successfully",
      profileImageUrl: updatedUser.profile_image,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete profile image" });
  }
};


exports.getUserByClerkId = async (req, res) => {
  try {
    const clerkId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: {
        user_id: true,
        clerk_user_id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        profile_image: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProgress = await prisma.userProgress.findMany({
      where: { user_id: user.user_id },
      orderBy: {
        completed_at: 'desc',
      },
    });

    const userRewards = await prisma.userReward.findMany({
      where: { user_id: user.user_id },
      include: {
        reward: true,
      },
      orderBy: {
        earned_at: 'desc',
      },
    });

    const responseData = {
      user: user,
      user_progress: userProgress,
      user_reward: userRewards,
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
};