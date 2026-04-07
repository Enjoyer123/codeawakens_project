import express from "express";
const router = express.Router();
import { getLeaderboard } from "../controllers/leaderboardController.js";

/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Global rankings and leaderboards
 */

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Leaderboard data successfully retrieved.
 */
router.get('/leaderboard', getLeaderboard);

export default router;
