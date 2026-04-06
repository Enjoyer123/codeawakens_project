const guideService = require("../services/guideService");
const levelService = require("../services/levelService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllGuides = async (req, res) => {
  try { res.json(await guideService.getAllGuides(parsePagination(req.query))); }
  catch (e) { console.error("Error fetching guides:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching guides" }); }
};
exports.getGuidesByLevel = async (req, res) => {
  try { res.json(await guideService.getGuidesByLevel(parseInt(req.params.levelId))); }
  catch (e) { console.error("Error fetching guides by level:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching guides by level" }); }
};
exports.getLevelsForGuide = async (req, res) => {
  try { res.json(await levelService.getLevelsForDropdown()); }
  catch (e) { console.error("Error fetching levels:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching levels" }); }
};
exports.getGuideById = async (req, res) => {
  try { res.json(await guideService.getGuideById(parseInt(req.params.guideId))); }
  catch (e) { console.error("Error fetching guide:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching guide" }); }
};
exports.createGuide = async (req, res) => {
  try { const guide = await guideService.createGuide(req.body); res.status(201).json({ message: "Guide created successfully", guide }); }
  catch (e) { console.error("Error creating guide:", e.message); res.status(e.status || 500).json({ message: e.message || "Error creating guide" }); }
};
exports.updateGuide = async (req, res) => {
  try { const guide = await guideService.updateGuide(parseInt(req.params.guideId), req.body); res.json({ message: "Guide updated successfully", guide }); }
  catch (e) { console.error("Error updating guide:", e.message); res.status(e.status || 500).json({ message: e.message || "Error updating guide" }); }
};
exports.deleteGuide = async (req, res) => {
  try { await guideService.deleteGuide(parseInt(req.params.guideId)); res.json({ message: "Guide deleted successfully" }); }
  catch (e) { console.error("Error deleting guide:", e.message); res.status(e.status || 500).json({ message: e.message || "Error deleting guide" }); }
};
exports.uploadGuideImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const guideImage = await guideService.uploadGuideImage(parseInt(req.params.guideId), req.file);
    res.status(201).json({ message: "Guide image uploaded successfully", guideImage });
  } catch (e) { console.error("Error uploading guide image:", e.message); cleanupTempFile(req.file); res.status(e.status || 500).json({ message: e.message || "Error uploading guide image" }); }
};
exports.deleteGuideImage = async (req, res) => {
  try { await guideService.deleteGuideImage(parseInt(req.params.imageId)); res.json({ message: "Guide image deleted successfully" }); }
  catch (e) { console.error("Error deleting guide image:", e.message); res.status(e.status || 500).json({ message: e.message || "Error deleting guide image" }); }
};
