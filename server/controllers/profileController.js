const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const { uploadDir } = require("../middleware/upload");

const prisma = new PrismaClient();

exports.checkProfile = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[AUTH] User ${clerkId} checking profile.`);

  try {
    const firstName = req.user.firstName || "";
    const lastName = req.user.lastName || "";
    const email = req.user.emailAddresses[0]?.emailAddress;
    const profileImageUrl = req.user.imageUrl || "";
    const username = req.user.username || email?.split('@')[0] || `user_${clerkId.slice(0, 8)}`;

    let userInDb = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
    });

    if (!userInDb) {
      console.log(`[AUTH] Creating new user for ${clerkId} (${username}).`);
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

    console.log(`[AUTH] Success: Profile verified for User ${clerkId}.`);
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
      pre_score: userInDb.pre_score,
      post_score: userInDb.post_score,
    });

  } catch (err) {
    console.error(`[ERROR] Failed to check profile for User ${clerkId}:`, err.message);
    res.json({ loggedIn: false, hasProfile: false });
  }
};

exports.updateUsername = async (req, res) => {
  const clerkId = req.user.id;
  const { username } = req.body;
  console.log(`[PROFILE] User ${clerkId} updating username to "${username}".`);

  try {
    if (!username || username.trim().length < 3) {
      console.warn(`[PROFILE] Warning: Invalid username "${username}" for User ${clerkId}.`);
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkId },
      data: { username: username.trim() },
    });

    console.log(`[PROFILE] Success: Username updated for User ${clerkId}.`);
    res.json({
      message: "Username updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error(`[ERROR] Failed to update username for User ${clerkId}:`, error.message);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update username" });
  }
};

exports.uploadProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} uploading profile image.`);

  try {
    if (!req.file) {
      console.warn(`[PROFILE] Warning: No file provided by User ${clerkId}.`);
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

    console.log(`[PROFILE] Success: Profile image uploaded for User ${clerkId}.`);
    res.json({
      message: "Profile image uploaded successfully",
      profileImageUrl: imageUrl,
      user: updatedUser,
    });

  } catch (error) {
    console.error(`[ERROR] Failed to upload profile image for User ${clerkId}:`, error.message);
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json({ message: "Failed to upload profile image" });
  }
};

exports.deleteProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} deleting profile image.`);

  try {
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

    console.log(`[PROFILE] Success: Profile image deleted for User ${clerkId}.`);
    res.json({
      message: "Profile image deleted successfully",
      profileImageUrl: updatedUser.profile_image,
    });

  } catch (error) {
    console.error(`[ERROR] Failed to delete profile image for User ${clerkId}:`, error.message);
    res.status(500).json({ message: "Failed to delete profile image" });
  }
};


exports.getUserByClerkId = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] Fetching details/progress for User ${clerkId}.`);

  try {
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
        pre_score: true,
        post_score: true,
        skill_level: true,
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

    console.log(`[PROFILE] Success: Retrieved details for User ${clerkId}.`);
    res.json(responseData);
  } catch (error) {
    console.error(`[ERROR] Failed to fetch details for User ${clerkId}:`, error.message);
    res.status(500).json({ message: "Error fetching user details" });
  }
};

exports.saveUserProgress = async (req, res) => {
  const clerkId = req.user.id;
  const { blockly_code, text_code, ...logBody } = req.body; // Log info excluding large code strings
  console.log(`[GAME] User ${clerkId} saving progress. Data:`, JSON.stringify(logBody));

  try {
    const {
      level_id,
      status,
      attempts_count,
      blockly_code,
      text_code,
      execution_time,
      best_score,
      pattern_bonus_score,
      is_correct,
      stars_earned,
      hp_remaining,
      user_big_o,
    } = req.body;

    // Validate required fields
    if (!level_id) {
      return res.status(400).json({ message: "level_id is required" });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: { user_id: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if progress already exists
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        user_id_level_id: {
          user_id: user.user_id,
          level_id: parseInt(level_id),
        },
      },
    });

    const now = new Date();
    const newStatus = status || (is_correct ? 'completed' : 'in_progress');
    const newBestScore = best_score || 0;
    const newTotalScore = newBestScore + (pattern_bonus_score || 0);
    const existingTotalScore = existingProgress
      ? existingProgress.best_score + (existingProgress.pattern_bonus_score || 0)
      : 0;

    let savedProgress;

    if (existingProgress) {
      // Determine if we should update the progress
      const existingStatus = existingProgress.status;

      // Status update logic:
      // 1. If changing from in_progress to completed → always update
      // 2. If already completed and new is also completed → update (if score is better or equal)
      // 3. If already completed and new is in_progress → keep completed (don't downgrade)
      // 4. If in_progress and new is in_progress → update (if score is better or equal)
      const shouldUpdateStatus =
        // Always update if changing from in_progress to completed
        (existingStatus === 'in_progress' && newStatus === 'completed') ||
        // Update if both are completed and new score is better or equal
        (existingStatus === 'completed' && newStatus === 'completed' && newTotalScore >= existingTotalScore) ||
        // Update if both are in_progress and new score is better or equal
        (existingStatus === 'in_progress' && newStatus === 'in_progress' && newTotalScore >= existingTotalScore);

      // If already completed and new attempt is in_progress, keep completed status
      const finalStatus = (existingStatus === 'completed' && newStatus === 'in_progress')
        ? existingStatus
        : (shouldUpdateStatus ? newStatus : existingStatus);

      // Score update logic:
      // 1. If changing from in_progress to completed → always update
      // 2. If new score is better or equal → update
      // 3. If already completed and new is in_progress → don't update score
      const shouldUpdateScore =
        // Always update if changing from in_progress to completed
        (existingStatus === 'in_progress' && newStatus === 'completed') ||
        // Update if new score is better or equal (and not downgrading from completed to in_progress)
        (newTotalScore >= existingTotalScore && !(existingStatus === 'completed' && newStatus === 'in_progress'));

      // Prepare update data
      const updateData = {
        last_attempt: now,
        attempts_count: attempts_count !== undefined
          ? attempts_count
          : existingProgress.attempts_count + 1,
      };

      // Update status based on finalStatus
      updateData.status = finalStatus;

      // Update score only if should update
      if (shouldUpdateScore) {
        updateData.best_score = newBestScore;
        updateData.pattern_bonus_score = pattern_bonus_score || 0;
        updateData.is_correct = is_correct || false;
        updateData.stars_earned = stars_earned || 0;
      } else {
        // Keep existing scores
        updateData.best_score = existingProgress.best_score;
        updateData.pattern_bonus_score = existingProgress.pattern_bonus_score;
        updateData.is_correct = existingProgress.is_correct;
        updateData.stars_earned = existingProgress.stars_earned;
      }

      // Always update code and execution time (latest attempt)
      updateData.blockly_code = blockly_code || existingProgress.blockly_code;
      updateData.text_code = text_code || existingProgress.text_code;
      updateData.execution_time = execution_time !== undefined ? execution_time : existingProgress.execution_time;
      updateData.hp_remaining = hp_remaining !== undefined ? hp_remaining : existingProgress.hp_remaining;
      updateData.user_big_o = user_big_o !== undefined ? user_big_o : existingProgress.user_big_o;

      // Keep first_attempt from existing record
      updateData.first_attempt = existingProgress.first_attempt;

      // Update completed_at if this is a correct solution and not already completed
      if (is_correct && !existingProgress.completed_at) {
        updateData.completed_at = now;
      } else if (is_correct && existingProgress.completed_at) {
        updateData.completed_at = existingProgress.completed_at;
      } else {
        updateData.completed_at = existingProgress.completed_at;
      }

      savedProgress = await prisma.userProgress.update({
        where: {
          progress_id: existingProgress.progress_id,
        },
        data: updateData,
      });
    } else {
      // Create new progress
      const progressData = {
        user_id: user.user_id,
        level_id: parseInt(level_id),
        status: newStatus,
        attempts_count: attempts_count || 1,
        blockly_code: blockly_code || null,
        text_code: text_code || null,
        execution_time: execution_time || null,
        best_score: newBestScore,
        pattern_bonus_score: pattern_bonus_score || 0,
        is_correct: is_correct || false,
        stars_earned: stars_earned || 0,
        first_attempt: now,
        last_attempt: now,
        completed_at: is_correct ? now : null,
        hp_remaining: hp_remaining !== undefined ? hp_remaining : null,
        user_big_o: user_big_o || null,
      };

      savedProgress = await prisma.userProgress.create({
        data: progressData,
      });
    }

    console.log(`[GAME] Success: Progress saved for User ${clerkId}.`);
    res.json({
      message: "User progress saved successfully",
      progress: savedProgress,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to save progress for User ${clerkId}:`, error.message);
    res.status(500).json({ message: "Error saving user progress", error: error.message });
  }
};

// Check and award rewards based on score
exports.checkAndAwardRewards = async (req, res) => {
  const clerkId = req.user.id;
  const { level_id, total_score } = req.body;
  console.log(`[GAME] Checking rewards for User ${clerkId} on Level ${level_id} (Score: ${total_score}).`);

  try {
    // Validate required fields
    if (!level_id || total_score === undefined) {
      return res.status(400).json({ message: "level_id and total_score are required" });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkId },
      select: { user_id: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all rewards for this level
    const rewards = await prisma.reward.findMany({
      where: {
        level_id: parseInt(level_id),
      },
    });

    if (rewards.length === 0) {
      console.log(`[GAME] No rewards configured for Level ${level_id}.`);
      return res.json({
        message: "No rewards found for this level",
        awardedRewards: [],
      });
    }

    // Get rewards that user has already earned
    const existingUserRewards = await prisma.userReward.findMany({
      where: {
        user_id: user.user_id,
        level_id: parseInt(level_id),
      },
      select: {
        reward_id: true,
      },
    });

    const earnedRewardIds = new Set(existingUserRewards.map(ur => ur.reward_id));

    // Filter rewards that:
    // 1. User hasn't earned yet
    // 2. User's score meets the required_score
    const eligibleRewards = rewards.filter(reward => {
      const notEarned = !earnedRewardIds.has(reward.reward_id);
      const scoreMet = total_score >= reward.required_score;
      return notEarned && scoreMet;
    });

    // Award eligible rewards
    const awardedRewards = [];
    for (const reward of eligibleRewards) {
      try {
        const userReward = await prisma.userReward.create({
          data: {
            user_id: user.user_id,
            reward_id: reward.reward_id,
            level_id: parseInt(level_id),
            earned_at: new Date(),
          },
          include: {
            reward: true,
          },
        });
        console.log(`[GAME] Awarded reward ${reward.reward_id} to User ${clerkId}.`);
        awardedRewards.push(userReward);
      } catch (error) {
        console.error(`[ERROR] Failed to award reward ${reward.reward_id} to User ${clerkId}:`, error.message);
        // Continue with other rewards even if one fails
      }
    }

    console.log(`[GAME] Success: Check complete. Awarded ${awardedRewards.length} new rewards to User ${clerkId}.`);
    res.json({
      message: "Rewards checked and awarded successfully",
      awardedRewards: awardedRewards,
      totalAwarded: awardedRewards.length,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to check rewards for User ${clerkId}:`, error.message);
    res.status(500).json({ message: "Error checking and awarding rewards", error: error.message });
  }
};