import * as profileService from "../services/profileService.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const checkProfile = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[AUTH] User ${clerkId} checking profile.`);
  
  try {
    const result = await profileService.checkProfile(req.user);
    
    console.log(`[AUTH] Success: Profile verified for User ${clerkId}.`);
    sendSuccess(res, result, "Profile verified");
  } catch (error) {
    console.error(`[ERROR] Failed to check profile for User ${clerkId}:`, error.message);
    // Keep the original fallback behavior for auth check
    sendSuccess(res, { loggedIn: false, hasProfile: false }, "Profile check failed");
  }
};

export const updateUsername = async (req, res) => {
  const clerkId = req.user.id;
  const { username } = req.body;
  console.log(`[PROFILE] User ${clerkId} updating username to "${username}".`);
  
  try {
    const updatedUser = await profileService.updateUsername(clerkId, username);
    
    console.log(`[PROFILE] Success: Username updated for User ${clerkId}.`);
    sendSuccess(res, { user: updatedUser }, "อัปเดตชื่อผู้ใช้สำเร็จ");
  } catch (error) {
    console.error(`[ERROR] Failed to update username for User ${clerkId}:`, error.message);
    sendError(res, error.message || "Failed to update username", error.status || 500);
  }
};

export const uploadProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} uploading profile image.`);
  
  try {
    if (!req.file) {
      return sendError(res, "No image file provided", 400);
    }
    
    const result = await profileService.uploadProfileImage(clerkId, req.file);
    
    console.log(`[PROFILE] Success: Profile image uploaded for User ${clerkId}.`);
    sendSuccess(res, { profileImageUrl: result.imageUrl, user: result.user }, "Profile image uploaded successfully");
  } catch (error) {
    console.error(`[ERROR] Failed to upload profile image for User ${clerkId}:`, error.message);
    cleanupTempFile(req.file);
    sendError(res, "Failed to upload profile image", 500);
  }
};

export const deleteProfileImage = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] User ${clerkId} deleting profile image.`);
  
  try {
    const profileImageUrl = await profileService.deleteProfileImage(req.user);
    
    console.log(`[PROFILE] Success: Profile image deleted for User ${clerkId}.`);
    sendSuccess(res, { profileImageUrl }, "ลบรูปโปรไฟล์สำเร็จ");
  } catch (error) {
    console.error(`[ERROR] Failed to delete profile image for User ${clerkId}:`, error.message);
    sendError(res, error.message || "Failed to delete profile image", error.status || 500);
  }
};

export const getUserByClerkId = async (req, res) => {
  const clerkId = req.user.id;
  console.log(`[PROFILE] Fetching details/progress for User ${clerkId}.`);
  
  try {
    const result = await profileService.getUserByClerkId(clerkId);
    
    console.log(`[PROFILE] Success: Retrieved details for User ${clerkId}.`);
    sendSuccess(res, result, "User details ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error(`[ERROR] Failed to fetch details for User ${clerkId}:`, error.message);
    sendError(res, error.message || "Error fetching user details", error.status || 500);
  }
};

export const saveUserProgress = async (req, res) => {
  const clerkId = req.user.id;
  const { blockly_code, text_code, ...logBody } = req.body;
  console.log(`[GAME] User ${clerkId} saving progress. Data:`, JSON.stringify(logBody));
  
  try {
    const progress = await profileService.saveUserProgress(clerkId, req.body);
    
    console.log(`[GAME] Success: Progress saved for User ${clerkId}.`);
    sendSuccess(res, { progress }, "User progress saved successfully");
  } catch (error) {
    console.error(`[ERROR] Failed to save progress for User ${clerkId}:`, error.message);
    sendError(res, error.message || "Error saving user progress", error.status || 500);
  }
};

export const checkAndAwardRewards = async (req, res) => {
  const clerkId = req.user.id;
  const { level_id } = req.body;
  console.log(`[GAME] Checking rewards for User ${clerkId} on Level ${level_id}.`);
  
  try {
    const result = await profileService.checkAndAwardRewards(clerkId, level_id);
    
    console.log(`[GAME] Success: Awarded ${result.totalAwarded} new rewards to User ${clerkId}.`);
    sendSuccess(res, result, "Rewards checked and awarded successfully");
  } catch (error) {
    console.error(`[ERROR] Failed to check rewards for User ${clerkId}:`, error.message);
    sendError(res, error.message || "Error checking and awarding rewards", error.status || 500);
  }
};
