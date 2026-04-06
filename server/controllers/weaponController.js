const weaponService = require("../services/weaponService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllWeapons = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await weaponService.getAllWeapons(paginationData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching weapons:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching weapons",
    });
  }
};

exports.getWeaponById = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    const result = await weaponService.getWeaponById(weaponId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching weapon:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error fetching weapon",
    });
  }
};

exports.createWeapon = async (req, res) => {
  try {
    const result = await weaponService.createWeapon(req.body);
    
    res.status(201).json({
      message: "Weapon created successfully",
      weapon: result,
    });
  } catch (error) {
    console.error("Error creating weapon:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error creating weapon",
    });
  }
};

exports.updateWeapon = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    const result = await weaponService.updateWeapon(weaponId, req.body);
    
    res.status(200).json({
      message: "Weapon updated successfully",
      weapon: result,
    });
  } catch (error) {
    console.error("Error updating weapon:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error updating weapon",
    });
  }
};

exports.deleteWeapon = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    await weaponService.deleteWeapon(weaponId);
    
    res.status(200).json({
      message: "Weapon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weapon:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting weapon",
    });
  }
};

exports.addWeaponImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }
    
    const weaponId = parseInt(req.params.weaponId);
    const isBase = req.body.is_base === "true";
    const result = await weaponService.addWeaponImage(weaponId, req.file, isBase);
    
    res.status(201).json({
      message: "Image added successfully",
      weaponImage: result,
    });
  } catch (error) {
    console.error("Error adding weapon image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error adding weapon image",
    });
  }
};

exports.updateWeaponImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const isBase = req.body.is_base === "true";
    const result = await weaponService.updateWeaponImage(imageId, req.file, isBase);
    
    res.status(200).json({
      message: "Image updated successfully",
      weaponImage: result,
    });
  } catch (error) {
    console.error("Error updating weapon image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({
      message: error.message || "Error updating weapon image",
    });
  }
};

exports.deleteWeaponImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await weaponService.deleteWeaponImage(imageId);
    
    res.status(200).json({
      message: "Weapon image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting weapon image:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Error deleting weapon image",
    });
  }
};
