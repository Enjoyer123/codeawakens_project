import * as profileRepo from "../models/profileModel.js";
import * as levelRepo from "../models/levelModel.js";
import { calculateFinalScore } from "../utils/scoreUtils.js";
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
  const username =
    clerkUser.username || email?.split("@")[0] || `user_${clerkId.slice(0, 8)}`;

  let userInDb = await profileRepo.findUserByClerkId(clerkId);

  if (!userInDb) {
    console.log(`[AUTH] Creating new user for ${clerkId} (${username}).`);
    userInDb = await profileRepo.createUser({
      clerk_user_id: clerkId,
      username,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      profile_image: profileImageUrl || null,
      role: "user",
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
      userInDb = await profileRepo.updateUserByClerkId(clerkId, updateData);
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
};

export const updateUsername = async (clerkId, username) => {
  if (!username || username.trim().length < 3) {
    const err = new Error("Username must be at least 3 characters");
    err.status = 400;
    throw err;
  }

  try {
    const updatedUser = await profileRepo.updateUserByClerkId(clerkId, {
      username: username.trim(),
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
};

export const uploadProfileImage = async (clerkId, file) => {
  const currentUser = await profileRepo.findUserByClerkIdProfileImage(clerkId);

  // Delete old custom image
  if (
    currentUser?.profile_image &&
    !currentUser.profile_image.includes("clerk") &&
    !currentUser.profile_image.startsWith("http")
  ) {
    const oldImagePath = path.join(
      uploadDir,
      path.basename(currentUser.profile_image),
    );
    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
  }

  const imageUrl = `/uploads/userprofile/${file.filename}`;
  const updatedUser = await profileRepo.updateUserByClerkId(clerkId, {
    profile_image: imageUrl,
  });

  return { imageUrl, user: updatedUser };
};

export const deleteProfileImage = async (clerkUser) => {
  const clerkId = clerkUser.id;
  const currentUser = await profileRepo.findUserByClerkIdProfileImage(clerkId);

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
    const imagePath = path.join(
      uploadDir,
      path.basename(currentUser.profile_image),
    );
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }

  const clerkImage = clerkUser.imageUrl;
  const updatedUser = await profileRepo.updateUserByClerkId(clerkId, {
    profile_image: clerkImage,
  });

  return updatedUser.profile_image;
};

export const getUserByClerkId = async (clerkId) => {
  const user = await profileRepo.findUserByClerkIdDetailed(clerkId);

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const userProgress = await profileRepo.findUserProgressByUserId(user.user_id);
  const userRewards = await profileRepo.findUserRewardsByUserId(user.user_id);

  return { user, user_progress: userProgress, user_reward: userRewards };
};

export const saveUserProgress = async (clerkId, body) => {
  const {
    level_id,
    status,
    attempts_count,
    blockly_code,
    text_code,
    best_score,
    pattern_bonus_score,
    is_correct,
    stars_earned,
    hp_remaining,
    user_big_o,
  } = body;

  if (!level_id) {
    const err = new Error("level_id is required");
    err.status = 400;
    throw err;
  }

  const user = await profileRepo.findUserByClerkIdMinimal(clerkId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const existingProgress = await profileRepo.findUserProgressForLevel(
    user.user_id,
    parseInt(level_id),
  );

  // 🛡️ SECURITY: Fetch Level to get real requirements (Target Big O)
  const level = await levelRepo.findLevelById(parseInt(level_id));
  if (!level) {
    const err = new Error("Level not found");
    err.status = 404;
    throw err;
  }

  // 🛡️ SECURITY: Recalculate Score on Backend
  const isGameOver =
    status === "failed" || (!is_correct && status !== "completed");
  const targetBigO = level.expected_big_o || null;
  const calculated = calculateFinalScore(
    isGameOver,
    pattern_bonus_score || 0,
    user_big_o || null,
    targetBigO,
  );

  const newBestScore = calculated.totalScore;
  const backendStars = calculated.stars;
  const backendPatternBonus = calculated.patternBonusScore;

  const now = new Date();
  const newStatus = status || (is_correct ? "completed" : "in_progress");
  const newTotalScore = newBestScore; // totalScore from formula already includes pattern_bonus_score

  const existingTotalScore = existingProgress
    ? existingProgress.best_score // Assuming best_score stored in DB is already the totalScore, or maybe we need to be careful. In frontend calculation, totalScore = baseScore + pattern_bonus_score - bigOPenalty. Frontend passed totalScore as best_score.
    : 0;

  let savedProgress;

  if (existingProgress) {
    const existingStatus = existingProgress.status;

    const shouldUpdateStatus =
      (existingStatus === "in_progress" && newStatus === "completed") ||
      (existingStatus === "completed" &&
        newStatus === "completed" &&
        newTotalScore >= existingTotalScore) ||
      (existingStatus === "in_progress" &&
        newStatus === "in_progress" &&
        newTotalScore >= existingTotalScore);

    const finalStatus =
      existingStatus === "completed" && newStatus === "in_progress"
        ? existingStatus
        : shouldUpdateStatus
          ? newStatus
          : existingStatus;

    const shouldUpdateScore =
      (existingStatus === "in_progress" && newStatus === "completed") ||
      (newTotalScore >= existingTotalScore &&
        !(existingStatus === "completed" && newStatus === "in_progress"));

    const updateData = {
      last_attempt: now,
      attempts_count:
        attempts_count !== undefined
          ? attempts_count
          : existingProgress.attempts_count + 1,
      status: finalStatus,
      first_attempt: existingProgress.first_attempt,
    };

    if (shouldUpdateScore) {
      updateData.best_score = newBestScore;
      updateData.pattern_bonus_score = backendPatternBonus;
      updateData.is_correct = is_correct || false;
      updateData.stars_earned = backendStars;
      updateData.blockly_code = blockly_code || existingProgress.blockly_code;
      updateData.text_code = text_code || existingProgress.text_code;
      updateData.hp_remaining =
        hp_remaining !== undefined
          ? hp_remaining
          : existingProgress.hp_remaining;
      updateData.user_big_o =
        user_big_o !== undefined ? user_big_o : existingProgress.user_big_o;
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

    savedProgress = await profileRepo.updateUserProgress(
      existingProgress.progress_id,
      updateData,
    );
  } else {
    savedProgress = await profileRepo.createUserProgress({
      user_id: user.user_id,
      level_id: parseInt(level_id),
      status: newStatus,
      attempts_count: attempts_count || 1,
      blockly_code: blockly_code || null,
      text_code: text_code || null,
      best_score: newBestScore,
      pattern_bonus_score: backendPatternBonus,
      is_correct: is_correct || false,
      stars_earned: backendStars,
      first_attempt: now,
      last_attempt: now,
      completed_at: is_correct ? now : null,
      hp_remaining: hp_remaining !== undefined ? hp_remaining : null,
      user_big_o: user_big_o || null,
    });
  }

  return savedProgress;
};

export const checkAndAwardRewards = async (clerkId, levelId) => {
  if (!levelId) {
    const err = new Error("level_id is required");
    err.status = 400;
    throw err;
  }

  const user = await profileRepo.findUserByClerkIdMinimal(clerkId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // 🛡️ SECURITY: Fetch the actual score from the verified database record
  const progress = await profileRepo.findUserProgressForLevel(user.user_id, parseInt(levelId));
  const databaseScore = progress ? progress.best_score : 0;

  const rewards = await profileRepo.findRewardsForLevel(parseInt(levelId));

  if (rewards.length === 0) {
    return { awardedRewards: [], totalAwarded: 0 };
  }

  const existingUserRewards = await profileRepo.findUserRewardsForLevel(
    user.user_id,
    parseInt(levelId),
  );
  const earnedRewardIds = new Set(
    existingUserRewards.map((ur) => ur.reward_id),
  );

  const eligibleRewards = rewards.filter(
    (r) => !earnedRewardIds.has(r.reward_id) && databaseScore >= r.required_score,
  );

  const awardedRewards = [];
  for (const reward of eligibleRewards) {
    try {
      const userReward = await profileRepo.createUserReward(
        user.user_id,
        reward.reward_id,
        parseInt(levelId),
      );
      awardedRewards.push(userReward);
    } catch (error) {
      console.error(
        `[ERROR] Failed to award reward ${reward.reward_id}:`,
        error.message,
      );
    }
  }

  return { awardedRewards, totalAwarded: awardedRewards.length };
};
