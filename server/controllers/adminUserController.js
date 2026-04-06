import * as adminUserService from "../services/adminUserService.js";
import { parsePagination } from "../utils/pagination.js";

export const getAllUsers = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query, 5);
    const result = await adminUserService.getAllUsers(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching users",
    });
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
    res.status(200).json({
      message: "User role updated successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error updating user role:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating user role",
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await adminUserService.getUserDetails(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching user details",
    });
  }
};

export const deleteUser = async (req, res) => {
  const adminClerkId = req.user.id;
  const userId = parseInt(req.params.userId);
  
  console.log(`[ADMIN] Admin ${adminClerkId} attempting to delete User ${userId}.`);
  
  try {
    await adminUserService.deleteUser(userId, adminClerkId);
    
    console.log(`[ADMIN] Success: User ${userId} deleted by Admin ${adminClerkId}.`);
    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting user",
    });
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
    res.status(200).json({
      message: `Reset ${testType}-test score and history successfully`,
    });
  } catch (error) {
    console.error("Error resetting score:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error resetting score",
    });
  }
};

export const getUserTestHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await adminUserService.getUserTestHistory(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching test history:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching test history",
    });
  }
};
