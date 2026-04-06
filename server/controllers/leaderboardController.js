import * as leaderboardService from "../services/leaderboardService.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getLeaderboard = async (req, res) => {
  try {
    const clerkId = req.user ? req.user.id : "anonymous";
    console.log(`[LEADERBOARD] User ${clerkId} viewing leaderboard.`);
    
    const result = await leaderboardService.getLeaderboard();
    
    sendSuccess(res, result, "Leaderboard fetched successfully");
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message);
    sendError(res, error.message || "Failed to fetch leaderboard", error.status || 500);
  }
};
