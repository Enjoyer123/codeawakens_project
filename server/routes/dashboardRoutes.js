import express from "express";
const router = express.Router();
import { getDashboardStats, getLevelStats, getUserStats, getTestStats } from "../controllers/dashboardController.js";

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard statistics and metrics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get overall dashboard statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats successfully retrieved.
 */
router.get("/dashboard/stats", getDashboardStats);

/**
 * @swagger
 * /dashboard/levels:
 *   get:
 *     summary: Get statistics per level
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Level stats successfully retrieved.
 */
router.get("/dashboard/levels", getLevelStats);

/**
 * @swagger
 * /dashboard/users:
 *   get:
 *     summary: Get user registration and engagement statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: User stats successfully retrieved.
 */
router.get("/dashboard/users", getUserStats);

/**
 * @swagger
 * /dashboard/tests:
 *   get:
 *     summary: Get test performance statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Test stats successfully retrieved.
 */
router.get("/dashboard/tests", getTestStats);

export default router;
