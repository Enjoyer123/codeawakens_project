import * as profileService from "../services/profileService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";

export const checkProfile = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[AUTH] User ${clerkId} checking profile.`);
  
  try {
    const result = await profileService.checkProfile(req.user);
    
    console.log(`[AUTH] Success: Profile verified for User ${clerkId}.`);
    res.status(200).json(result);
  } catch (error) {
    console.error(`[ERROR] Failed to check profile for User ${clerkId}:`, error.message);
    res.status(200).json({ loggedIn: false, hasProfile: false });
  }
};

export const updateUsername = async (req, res) => {
  const clerkId = req.user.id;
  const { username } = req.body;
  console.log(`[PROFILE] User ${clerkId} updating username to "${username}".`);
  
  try {
    const updatedUser = await profileService.updateUsername(clerkId, username);
    
    console.log(`[PROFILE] Success: Username updated for User ${clerkId}.`);
    res.status(200).json({
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to update username for User ${clerkId}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message || "Failed to update username",
    });
  }
};

export const uploadProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} uploading profile image.`);
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    
    const result = await profileService.uploadProfileImage(clerkId, req.file);
    
    console.log(`[PROFILE] Success: Profile image uploaded for User ${clerkId}.`);
    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImageUrl: result.imageUrl,
      user: result.user,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to upload profile image for User ${clerkId}:`, error.message);
    cleanupTempFile(req.file);
    res.status(500).json({
      message: "Failed to upload profile image",
    });
  }
};

export const deleteProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} deleting profile image.`);
  
  try {
    const profileImageUrl = await profileService.deleteProfileImage(req.user);
    
    console.log(`[PROFILE] Success: Profile image deleted for User ${clerkId}.`);
    res.status(200).json({
      message: "Profile image deleted successfully",
      profileImageUrl,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to delete profile image for User ${clerkId}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message || "Failed to delete profile image",
    });
  }
};

export const getUserByClerkId = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] Fetching details/progress for User ${clerkId}.`);
  
  try {
    const result = await profileService.getUserByClerkId(clerkId);
    
    console.log(`[PROFILE] Success: Retrieved details for User ${clerkId}.`);
    res.status(200).json(result);
  } catch (error) {
    console.error(`[ERROR] Failed to fetch details for User ${clerkId}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching user details",
    });
  }
};

export const saveUserProgress = async (req, res) => {
  const clerkId = req.user.id;
  const { blockly_code, text_code, ...logBody } = req.body;
  console.log(`[GAME] User ${clerkId} saving progress. Data:`, JSON.stringify(logBody));
  
  try {
    const progress = await profileService.saveUserProgress(clerkId, req.body);
    
    console.log(`[GAME] Success: Progress saved for User ${clerkId}.`);
    res.status(200).json({
      message: "User progress saved successfully",
      progress,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to save progress for User ${clerkId}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error saving user progress",
    });
  }
};

export const checkAndAwardRewards = async (req, res) => {
  const clerkId = req.user.id;
  const { level_id, total_score } = req.body;
  console.log(`[GAME] Checking rewards for User ${clerkId} on Level ${level_id} (Score: ${total_score}).`);
  
  try {
    const result = await profileService.checkAndAwardRewards(clerkId, level_id, total_score);
    
    console.log(`[GAME] Success: Awarded ${result.totalAwarded} new rewards to User ${clerkId}.`);
    res.status(200).json({
      message: "Rewards checked and awarded successfully",
      ...result,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to check rewards for User ${clerkId}:`, error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error checking and awarding rewards",
    });
  }
};
