import * as adminUserService from "../services/adminUserService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllUsers = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query, 5);
    const result = await adminUserService.getAllUsers(paginationData);
    
    sendSuccess(res, result, "Users fetched successfully");
  } catch (error) {
    console.error("Error fetching users:", error.message);
    sendError(res, error.message || "Error fetching users", error.status || 500);
  }
};

export const updateUserRole = async (req, res) => {
  const adminClerkId = req.user.id;
  const userId = parseInt(req.params.userId);
  const role = req.body.role;
  
  console.log(`[ADMIN] Admin ${adminClerkId} updating role for User ${userId} to "${role}".`);
  
  try {
    const result = await adminUserService.updateUserRole(userId, role, adminClerkId);
    
    console.log(`[ADMIN] Success: User ${userId} role changed to "${role}" by Admin ${adminClerkId}.`);
    sendSuccess(res, { user: result }, "User role updated successfully");
  } catch (error) {
    console.error("Error updating user role:", error.message);
    sendError(res, error.message || "Error updating user role", error.status || 500);
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await adminUserService.getUserDetails(userId);
    
    sendSuccess(res, result, "User details fetched successfully");
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    sendError(res, error.message || "Error fetching user details", error.status || 500);
  }
};

export const deleteUser = async (req, res) => {
  const adminClerkId = req.user.id;
  const userId = parseInt(req.params.userId);
  
  console.log(`[ADMIN] Admin ${adminClerkId} attempting to delete User ${userId}.`);
  
  try {
    await adminUserService.deleteUser(userId, adminClerkId);
    
    console.log(`[ADMIN] Success: User ${userId} deleted by Admin ${adminClerkId}.`);
    sendSuccess(res, null, "User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error.message);
    sendError(res, error.message || "Error deleting user", error.status || 500);
  }
};

export const resetUserTestScore = async (req, res) => {
  const adminClerkId = req.user.id;
  const userId = parseInt(req.params.userId);
  const testType = req.body.type;
  
  console.log(`[ADMIN] Admin ${adminClerkId} resetting ${testType}-test score for User ${userId}.`);
  
  try {
    await adminUserService.resetUserTestScore(userId, testType);
    
    console.log(`[ADMIN] Success: Reset ${testType}-test score for User ${userId} by Admin ${adminClerkId}.`);
    sendSuccess(res, null, `Reset ${testType}-test score and history successfully`);
  } catch (error) {
    console.error("Error resetting score:", error.message);
    sendError(res, error.message || "Error resetting score", error.status || 500);
  }
};

export const getUserTestHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await adminUserService.getUserTestHistory(userId);
    
    sendSuccess(res, result, "User test history fetched successfully");
  } catch (error) {
    console.error("Error fetching test history:", error.message);
    sendError(res, error.message || "Error fetching test history", error.status || 500);
  }
};
