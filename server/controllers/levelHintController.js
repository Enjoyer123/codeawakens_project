const levelHintService = require("../services/levelHintService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllLevelHints = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await levelHintService.getAllLevelHints(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching level hints:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching level hints",
    });
  }
};

exports.getHintsByLevelId = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelHintService.getHintsByLevelId(levelId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching hints for level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching hints for level",
    });
  }
};

exports.createLevelHint = async (req, res) => {
  try {
    const result = await levelHintService.createLevelHint(req.body);
    
    res.status(201).json({
      message: "Level hint created successfully",
      hint: result,
    });
  } catch (error) {
    console.error("Error creating level hint:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating level hint",
    });
  }
};

exports.updateLevelHint = async (req, res) => {
  try {
    const hintId = parseInt(req.params.hintId);
    const result = await levelHintService.updateLevelHint(hintId, req.body);
    
    res.status(200).json({
      message: "Level hint updated successfully",
      hint: result,
    });
  } catch (error) {
    console.error("Error updating level hint:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating level hint",
    });
  }
};

exports.deleteLevelHint = async (req, res) => {
  try {
    const hintId = parseInt(req.params.hintId);
    await levelHintService.deleteLevelHint(hintId);
    
    res.status(200).json({
      message: "Level hint deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level hint:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting level hint",
    });
  }
};

exports.uploadHintImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const hintId = parseInt(req.params.hintId);
    const result = await levelHintService.uploadHintImage(hintId, req.file);
    
    res.status(201).json({
      message: "Level hint image uploaded successfully",
      hintImage: result,
    });
  } catch (error) {
    console.error("Error uploading level hint image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error uploading level hint image",
    });
  }
};

exports.deleteHintImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await levelHintService.deleteHintImage(imageId);
    
    res.status(200).json({
      message: "Level hint image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level hint image:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting level hint image",
    });
  }
};
