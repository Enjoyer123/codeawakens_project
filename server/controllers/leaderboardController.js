const leaderboardService = require("../services/leaderboardService");

exports.getLeaderboard = async (req, res) => {
  const clerkId = req.user?.id || "anonymous";
  console.log(`[LEADERBOARD] User ${clerkId} viewing leaderboard.`);
  try { res.status(200).json(await leaderboardService.getLeaderboard()); }
  catch (e) { console.error("Error fetching leaderboard:", e.message); res.status(500).json({ error: "Failed to fetch leaderboard" }); }
};
