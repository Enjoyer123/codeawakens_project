import apiClient from './apiClient';

export const fetchAllWeapons = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/weapons?${params.toString()}`);
  } catch (error) { throw error; }
};

export const fetchWeaponById = async (getToken, weaponId) => {
  try {
    return await apiClient.get(getToken, `/weapons/${weaponId}`);
  } catch (error) { throw error; }
};

export const createWeapon = async (getToken, weaponData) => {
  try {
    return await apiClient.post(getToken, '/weapons', weaponData);
  } catch (error) { throw error; }
};

export const updateWeapon = async (getToken, weaponId, weaponData) => {
  try {
    return await apiClient.put(getToken, `/weapons/${weaponId}`, weaponData);
  } catch (error) { throw error; }
};

export const deleteWeapon = async (getToken, weaponId) => {
  try {
    return await apiClient.delete(getToken, `/weapons/${weaponId}`);
  } catch (error) { throw error; }
};

export const addWeaponImage = async (getToken, weaponId, imageFile, imageData) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type_file', imageData.type_file);
    formData.append('type_animation', imageData.type_animation);
    formData.append('frame', imageData.frame.toString());
    formData.append('weapon_key', imageData.weapon_key);

    return await apiClient.post(getToken, `/weapons/${weaponId}/images`, formData);
  } catch (error) {
    console.error('Error in addWeaponImage:', error);
    throw error;
  }
};

export const updateWeaponImage = async (getToken, imageId, imageFile, imageData) => {
  try {
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (imageData.type_file) formData.append('type_file', imageData.type_file);
    if (imageData.type_animation) formData.append('type_animation', imageData.type_animation);
    if (imageData.frame !== undefined) formData.append('frame', imageData.frame.toString());

    return await apiClient.put(getToken, `/weapons/images/${imageId}`, formData);
  } catch (error) {
    console.error('Error in updateWeaponImage:', error);
    throw error;
  }
};

export const deleteWeaponImage = async (getToken, imageId) => {
  try {
    return await apiClient.delete(getToken, `/weapons/images/${imageId}`);
  } catch (error) { throw error; }
};
