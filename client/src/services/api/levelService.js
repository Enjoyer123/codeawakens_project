import apiClient from './apiClient';

export const fetchAllLevels = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/levels?${params.toString()}`);
  } catch (error) { throw error; }
};

export const fetchAllCategories = async (getToken) => {
  try {
    return await apiClient.get(getToken, '/levels/categories');
  } catch (error) { throw error; }
};

export const fetchLevelsForPrerequisite = async (getToken) => {
  try {
    return await apiClient.get(getToken, '/levels/prerequisites');
  } catch (error) { throw error; }
};

export const fetchLevelById = async (getToken, levelId) => {
  try {
    return await apiClient.get(getToken, `/levels/${levelId}`);
  } catch (error) { throw error; }
};

export const createLevel = async (getToken, levelData) => {
  try {
    return await apiClient.post(getToken, '/levels', levelData);
  } catch (error) { throw error; }
};

export const updateLevel = async (getToken, levelId, levelData) => {
  try {
    return await apiClient.put(getToken, `/levels/${levelId}`, levelData);
  } catch (error) { throw error; }
};

export const updateLevelCoordinates = async (getToken, levelId, coordinates) => {
  try {
    return await apiClient.put(getToken, `/levels/coordinates/${levelId}`, { coordinates });
  } catch (error) { throw error; }
};

export const deleteLevel = async (getToken, levelId) => {
  try {
    return await apiClient.delete(getToken, `/levels/${levelId}`);
  } catch (error) { throw error; }
};

export const uploadLevelBackgroundImage = async (getToken, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('backgroundImage', imageFile);
    return await apiClient.post(getToken, '/levels/upload-background', formData);
  } catch (error) { throw error; }
};
