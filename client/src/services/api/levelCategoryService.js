import apiClient from './apiClient';

export const fetchAllLevelCategories = async (getToken, search = '') => {
  try {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/level-categories?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching level categories:', error);
    throw error;
  }
};

export const createLevelCategory = async (getToken, levelCategoryData) => {
  try {
    return await apiClient.post(getToken, '/level-categories', levelCategoryData);
  } catch (error) {
    console.error('Error creating level category:', error);
    throw error;
  }
};

export const updateLevelCategory = async (getToken, categoryId, levelCategoryData) => {
  try {
    return await apiClient.put(getToken, `/level-categories/${categoryId}`, levelCategoryData);
  } catch (error) {
    console.error('Error updating level category:', error);
    throw error;
  }
};

export const updateLevelCategoryCoordinates = async (getToken, categoryId, coordinates) => {
  try {
    return await apiClient.put(getToken, `/level-categories/coordinates/${categoryId}`, { coordinates });
  } catch (error) {
    console.error('Error updating coordinates:', error);
    throw error;
  }
};

export const deleteLevelCategory = async (getToken, categoryId) => {
  try {
    return await apiClient.delete(getToken, `/level-categories/${categoryId}`);
  } catch (error) {
    console.error('Error deleting level category:', error);
    throw error;
  }
};

export const getLevelCategoryById = async (getToken, categoryId) => {
  try {
    return await apiClient.get(getToken, `/level-categories/${categoryId}`);
  } catch (error) {
    console.error('Error fetching level category:', error);
    throw error;
  }
};

export const uploadCategoryBackground = async (getToken, categoryId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    return await apiClient.post(getToken, `/level-categories/${categoryId}/background`, formData);
  } catch (error) {
    console.error('Error uploading background:', error);
    throw error;
  }
};

export const deleteCategoryBackground = async (getToken, categoryId) => {
  try {
    return await apiClient.delete(getToken, `/level-categories/${categoryId}/background`);
  } catch (error) {
    console.error('Error deleting background:', error);
    throw error;
  }
};
