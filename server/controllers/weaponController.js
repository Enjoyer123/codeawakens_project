const weaponService = require("../services/weaponService");
const { parsePagination } = require("../utils/pagination");
const { cleanupTempFile } = require("../utils/fileHelper");

exports.getAllWeapons = async (req, res) => {
  try {
    const result = await weaponService.getAllWeapons(parsePagination(req.query));
    res.json(result);
  } catch (error) {
    console.error("Error fetching weapons:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching weapons" });
  }
};

exports.getWeaponById = async (req, res) => {
  try {
    const weapon = await weaponService.getWeaponById(parseInt(req.params.weaponId));
    res.json(weapon);
  } catch (error) {
    console.error("Error fetching weapon:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error fetching weapon" });
  }
};

exports.createWeapon = async (req, res) => {
  try {
    const weapon = await weaponService.createWeapon(req.body);
    res.status(201).json({ message: "Weapon created successfully", weapon });
  } catch (error) {
    console.error("Error creating weapon:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error creating weapon" });
  }
};

exports.updateWeapon = async (req, res) => {
  try {
    const weapon = await weaponService.updateWeapon(parseInt(req.params.weaponId), req.body);
    res.json({ message: "Weapon updated successfully", weapon });
  } catch (error) {
    console.error("Error updating weapon:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error updating weapon" });
  }
};

exports.deleteWeapon = async (req, res) => {
  try {
    await weaponService.deleteWeapon(parseInt(req.params.weaponId));
    res.json({ message: "Weapon deleted successfully" });
  } catch (error) {
    console.error("Error deleting weapon:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error deleting weapon" });
  }
};

exports.addWeaponImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const weaponImage = await weaponService.addWeaponImage(parseInt(req.params.weaponId), req.file, req.body);
    res.status(201).json({ message: "Weapon image added successfully", weaponImage });
  } catch (error) {
    console.error("Error adding weapon image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({ message: error.message || "Error adding weapon image" });
  }
};

exports.deleteWeaponImage = async (req, res) => {
  try {
    await weaponService.deleteWeaponImage(parseInt(req.params.imageId));
    res.json({ message: "Weapon image deleted successfully" });
  } catch (error) {
    console.error("Error deleting weapon image:", error.message);
    res.status(error.status || 500).json({ message: error.message || "Error deleting weapon image" });
  }
};

exports.updateWeaponImage = async (req, res) => {
  try {
    const weaponImage = await weaponService.updateWeaponImage(parseInt(req.params.imageId), req.file || null, req.body);
    res.json({ message: "Weapon image updated successfully", weaponImage });
  } catch (error) {
    console.error("Error updating weapon image:", error.message);
    cleanupTempFile(req.file);
    res.status(error.status || 500).json({ message: error.message || "Error updating weapon image" });
  }
};
