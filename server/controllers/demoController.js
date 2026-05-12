/**
 * Demo Controller — Public endpoints for the landing page demo.
 * No Clerk authentication required. Read-only access only.
 */

import * as levelService from "../services/levelService.js";
import * as weaponService from "../services/weaponService.js";
import { parsePagination } from "../utils/pagination.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

/**
 * GET /api/demo/level/:levelId
 * Returns full level data for the demo without requiring auth.
 * req.user is undefined — levelService handles this gracefully (no user progress).
 */
export const getLevelById = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    if (isNaN(levelId)) {
      return sendError(res, "Invalid level ID", 400);
    }
    // Pass null as clerkUserId so levelService skips user progress lookup
    const result = await levelService.getLevelById(levelId, false, null);
    sendSuccess(res, result, "Demo level ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("[Demo] Error fetching level:", error.message);
    sendError(res, error.message || "Error fetching demo level", error.status || 500);
  }
};

/**
 * GET /api/demo/weapons
 * Returns all weapons for the demo without requiring auth.
 */
export const getAllWeapons = async (req, res) => {
  try {
    const paginationData = parsePagination({ page: 1, limit: 1000 });
    const result = await weaponService.getAllWeapons(paginationData);
    sendSuccess(res, result, "Demo weapons ดึงข้อมูลสำเร็จ");
  } catch (error) {
    console.error("[Demo] Error fetching weapons:", error.message);
    sendError(res, error.message || "Error fetching demo weapons", error.status || 500);
  }
};
