const express = require("express");
const router = express.Router();
const authCheck = require("../middleware/authCheck");
const requireAdmin = require("../middleware/requireAdmin");

const {
  getAllVictoryConditions,
  getVictoryConditionById,
  createVictoryCondition,
  updateVictoryCondition,
  deleteVictoryCondition,
} = require("../controllers/victoryConditionController");

// Victory Condition CRUD routes
router.get("/victory-conditions", authCheck, requireAdmin, getAllVictoryConditions);
router.get("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, getVictoryConditionById);
router.post("/victory-conditions", authCheck, requireAdmin, createVictoryCondition);
router.put("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, updateVictoryCondition);
router.delete("/victory-conditions/:victoryConditionId", authCheck, requireAdmin, deleteVictoryCondition);

module.exports = router;

