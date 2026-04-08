import * as dashboardService from "../services/dashboardService.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getDashboardStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing dashboard stats.`);
    
    const result = await dashboardService.getDashboardStats();
    
    sendSuccess(res, result, "Dashboard stats ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    sendError(res, error.message || "Internal server error fetching dashboard statistics", error.status || 500);
  }
};

export const getLevelStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing level statistics.`);
    
    const result = await dashboardService.getLevelStats();
    
    sendSuccess(res, result, "Level stats ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching level stats:", error.message);
    sendError(res, error.message || "Internal server error fetching level statistics", error.status || 500);
  }
};

export const getUserStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing user statistics.`);
    
    const result = await dashboardService.getUserStats();
    
    sendSuccess(res, result, "User stats ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching user stats:", error.message);
    sendError(res, error.message || "Internal server error fetching user statistics", error.status || 500);
  }
};

export const getTestStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing test statistics.`);
    
    const result = await dashboardService.getTestStats();
    
    sendSuccess(res, result, "Test stats ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("Error fetching test stats:", error.message);
    sendError(res, error.message || "Internal server error fetching test statistics", error.status || 500);
  }
};
