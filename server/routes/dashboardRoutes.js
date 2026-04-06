import express from "express";
const router = express.Router();
import { getDashboardStats, getLevelStats, getUserStats, getTestStats } from "../controllers/dashboardController.js";

router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/levels", getLevelStats);
router.get("/dashboard/users", getUserStats);
router.get("/dashboard/tests", getTestStats);

export default router;
