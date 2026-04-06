import express from "express";
const router = express.Router();
import authCheck from "../middleware/authCheck.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  getAllVictoryConditions,
  getVictoryConditionById,
  updateVictoryCondition,
  deleteVictoryCondition,
  createVictoryCondition,
} from "../controllers/victoryConditionController.js";

// Victory Condition CRUD routes
router.get("/victory-conditions", authCheck, requireAdmin, getAllVictoryConditions);
router.get("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, getVictoryConditionById);
router.post("/victory-conditions", authCheck, requireAdmin, createVictoryCondition);

router.put("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, updateVictoryCondition);
router.delete("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, deleteVictoryCondition);

export default router;

