import prisma from "../models/prisma.js";
import { safeDeleteFile } from "../utils/fileHelper.js";
import { uploadDir } from "../middleware/upload.js";
import path from "path";
import fs from "fs";

export const checkProfile = async (clerkUser) => {
  const clerkId = clerkUser.id;
  const firstName = clerkUser.firstName || "";
  const lastName = clerkUser.lastName || "";
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  const profileImageUrl = clerkUser.imageUrl || "";
  const username = clerkUser.username || email?.split("@")[0] || `user_${clerkId.slice(0, 8)}`;

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

  return {
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
  };
}

export const updateUsername = async (clerkId, username) => {
  if (!username || username.trim().length < 3) {
    const err = new Error("Username must be at least 3 characters");
    err.status = 400;
    throw err;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkId },
      data: { username: username.trim() },
    });
    return updatedUser;
  } catch (error) {
    if (error.code === "P2025") {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    throw error;
  }
}

export const uploadProfileImage = async (clerkId, file) => {
  const currentUser = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: { profile_image: true },
  });

  // Delete old custom image
  if (
    currentUser?.profile_image &&
    !currentUser.profile_image.includes("clerk") &&
    !currentUser.profile_image.startsWith("http")
  ) {
    const oldImagePath = path.join(uploadDir, path.basename(currentUser.profile_image));
    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
  }

  const imageUrl = `/uploads/userprofile/${file.filename}`;
  const updatedUser = await prisma.user.update({
    where: { clerk_user_id: clerkId },
    data: { profile_image: imageUrl },
  });

  return { imageUrl, user: updatedUser };
}

export const deleteProfileImage = async (clerkUser) => {
  const clerkId = clerkUser.id;
  const currentUser = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: { profile_image: true },
  });

  if (!currentUser) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (
    currentUser.profile_image &&
    !currentUser.profile_image.includes("clerk") &&
    !currentUser.profile_image.startsWith("http")
  ) {
    const imagePath = path.join(uploadDir, path.basename(currentUser.profile_image));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  const clerkImage = clerkUser.imageUrl;
  const updatedUser = await prisma.user.update({
    where: { clerk_user_id: clerkId },
    data: { profile_image: clerkImage },
  });

  return updatedUser.profile_image;
}

export const getUserByClerkId = async (clerkId) => {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: {
      user_id: true, clerk_user_id: true, username: true, email: true,
      first_name: true, last_name: true, profile_image: true, role: true,
      is_active: true, created_at: true, updated_at: true,
      pre_score: true, post_score: true, skill_level: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const userProgress = await prisma.userProgress.findMany({
    where: { user_id: user.user_id },
    orderBy: { completed_at: "desc" },
  });

  const userRewards = await prisma.userReward.findMany({
    where: { user_id: user.user_id },
    include: { reward: true },
    orderBy: { earned_at: "desc" },
  });

  return { user, user_progress: userProgress, user_reward: userRewards };
}

export const saveUserProgress = async (clerkId, body) => {
  const {
    level_id, status, attempts_count, blockly_code, text_code,
    best_score, pattern_bonus_score, is_correct, stars_earned,
    hp_remaining, user_big_o,
  } = body;

  if (!level_id) {
    const err = new Error("level_id is required");
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: { user_id: true },
  });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const existingProgress = await prisma.userProgress.findUnique({
    where: { user_id_level_id: { user_id: user.user_id, level_id: parseInt(level_id) } },
  });

  const now = new Date();
  const newStatus = status || (is_correct ? "completed" : "in_progress");
  const newBestScore = best_score || 0;
  const newTotalScore = newBestScore + (pattern_bonus_score || 0);
  const existingTotalScore = existingProgress
    ? existingProgress.best_score + (existingProgress.pattern_bonus_score || 0)
    : 0;

  let savedProgress;

  if (existingProgress) {
    const existingStatus = existingProgress.status;

    const shouldUpdateStatus =
      (existingStatus === "in_progress" && newStatus === "completed") ||
      (existingStatus === "completed" && newStatus === "completed" && newTotalScore >= existingTotalScore) ||
      (existingStatus === "in_progress" && newStatus === "in_progress" && newTotalScore >= existingTotalScore);

    const finalStatus =
      existingStatus === "completed" && newStatus === "in_progress"
        ? existingStatus
        : shouldUpdateStatus ? newStatus : existingStatus;

    const shouldUpdateScore =
      (existingStatus === "in_progress" && newStatus === "completed") ||
      (newTotalScore >= existingTotalScore && !(existingStatus === "completed" && newStatus === "in_progress"));

    const updateData = {
      last_attempt: now,
      attempts_count: attempts_count !== undefined ? attempts_count : existingProgress.attempts_count + 1,
      status: finalStatus,
      first_attempt: existingProgress.first_attempt,
    };

    if (shouldUpdateScore) {
      updateData.best_score = newBestScore;
      updateData.pattern_bonus_score = pattern_bonus_score || 0;
      updateData.is_correct = is_correct || false;
      updateData.stars_earned = stars_earned || 0;
      updateData.blockly_code = blockly_code || existingProgress.blockly_code;
      updateData.text_code = text_code || existingProgress.text_code;
      updateData.hp_remaining = hp_remaining !== undefined ? hp_remaining : existingProgress.hp_remaining;
      updateData.user_big_o = user_big_o !== undefined ? user_big_o : existingProgress.user_big_o;
    } else {
      updateData.best_score = existingProgress.best_score;
      updateData.pattern_bonus_score = existingProgress.pattern_bonus_score;
      updateData.is_correct = existingProgress.is_correct;
      updateData.stars_earned = existingProgress.stars_earned;
      updateData.blockly_code = existingProgress.blockly_code;
      updateData.text_code = existingProgress.text_code;
      updateData.hp_remaining = existingProgress.hp_remaining;
      updateData.user_big_o = existingProgress.user_big_o;
    }

    if (is_correct && !existingProgress.completed_at) {
      updateData.completed_at = now;
    } else {
      updateData.completed_at = existingProgress.completed_at;
    }

    savedProgress = await prisma.userProgress.update({
      where: { progress_id: existingProgress.progress_id },
      data: updateData,
    });
  } else {
    savedProgress = await prisma.userProgress.create({
      data: {
        user_id: user.user_id,
        level_id: parseInt(level_id),
        status: newStatus,
        attempts_count: attempts_count || 1,
        blockly_code: blockly_code || null,
        text_code: text_code || null,
        best_score: newBestScore,
        pattern_bonus_score: pattern_bonus_score || 0,
        is_correct: is_correct || false,
        stars_earned: stars_earned || 0,
        first_attempt: now,
        last_attempt: now,
        completed_at: is_correct ? now : null,
        hp_remaining: hp_remaining !== undefined ? hp_remaining : null,
        user_big_o: user_big_o || null,
      },
    });
  }

  return savedProgress;
}

export const checkAndAwardRewards = async (clerkId, levelId, totalScore) => {
  if (!levelId || totalScore === undefined) {
    const err = new Error("level_id and total_score are required");
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: { user_id: true },
  });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const rewards = await prisma.reward.findMany({
    where: { level_id: parseInt(levelId) },
  });

  if (rewards.length === 0) {
    return { awardedRewards: [], totalAwarded: 0 };
  }

  const existingUserRewards = await prisma.userReward.findMany({
    where: { user_id: user.user_id, level_id: parseInt(levelId) },
    select: { reward_id: true },
  });
  const earnedRewardIds = new Set(existingUserRewards.map((ur) => ur.reward_id));

  const eligibleRewards = rewards.filter(
    (r) => !earnedRewardIds.has(r.reward_id) && totalScore >= r.required_score
  );

  const awardedRewards = [];
  for (const reward of eligibleRewards) {
    try {
      const userReward = await prisma.userReward.create({
        data: {
          user_id: user.user_id,
          reward_id: reward.reward_id,
          level_id: parseInt(levelId),
          earned_at: new Date(),
        },
        include: { reward: true },
      });
      awardedRewards.push(userReward);
    } catch (error) {
      console.error(`[ERROR] Failed to award reward ${reward.reward_id}:`, error.message);
    }
  }

  return { awardedRewards, totalAwarded: awardedRewards.length };
}


