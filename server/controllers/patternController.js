const patternService = require("../services/patternService");
const { parsePagination } = require("../utils/pagination");

exports.createPattern = async (req, res) => {
  try { const pattern = await patternService.createPattern(req.body); res.status(201).json({ message: "Pattern created successfully", pattern }); }
  catch (e) { console.error("Error creating pattern:", e.message); res.status(e.status || 500).json({ message: e.message || "Error creating pattern" }); }
};

exports.getAllPatterns = async (req, res) => {
  try { res.json(await patternService.getAllPatterns(parsePagination(req.query), req.query.level_id)); }
  catch (e) { console.error("Error fetching patterns:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching patterns" }); }
};

exports.getPatternById = async (req, res) => {
  try { res.json(await patternService.getPatternById(parseInt(req.params.patternId))); }
  catch (e) { console.error("Error fetching pattern:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching pattern" }); }
};

exports.updatePattern = async (req, res) => {
  try { const pattern = await patternService.updatePattern(parseInt(req.params.patternId), req.body); res.json({ message: "Pattern updated successfully", pattern }); }
  catch (e) { console.error("Error updating pattern:", e.message); res.status(e.status || 500).json({ message: e.message || "Error updating pattern" }); }
};

exports.deletePattern = async (req, res) => {
  try { await patternService.deletePattern(parseInt(req.params.patternId)); res.json({ message: "Pattern deleted successfully" }); }
  catch (e) { console.error("Error deleting pattern:", e.message); res.status(e.status || 500).json({ message: e.message || "Error deleting pattern" }); }
};

exports.getPatternTypes = async (req, res) => {
  try { res.json(await patternService.getPatternTypes()); }
  catch (e) { console.error("Error fetching pattern types:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching pattern types" }); }
};

exports.unlockPattern = async (req, res) => {
  try { const pattern = await patternService.unlockPattern(parseInt(req.params.patternId)); res.json({ message: "Pattern unlocked successfully", pattern }); }
  catch (e) { console.error("Error unlocking pattern:", e.message); res.status(e.status || 500).json({ message: e.message || "Error unlocking pattern" }); }
};
