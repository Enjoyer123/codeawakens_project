import * as leaderboardService from "../services/leaderboardService.js";

export const getLeaderboard = async (req, res) => {
  try {
    const clerkId = req.user ? req.user.id : "anonymous";
    console.log(`[LEADERBOARD] User ${clerkId} viewing leaderboard.`);
    
    const result = await leaderboardService.getLeaderboard();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch leaderboard",
    });
  }
};
