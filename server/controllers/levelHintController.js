const levelHintService = require("../services/levelHintService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllLevelHints = async (req, res) => {
  try { res.json(await levelHintService.getAllLevelHints(parsePagination(req.query))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching level hints" }); }
};
exports.getHintsByLevelId = async (req, res) => {
  try { res.json(await levelHintService.getHintsByLevelId(parseInt(req.params.levelId))); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error fetching hints for level" }); }
};
exports.createLevelHint = async (req, res) => {
  try { const hint = await levelHintService.createLevelHint(req.body); res.status(201).json({ message: "Level hint created successfully", hint }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error creating level hint" }); }
};
exports.updateLevelHint = async (req, res) => {
  try { const hint = await levelHintService.updateLevelHint(parseInt(req.params.hintId), req.body); res.json({ message: "Level hint updated successfully", hint }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error updating level hint" }); }
};
exports.deleteLevelHint = async (req, res) => {
  try { await levelHintService.deleteLevelHint(parseInt(req.params.hintId)); res.json({ message: "Level hint deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting level hint" }); }
};
exports.uploadHintImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const hintImage = await levelHintService.uploadHintImage(parseInt(req.params.hintId), req.file);
    res.status(201).json({ message: "Level hint image uploaded successfully", hintImage });
  } catch (e) { cleanupTempFile(req.file); res.status(e.status || 500).json({ message: e.message || "Error uploading level hint image" }); }
};
exports.deleteHintImage = async (req, res) => {
  try { await levelHintService.deleteHintImage(parseInt(req.params.imageId)); res.json({ message: "Level hint image deleted successfully" }); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || "Error deleting level hint image" }); }
};
