const dashboardService = require("../services/dashboardService");

exports.getDashboardStats = async (req, res) => {
  const adminClerkId = req.user?.id || "unknown";
  console.log(`[ADMIN] Admin ${adminClerkId} viewing dashboard stats.`);
  try { res.json(await dashboardService.getDashboardStats()); }
  catch (e) { res.status(500).json({ message: "Internal server error" }); }
};
exports.getLevelStats = async (req, res) => {
  const adminClerkId = req.user?.id || "unknown";
  console.log(`[ADMIN] Admin ${adminClerkId} viewing level statistics.`);
  try { res.json(await dashboardService.getLevelStats()); }
  catch (e) { res.status(500).json({ message: "Internal server error" }); }
};
exports.getUserStats = async (req, res) => {
  const adminClerkId = req.user?.id || "unknown";
  console.log(`[ADMIN] Admin ${adminClerkId} viewing user statistics.`);
  try { res.json(await dashboardService.getUserStats()); }
  catch (e) { res.status(500).json({ message: "Internal server error" }); }
};
exports.getTestStats = async (req, res) => {
  const adminClerkId = req.user?.id || "unknown";
  console.log(`[ADMIN] Admin ${adminClerkId} viewing test statistics.`);
  try { res.json(await dashboardService.getTestStats()); }
  catch (e) { res.status(500).json({ message: "Internal server error" }); }
};
