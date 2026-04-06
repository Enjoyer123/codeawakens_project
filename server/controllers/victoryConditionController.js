const victoryConditionService = require("../services/victoryConditionService");
const { parsePagination } = require("../utils/pagination");

exports.getAllVictoryConditions = async (req, res) => {
  try { res.json(await victoryConditionService.getAllVictoryConditions(parsePagination(req.query))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching victory conditions" }); }
};
exports.getVictoryConditionById = async (req, res) => {
  try { const vc = await victoryConditionService.getVictoryConditionById(parseInt(req.params.victoryConditionId)); res.json({ victoryCondition: vc }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching victory condition" }); }
};
exports.createVictoryCondition = async (req, res) => {
  try { const vc = await victoryConditionService.createVictoryCondition(req.body); res.status(201).json({ message: "Victory condition created successfully", victoryCondition: vc }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating victory condition" }); }
};
exports.updateVictoryCondition = async (req, res) => {
  try { const vc = await victoryConditionService.updateVictoryCondition(parseInt(req.params.victoryConditionId), req.body); res.json({ message: "Victory condition updated successfully", victoryCondition: vc }); }
  catch (e) {
    if (e.code === "P2002") return res.status(409).json({ message: "A victory condition with this type already exists." });
    res.status(e.status || 500).json({ message: e.message || "Error updating victory condition" });
  }
};
exports.deleteVictoryCondition = async (req, res) => {
  try { await victoryConditionService.deleteVictoryCondition(parseInt(req.params.victoryConditionId)); res.json({ message: "Victory condition deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting victory condition" }); }
};
