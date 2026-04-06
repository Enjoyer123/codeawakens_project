const guideService = require("../services/guideService");
const levelService = require("../services/levelService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllGuides = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await guideService.getAllGuides(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching guides:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching guides",
    });
  }
};

exports.getGuidesByLevel = async (req, res) => {
  try {
    const levelId = parseInt(req.params.levelId);
    const result = await guideService.getGuidesByLevel(levelId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching guides by level:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching guides by level",
    });
  }
};

exports.getLevelsForGuide = async (req, res) => {
  try {
    const result = await levelService.getLevelsForDropdown();
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching levels for dropdown:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching levels",
    });
  }
};

exports.getGuideById = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.getGuideById(guideId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching guide:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching guide",
    });
  }
};

exports.createGuide = async (req, res) => {
  try {
    const result = await guideService.createGuide(req.body);
    
    res.status(201).json({
      message: "Guide created successfully",
      guide: result,
    });
  } catch (error) {
    console.error("Error creating guide:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating guide",
    });
  }
};

exports.updateGuide = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.updateGuide(guideId, req.body);
    
    res.status(200).json({
      message: "Guide updated successfully",
      guide: result,
    });
  } catch (error) {
    console.error("Error updating guide:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating guide",
    });
  }
};

exports.deleteGuide = async (req, res) => {
  try {
    const guideId = parseInt(req.params.guideId);
    await guideService.deleteGuide(guideId);
    
    res.status(200).json({
      message: "Guide deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guide:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting guide",
    });
  }
};

exports.uploadGuideImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const guideId = parseInt(req.params.guideId);
    const result = await guideService.uploadGuideImage(guideId, req.file);
    
    res.status(201).json({
      message: "Guide image uploaded successfully",
      guideImage: result,
    });
  } catch (error) {
    console.error("Error uploading guide image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error uploading guide image",
    });
  }
};

exports.deleteGuideImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await guideService.deleteGuideImage(imageId);
    
    res.status(200).json({
      message: "Guide image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guide image:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting guide image",
    });
  }
};
