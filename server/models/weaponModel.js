import prisma from "./prisma.js";

// ====== FINDERS ======
export const countWeapons = async (where) => prisma.weapon.count({ where });
export const findManyWeapons = async (where, skip, limit) => prisma.weapon.findMany({ where, include: { weapon_images: { orderBy: [{ type_animation: "asc" }, { frame: "asc" }] } }, orderBy: { created_at: "desc" }, skip, take: limit });
export const findWeaponById = async (weaponId) => prisma.weapon.findUnique({ where: { weapon_id: weaponId }, include: { weapon_images: { orderBy: [{ type_animation: "asc" }, { frame: "asc" }] } } });
export const findWeaponByKey = async (weaponKey) => prisma.weapon.findUnique({ where: { weapon_key: weaponKey } });
export const findWeaponImagesByWeaponId = async (weaponId) => prisma.weapon_Image.findMany({ where: { weapon_id: weaponId } });
export const findWeaponImageById = async (imageId) => prisma.weapon_Image.findUnique({ where: { file_id: imageId } });
export const findWeaponImageByIdWithWeapon = async (imageId) => prisma.weapon_Image.findUnique({ where: { file_id: imageId }, include: { weapon: true } });
export const findWeaponImageMatch = async (weaponId, typeFile, typeAnimation, frame) => prisma.weapon_Image.findFirst({ where: { weapon_id: weaponId, type_file: typeFile, type_animation: typeAnimation, frame } });
export const findWeaponImagesByTypeAnimation = async (weaponId, typeAnimation) => prisma.weapon_Image.findMany({ where: { weapon_id: weaponId, type_animation: typeAnimation } });

// ====== CRUD ======
export const createWeapon = async (data) => prisma.weapon.create({ data, include: { weapon_images: true } });
export const updateWeapon = async (weaponId, data) => prisma.weapon.update({ where: { weapon_id: weaponId }, data, include: { weapon_images: { orderBy: [{ type_animation: "asc" }, { frame: "asc" }] } } });
export const deleteWeapon = async (weaponId) => prisma.weapon.delete({ where: { weapon_id: weaponId } });

export const createWeaponImage = async (data) => prisma.weapon_Image.create({ data });
export const updateWeaponImagePath = async (fileId, newPath) => prisma.weapon_Image.update({ where: { file_id: fileId }, data: { path_file: newPath } });
export const updateWeaponImageFull = async (fileId, data) => prisma.weapon_Image.update({ where: { file_id: fileId }, data });
export const deleteWeaponImage = async (fileId) => prisma.weapon_Image.delete({ where: { file_id: fileId } });
