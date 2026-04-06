import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  getAllUsers,
  updateUserRole,
  getUserDetails,

  deleteUser,
  resetUserTestScore,
  getUserTestHistory
} from "../controllers/adminUserController.js";

router.get("/users", authCheck, requireAdmin, getAllUsers);
router.get("/users/:userId/details", authCheck, requireAdmin, getUserDetails);
router.put("/users/:userId/role", authCheck, requireAdmin, updateUserRole);
router.delete("/users/:userId", authCheck, requireAdmin, deleteUser);
router.post("/users/:userId/reset-test", authCheck, requireAdmin, resetUserTestScore);
router.get("/users/:userId/tests", authCheck, requireAdmin, getUserTestHistory);

export default router;
