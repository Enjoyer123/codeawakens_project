const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard/stats", dashboardController.getDashboardStats);
router.get("/dashboard/levels", dashboardController.getLevelStats);
router.get("/dashboard/users", dashboardController.getUserStats);
router.get("/dashboard/tests", dashboardController.getTestStats);

module.exports = router;
