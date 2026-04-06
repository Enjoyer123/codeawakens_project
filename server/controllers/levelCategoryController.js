const levelCategoryService = require("../services/levelCategoryService");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllLevelCategories = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const result = await levelCategoryService.getAllLevelCategories(clerkUserId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching level categories:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching level categories",
    });
  }
};

exports.getLevelCategoryById = async (req, res) => {
  try {
    const clerkUserId = req.user ? req.user.id : null;
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.getLevelCategoryById(categoryId, clerkUserId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching level category by ID:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching level category",
    });
  }
};

exports.createLevelCategory = async (req, res) => {
  try {
    const result = await levelCategoryService.createLevelCategory(req.body);
    
    res.status(201).json({
      message: "Level category created successfully",
      category: result,
    });
  } catch (error) {
    console.error("Error creating level category:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating level category",
    });
  }
};

exports.updateLevelCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.updateLevelCategory(categoryId, req.body);
    
    res.status(200).json({
      message: "Level category updated successfully",
      category: result,
    });
  } catch (error) {
    console.error("Error updating level category:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating level category",
    });
  }
};

exports.deleteLevelCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    await levelCategoryService.deleteLevelCategory(categoryId);
    
    res.status(200).json({
      message: "Level category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting level category:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting level category",
    });
  }
};

exports.updateLevelCategoryCoordinates = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.updateLevelCategoryCoordinates(categoryId, req.body);
    
    res.status(200).json({
      message: "Category coordinates updated successfully",
      category: result,
    });
  } catch (error) {
    console.error("Error updating category coordinates:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating coordinates",
    });
  }
};

exports.uploadCategoryBackground = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }
    
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.uploadCategoryBackground(categoryId, req.file);
    
    res.status(200).json({
      message: "Background image uploaded successfully",
      category: result,
    });
  } catch (error) {
    console.error("Error uploading category background:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error uploading category background",
    });
  }
};

exports.deleteCategoryBackground = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const result = await levelCategoryService.deleteCategoryBackground(categoryId);
    
    res.status(200).json({
      message: "Background image deleted successfully",
      category: result,
    });
  } catch (error) {
    console.error("Error deleting category background:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting category background",
    });
  }
};
