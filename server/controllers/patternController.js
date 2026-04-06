const patternService = require("../services/patternService");
const { parsePagination } = require("../utils/pagination");

exports.createPattern = async (req, res) => {
  try {
    const result = await patternService.createPattern(req.body);
    
    res.status(201).json({
      message: "Pattern created successfully",
      pattern: result,
    });
  } catch (error) {
    console.error("Error creating pattern:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating pattern",
    });
  }
};

exports.getAllPatterns = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await patternService.getAllPatterns(paginationData, req.query.level_id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching patterns:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching patterns",
    });
  }
};

exports.getPatternById = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.getPatternById(patternId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching pattern:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching pattern",
    });
  }
};

exports.updatePattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.updatePattern(patternId, req.body);
    
    res.status(200).json({
      message: "Pattern updated successfully",
      pattern: result,
    });
  } catch (error) {
    console.error("Error updating pattern:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating pattern",
    });
  }
};

exports.deletePattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    await patternService.deletePattern(patternId);
    
    res.status(200).json({
      message: "Pattern deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pattern:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting pattern",
    });
  }
};

exports.getPatternTypes = async (req, res) => {
  try {
    const result = await patternService.getPatternTypes();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching pattern types:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching pattern types",
    });
  }
};

exports.unlockPattern = async (req, res) => {
  try {
    const patternId = parseInt(req.params.patternId);
    const result = await patternService.unlockPattern(patternId);
    
    res.status(200).json({
      message: "Pattern unlocked successfully",
      pattern: result,
    });
  } catch (error) {
    console.error("Error unlocking pattern:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error unlocking pattern",
    });
  }
};
