const dashboardService = require("../services/dashboardService");

exports.getDashboardStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing dashboard stats.`);
    
    const result = await dashboardService.getDashboardStats();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({
      message: "Internal server error fetching dashboard statistics",
    });
  }
};

exports.getLevelStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing level statistics.`);
    
    const result = await dashboardService.getLevelStats();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching level stats:", error.message);
    res.status(500).json({
      message: "Internal server error fetching level statistics",
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing user statistics.`);
    
    const result = await dashboardService.getUserStats();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user stats:", error.message);
    res.status(500).json({
      message: "Internal server error fetching user statistics",
    });
  }
};

exports.getTestStats = async (req, res) => {
  try {
    const adminClerkId = req.user ? req.user.id : "unknown";
    console.log(`[ADMIN] Admin ${adminClerkId} viewing test statistics.`);
    
    const result = await dashboardService.getTestStats();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching test stats:", error.message);
    res.status(500).json({
      message: "Internal server error fetching test statistics",
    });
  }
};
