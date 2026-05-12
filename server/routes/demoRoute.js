import express from "express";
const router = express.Router();
import { getLevelById, getAllWeapons } from "../controllers/demoController.js";

/**
 * Public Demo Routes — No authentication required.
 * These endpoints expose read-only data for the landing page demo.
 */

// GET /demo/level/:levelId — Returns a specific level's full data (public)
router.get("/demo/level/:levelId", getLevelById);

// GET /demo/weapons — Returns all weapons (public, for seeding client-side cache)
router.get("/demo/weapons", getAllWeapons);

export default router;
