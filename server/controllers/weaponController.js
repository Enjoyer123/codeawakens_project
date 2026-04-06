import * as weaponService from "../services/weaponService.js";
import { parsePagination } from "../utils/pagination.js";
import { cleanupTempFile } from "../utils/fileHelper.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const getAllWeapons = async (req, res) => {
  try {
    const paginationData = parsePagination(req.query);
    const result = await weaponService.getAllWeapons(paginationData);
    
    sendSuccess(res, result, "Weapons fetched successfully");
  } catch (error) {
    console.error("Error fetching weapons:", error.message);
    sendError(res, error.message || "Error fetching weapons", error.status || 500);
  }
};

export const getWeaponById = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    const result = await weaponService.getWeaponById(weaponId);
    
    sendSuccess(res, result, "Weapon fetched successfully");
  } catch (error) {
    console.error("Error fetching weapon:", error.message);
    sendError(res, error.message || "Error fetching weapon", error.status || 500);
  }
};

export const createWeapon = async (req, res) => {
  try {
    const result = await weaponService.createWeapon(req.body);
    
    sendSuccess(res, { weapon: result }, "Weapon created successfully", 201);
  } catch (error) {
    console.error("Error creating weapon:", error.message);
    sendError(res, error.message || "Error creating weapon", error.status || 500);
  }
};

export const updateWeapon = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    const result = await weaponService.updateWeapon(weaponId, req.body);
    
    sendSuccess(res, { weapon: result }, "Weapon updated successfully");
  } catch (error) {
    console.error("Error updating weapon:", error.message);
    sendError(res, error.message || "Error updating weapon", error.status || 500);
  }
};

export const deleteWeapon = async (req, res) => {
  try {
    const weaponId = parseInt(req.params.weaponId);
    await weaponService.deleteWeapon(weaponId);
    
    sendSuccess(res, null, "Weapon deleted successfully");
  } catch (error) {
    console.error("Error deleting weapon:", error.message);
    sendError(res, error.message || "Error deleting weapon", error.status || 500);
  }
};

export const addWeaponImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No image file provided.", 400);
    }
    
    const weaponId = parseInt(req.params.weaponId);
    const isBase = req.body.is_base === "true";
    const result = await weaponService.addWeaponImage(weaponId, req.file, isBase);
    
    sendSuccess(res, { weaponImage: result }, "Image added successfully", 201);
  } catch (error) {
    console.error("Error adding weapon image:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error adding weapon image", error.status || 500);
  }
};

export const updateWeaponImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const isBase = req.body.is_base === "true";
    const result = await weaponService.updateWeaponImage(imageId, req.file, isBase);
    
    sendSuccess(res, { weaponImage: result }, "Image updated successfully");
  } catch (error) {
    console.error("Error updating weapon image:", error.message);
    cleanupTempFile(req.file);
    sendError(res, error.message || "Error updating weapon image", error.status || 500);
  }
};

export const deleteWeaponImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    await weaponService.deleteWeaponImage(imageId);
    
    sendSuccess(res, null, "Weapon image deleted successfully");
  } catch (error) {
    console.error("Error deleting weapon image:", error.message);
    sendError(res, error.message || "Error deleting weapon image", error.status || 500);
  }
};
