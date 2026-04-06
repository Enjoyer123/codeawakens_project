import apiClient from './apiClient';

export const fetchHintsByLevel = async (getToken, levelId) => {
  try {
    return await apiClient.get(getToken, `/levels/${levelId}/hints`);
  } catch (error) { throw error; }
};

export const fetchAllLevelHints = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/level-hints?${params.toString()}`);
  } catch (error) { throw error; }
};

export const createLevelHint = async (getToken, data) => {
  try {
    return await apiClient.post(getToken, '/level-hints', data);
  } catch (error) { throw error; }
};

export const updateLevelHint = async (getToken, hintId, data) => {
  try {
    return await apiClient.put(getToken, `/level-hints/${hintId}`, data);
  } catch (error) { throw error; }
};

export const deleteLevelHint = async (getToken, hintId) => {
  try {
    return await apiClient.delete(getToken, `/level-hints/${hintId}`);
  } catch (error) { throw error; }
};

export const uploadHintImage = async (getToken, hintId, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    return await apiClient.post(getToken, `/level-hints/${hintId}/images`, formData);
  } catch (error) { throw error; }
};

export const deleteHintImage = async (getToken, imageId) => {
  try {
    return await apiClient.delete(getToken, `/level-hints/images/${imageId}`);
  } catch (error) { throw error; }
};
