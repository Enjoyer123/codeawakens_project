const levelService = require("../services/levelService");
const { cleanupTempFile } = require("../utils/fileHelper");
const { parsePagination } = require("../utils/pagination");

exports.getAllLevels = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const paginationData = parsePagination(req.query);
    const result = await levelService.getAllLevels(paginationData, req.query, clerkUserId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching levels:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching levels",
    });
  }
};

exports.getLevelsForDropdown = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching generic levels:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching generic levels",
    });
  }
};

exports.getLevelById = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.getLevelById(levelId, req.query.admin, clerkUserId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching level details:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching level details",
    });
  }
};

exports.createLevel = async (req, res) => {
  try {
    const result = await levelService.createLevel(req.body);
    
    res.status(201).json({
      message: "Level created successfully",
      level: result,
    });
  } catch (error) {
    console.error("Error creating level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating level",
    });
  }
};

exports.updateLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.updateLevel(levelId, req.body);
    
    res.status(200).json({
      message: "Level updated successfully",
      level: result,
    });
  } catch (error) {
    console.error("Error updating level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating level",
    });
  }
};

exports.deleteLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    await levelService.deleteLevel(levelId);
    
    res.status(200).json({
      message: "Level deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting level",
    });
  }
};

exports.uploadLevelBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.uploadLevelBackgroundImage(levelId, req.file);
    
    res.status(200).json({
      message: "Background image uploaded successfully",
      level: result,
    });
  } catch (error) {
    console.error("Error uploading background image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error uploading file",
    });
  }
};

exports.deleteLevelBackgroundImage = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.deleteLevelBackgroundImage(levelId);
    
    res.status(200).json({
      message: "Background image deleted successfully",
      level: result,
    });
  } catch (error) {
    console.error("Error deleting background image:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting background image",
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const result = await levelService.getAllCategories();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching categories",
    });
  }
};

exports.getLevelsForPrerequisite = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching prerequisites:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching prerequisites",
    });
  }
};

exports.unlockLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    await levelService.unlockLevel(levelId);
    res.status(200).json({
      message: "Level unlocked successfully",
    });
  } catch (error) {
    console.error("Error unlocking level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error unlocking level",
    });
  }
};

exports.updateLevelCoordinates = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await levelService.updateLevelCoordinates(levelId, req.body.coordinates);
    res.status(200).json({
      message: "Level coordinates updated successfully",
      level: result,
    });
  } catch (error) {
    console.error("Error updating coordinates:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating coordinates",
    });
  }
};
