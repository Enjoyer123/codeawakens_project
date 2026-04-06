const blockService = require("../services/blockService");
const { parsePagination } = require("../utils/pagination");

exports.getAllBlocks = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await blockService.getAllBlocks(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching blocks:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching blocks",
    });
  }
};

exports.getBlockById = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const result = await blockService.getBlockById(blockId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching block:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching block",
    });
  }
};

exports.createBlock = async (req, res) => {
  try {
    const result = await blockService.createBlock(req.body);
    
    res.status(201).json({
      message: "Block created successfully",
      block: result,
    });
  } catch (error) {
    console.error("Error creating block:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating block",
    });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    const result = await blockService.updateBlock(blockId, req.body);
    
    res.status(200).json({
      message: "Block updated successfully",
      block: result,
    });
  } catch (error) {
    console.error("Error updating block:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating block",
    });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const blockId = parseInt(req.params.blockId);
    await blockService.deleteBlock(blockId);
    
    res.status(200).json({
      message: "Block deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting block:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting block",
    });
  }
};

exports.uploadBlockImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const filePath = `/uploads/blocks/${req.file.filename}`;
    res.status(200).json({
      message: "Block image uploaded successfully",
      path: filePath,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading block image:", error.message);
    res.status(500).json({
      message: "Upload failed",
    });
  }
};
