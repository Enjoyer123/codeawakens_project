import apiClient from './apiClient';

export const fetchAllGuides = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/guides?${params.toString()}`);
  } catch (error) { throw error; }
};

export const fetchGuidesByLevel = async (getToken, levelId) => {
  try {
    return await apiClient.get(getToken, `/guides/level/${levelId}`);
  } catch (error) { throw error; }
};

export const fetchLevelsForGuide = async (getToken) => {
  try {
    return await apiClient.get(getToken, '/guides/levels');
  } catch (error) { throw error; }
};

export const fetchGuideById = async (getToken, guideId) => {
  try {
    return await apiClient.get(getToken, `/guides/${guideId}`);
  } catch (error) { throw error; }
};

export const createGuide = async (getToken, guideData) => {
  try {
    return await apiClient.post(getToken, '/guides', guideData);
  } catch (error) {
    console.error('Error in createGuide:', error);
    throw error;
  }
};

export const updateGuide = async (getToken, guideId, guideData) => {
  try {
    return await apiClient.put(getToken, `/guides/${guideId}`, guideData);
  } catch (error) { throw error; }
};

export const deleteGuide = async (getToken, guideId) => {
  try {
    return await apiClient.delete(getToken, `/guides/${guideId}`);
  } catch (error) { throw error; }
};

export const uploadGuideImage = async (getToken, guideId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    return await apiClient.post(getToken, `/guides/${guideId}/images`, formData);
  } catch (error) {
    console.error('Error in uploadGuideImage:', error);
    throw error;
  }
};

export const deleteGuideImage = async (getToken, imageId) => {
  try {
    return await apiClient.delete(getToken, `/guides/images/${imageId}`);
  } catch (error) { throw error; }
};
