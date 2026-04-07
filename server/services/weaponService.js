import * as weaponRepo from "../models/weaponModel.js";
import { buildPaginationResponse } from "../utils/pagination.js";
import { safeDeleteFile, moveFile } from "../utils/fileHelper.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllWeapons = async ({ page, limit, search, skip }) => {
  let where = {};
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    where = {
      OR: [
        { weapon_name: { contains: searchLower, mode: "insensitive" } },
        { weapon_key: { contains: searchLower, mode: "insensitive" } },
      ],
    };
  }

  const total = await weaponRepo.countWeapons(where);
  const weapons = await weaponRepo.findManyWeapons(where, skip, limit);

  return { weapons, pagination: buildPaginationResponse(page, limit, total) };
}

export const getWeaponById = async (weaponId) => {
  const weapon = await weaponRepo.findWeaponById(weaponId);
  if (!weapon) { const err = new Error("Weapon not found"); err.status = 404; throw err; }
  return weapon;
}

export const createWeapon = async (data) => {
  const { weapon_key, weapon_name, combat_power, weapon_type } = data;
  if (!weapon_key || !weapon_name || !weapon_type) {
    const err = new Error("Missing required fields: weapon_key, weapon_name, weapon_type");
    err.status = 400; throw err;
  }

  const existing = await weaponRepo.findWeaponByKey(weapon_key);
  if (existing) { const err = new Error("Weapon key already exists"); err.status = 400; throw err; }

  return weaponRepo.createWeapon({
    weapon_key, weapon_name, combat_power: parseInt(combat_power) || 0, weapon_type
  });
}

export const updateWeapon = async (weaponId, data) => {
  const { weapon_key, weapon_name, combat_power, weapon_type } = data;
  const existing = await weaponRepo.findWeaponById(weaponId);
  if (!existing) { const err = new Error("Weapon not found"); err.status = 404; throw err; }

  const weaponKeyChanged = weapon_key && weapon_key !== existing.weapon_key;
  if (weaponKeyChanged) {
    const keyExists = await weaponRepo.findWeaponByKey(weapon_key);
    if (keyExists) { const err = new Error("Weapon key already exists"); err.status = 400; throw err; }

    // Rename all image files
    const existingImages = await weaponRepo.findWeaponImagesByWeaponId(weaponId);
    for (const image of existingImages) {
      const oldFilePath = path.join(__dirname, "..", image.path_file);
      const fileExtension = path.extname(image.path_file) || ".png";
      const newFilename = `${weapon_key}_${image.type_file}_${image.frame}${fileExtension}`;
      const typeAnimation = image.type_animation === "effect" ? "weapons_effect" : "weapons";
      const targetDir = path.join(__dirname, "..", "uploads", typeAnimation);
      const newFilePath = path.join(targetDir, newFilename);
      const newPath = `/uploads/${typeAnimation}/${newFilename}`;

      if (fs.existsSync(oldFilePath)) {
        try { fs.renameSync(oldFilePath, newFilePath); } catch (e) { console.error(`Error renaming ${oldFilePath}:`, e); }
      }
      await weaponRepo.updateWeaponImagePath(image.file_id, newPath);
    }
  }

  const updateData = {};
  if (weapon_key) updateData.weapon_key = weapon_key;
  if (weapon_name) updateData.weapon_name = weapon_name;
  if (combat_power !== undefined) updateData.combat_power = parseInt(combat_power);
  if (weapon_type) updateData.weapon_type = weapon_type;

  return weaponRepo.updateWeapon(weaponId, updateData);
}

export const deleteWeapon = async (weaponId) => {
  const weapon = await weaponRepo.findWeaponById(weaponId);
  if (!weapon) { const err = new Error("Weapon not found"); err.status = 404; throw err; }

  for (const image of weapon.weapon_images) {
    safeDeleteFile(image.path_file);
  }

  await weaponRepo.deleteWeapon(weaponId);
}

export const addWeaponImage = async (weaponId, file, data) => {
  const { type_animation, frame } = data;
  if (!type_animation || !frame) {
    const err = new Error("Missing required fields: type_animation, frame");
    err.status = 400; throw err;
  }

  // กำหนดประเภทไฟล์อัตโนมัติ: weapon -> idle, effect -> attack
  const type_file = type_animation === "weapon" ? "idle" : "attack";

  const weapon = await weaponRepo.findWeaponById(weaponId);
  if (!weapon) { const err = new Error("Weapon not found"); err.status = 404; throw err; }

  // Delete existing weapon-type images if type_animation is 'weapon'
  if (type_animation === "weapon") {
    const existingWeaponImages = await weaponRepo.findWeaponImagesByTypeAnimation(weaponId, "weapon");
    for (const img of existingWeaponImages) {
      safeDeleteFile(img.path_file);
      await weaponRepo.deleteWeaponImage(img.file_id);
    }
  }

  const typeAnimDir = type_animation === "effect" ? "weapons_effect" : "weapons";
  const targetDir = path.join(__dirname, "..", "uploads", typeAnimDir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const fileExtension = path.extname(file.originalname) || ".png";
  const newFilename = `${weapon.weapon_key}_${type_file}_${frame}${fileExtension}`;
  const targetPath = path.resolve(path.join(targetDir, newFilename));

  moveFile(path.resolve(file.path), targetPath);

  const pathFile = `/uploads/${typeAnimDir}/${newFilename}`;

  // Check for duplicate
  const existingImage = await weaponRepo.findWeaponImageMatch(weaponId, type_file, type_animation, parseInt(frame));
  if (existingImage) {
    const err = new Error("เฟรมนี้มีรูปภาพอยู่แล้ว กรุณาลบรูปเดิมออกก่อนหากต้องการอัปโหลดใหม่");
    err.status = 400; throw err;
  }

  return weaponRepo.createWeaponImage({
    weapon_id: weaponId, path_file: pathFile, type_file, type_animation, frame: parseInt(frame)
  });
}

export const deleteWeaponImage = async (imageId) => {
  const weaponImage = await weaponRepo.findWeaponImageById(imageId);
  if (!weaponImage) { const err = new Error("Weapon image not found"); err.status = 404; throw err; }

  safeDeleteFile(weaponImage.path_file);
  await weaponRepo.deleteWeaponImage(imageId);
}

export const updateWeaponImage = async (imageId, file, data) => {
  const { type_animation, frame } = data;
  const existingImage = await weaponRepo.findWeaponImageByIdWithWeapon(imageId);
  if (!existingImage) { const err = new Error("Weapon image not found"); err.status = 404; throw err; }

  const weapon = existingImage.weapon;
  const finalTypeAnimation = type_animation || existingImage.type_animation;
  const finalTypeFile = finalTypeAnimation === "weapon" ? "idle" : "attack";
  const finalFrame = frame || existingImage.frame;
  const typeAnimDir = finalTypeAnimation === "effect" ? "weapons_effect" : "weapons";
  const targetDir = path.join(__dirname, "..", "uploads", typeAnimDir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  let newPath = null;

  if (file) {
    const fileExtension = path.extname(file.originalname) || ".png";
    const newFilename = `${weapon.weapon_key}_${finalTypeFile}_${finalFrame}${fileExtension}`;
    const targetPath = path.resolve(path.join(targetDir, newFilename));

    // Delete old file
    safeDeleteFile(existingImage.path_file);
    moveFile(path.resolve(file.path), targetPath);
    newPath = `/uploads/${typeAnimDir}/${newFilename}`;
  } else if (finalTypeFile !== existingImage.type_file || finalFrame !== existingImage.frame || finalTypeAnimation !== existingImage.type_animation) {
    const fileExtension = path.extname(existingImage.path_file) || ".png";
    const newFilename = `${weapon.weapon_key}_${finalTypeFile}_${finalFrame}${fileExtension}`;
    const oldFilePath = path.join(__dirname, "..", existingImage.path_file);
    const newTargetPath = path.join(targetDir, newFilename);

    if (fs.existsSync(oldFilePath)) {
      try { fs.renameSync(oldFilePath, newTargetPath); } catch (e) { throw e; }
      newPath = `/uploads/${typeAnimDir}/${newFilename}`;
    }
  }

  const updateData = {};
  if (type_file) updateData.type_file = type_file;
  if (type_animation) updateData.type_animation = type_animation;
  if (frame) updateData.frame = parseInt(frame);
  if (newPath) updateData.path_file = newPath;

  return weaponRepo.updateWeaponImageFull(imageId, updateData);
}
