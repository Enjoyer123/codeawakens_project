const blockService = require("../services/blockService");
const { parsePagination } = require("../utils/pagination");

exports.getAllBlocks = async (req, res) => {
  try { res.json(await blockService.getAllBlocks(parsePagination(req.query))); }
  catch (e) { console.error("Error fetching blocks:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching blocks" }); }
};
exports.getBlockById = async (req, res) => {
  try { res.json(await blockService.getBlockById(parseInt(req.params.blockId))); }
  catch (e) { console.error("Error fetching block:", e.message); res.status(e.status || 500).json({ message: e.message || "Error fetching block" }); }
};
exports.createBlock = async (req, res) => {
  try { const block = await blockService.createBlock(req.body); res.status(201).json({ message: "Block created successfully", block }); }
  catch (e) { console.error("Error creating block:", e.message); res.status(e.status || 500).json({ message: e.message || "Error creating block" }); }
};
exports.updateBlock = async (req, res) => {
  try { const block = await blockService.updateBlock(parseInt(req.params.blockId), req.body); res.json({ message: "Block updated successfully", block }); }
  catch (e) { console.error("Error updating block:", e.message); res.status(e.status || 500).json({ message: e.message || "Error updating block" }); }
};
exports.deleteBlock = async (req, res) => {
  try { await blockService.deleteBlock(parseInt(req.params.blockId)); res.json({ message: "Block deleted successfully" }); }
  catch (e) { console.error("Error deleting block:", e.message); res.status(e.status || 500).json({ message: e.message || "Error deleting block" }); }
};
exports.uploadBlockImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = `/uploads/blocks/${req.file.filename}`;
    res.json({ message: "Block image uploaded successfully", path: filePath, filename: req.file.filename });
  } catch (e) { console.error("Error uploading block image:", e.message); res.status(500).json({ message: "Upload failed" }); }
};
