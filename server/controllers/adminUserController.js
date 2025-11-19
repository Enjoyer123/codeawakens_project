const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let where = {};
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { username: { contains: searchLower, mode: 'insensitive' } },
          { email: { contains: searchLower, mode: 'insensitive' } },
          { first_name: { contains: searchLower, mode: 'insensitive' } },
          { last_name: { contains: searchLower, mode: 'insensitive' } },
        ],
      };
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
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
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.clerk_user_id === req.user.id && role === "user") {
      return res.status(400).json({ message: "Cannot remove your own admin role" });
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(userId) },
      data: { role },
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
      },
    });

    res.json({
      message: "User role updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({ message: "Error updating user role" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
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
      where: { user_id: parseInt(userId) },
      orderBy: {
        completed_at: 'desc',
      },
    });

    const userRewards = await prisma.userReward.findMany({
      where: { user_id: parseInt(userId) },
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

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.clerk_user_id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { user_id: parseInt(userId) },
    });

    res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};