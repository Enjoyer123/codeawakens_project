const levelCategoryService = require("../services/levelCategoryService");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllLevelCategories = async (req, res) => {
  try {
    const search = req.query.search || "";
    const clerkUserId = req.user?.id;
    const result = await levelCategoryService.getAllLevelCategories(search, clerkUserId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching level categories:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching level categories" });
  }
};

exports.getLevelCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const clerkUserId = req.user?.id;
    const result = await levelCategoryService.getLevelCategoryById(parseInt(categoryId), clerkUserId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching level category:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching level category" });
  }
};

exports.createLevelCategory = async (req, res) => {
  try {
    const levelCategory = await levelCategoryService.createLevelCategory(req.body);
    res.status(201).json({ message: "Level category created successfully", levelCategory });
  } catch (error) {
    console.error("Error creating level category:", error.message);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A level category with this name already exists." });
    }
    res.status(error.status || 500).json({ message: error.message || "Error creating level category" });
  }
};

exports.updateLevelCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const levelCategory = await levelCategoryService.updateLevelCategory(parseInt(categoryId), req.body);
    res.json({ message: "Level category updated successfully", levelCategory });
  } catch (error) {
    console.error("Error updating level category:", error.message);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A level category with this name already exists." });
    }
    res.status(error.status || 500).json({ message: error.message || "Error updating level category" });
  }
};

exports.deleteLevelCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    await levelCategoryService.deleteLevelCategory(parseInt(categoryId));
    res.json({ message: "Level category deleted successfully" });
  } catch (error) {
    console.error("Error deleting level category:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error deleting level category" });
  }
};

exports.uploadCategoryBackground = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const updated = await levelCategoryService.uploadCategoryBackground(parseInt(categoryId), req.file);
    res.json({ message: "Background uploaded successfully", levelCategory: updated });
  } catch (error) {
    console.error("Error uploading background:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({ message: error.message || "Error uploading background" });
  }
};

exports.deleteCategoryBackground = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updated = await levelCategoryService.deleteCategoryBackground(parseInt(categoryId));
    res.json({ message: "Background deleted successfully", levelCategory: updated });
  } catch (error) {
    console.error("Error deleting background:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error deleting background" });
  }
};

exports.updateLevelCategoryCoordinates = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updated = await levelCategoryService.updateLevelCategoryCoordinates(parseInt(categoryId), req.body.coordinates);
    res.json({ message: "Level category coordinates updated successfully", levelCategory: updated });
  } catch (error) {
    console.error("Error updating level category coordinates:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error updating level category coordinates" });
  }
};
