import * as weaponService from "../services/weaponService.js";
import { parsePagination } from "../utils/pagination.js";
import { cleanupTempFile } from "../utils/fileHelper.js";

export const getAllWeapons = async (req, res) => {
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

export const getWeaponById = async (req, res) => {
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

export const createWeapon = async (req, res) => {
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

export const updateWeapon = async (req, res) => {
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

export const deleteWeapon = async (req, res) => {
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

export const addWeaponImage = async (req, res) => {
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

export const updateWeaponImage = async (req, res) => {
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

export const deleteWeaponImage = async (req, res) => {
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
