import apiClient from './apiClient';

// Fetch all blocks with pagination (public endpoint for users)
export const fetchPublicBlocks = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/blocks/public?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
};

// Fetch all blocks with pagination (admin endpoint)
export const fetchAllBlocks = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/blocks?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
};

// Create block
export const createBlock = async (getToken, blockData) => {
  try {
    return await apiClient.post(getToken, '/blocks', blockData);
  } catch (error) {
    console.error('Error creating block:', error);
    throw error;
  }
};

// Update block
export const updateBlock = async (getToken, blockId, blockData) => {
  try {
    return await apiClient.put(getToken, `/blocks/${blockId}`, blockData);
  } catch (error) {
    console.error('Error updating block:', error);
    throw error;
  }
};

// Delete block
export const deleteBlock = async (getToken, blockId) => {
  try {
    return await apiClient.delete(getToken, `/blocks/${blockId}`);
  } catch (error) {
    console.error('Error deleting block:', error);
    throw error;
  }
};

// Get block by ID
export const getBlockById = async (getToken, blockId) => {
  try {
    return await apiClient.get(getToken, `/blocks/${blockId}`);
  } catch (error) {
    console.error('Error fetching block:', error);
    throw error;
  }
};

export const uploadBlockImage = async (getToken, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    return await apiClient.post(getToken, '/blocks/upload-image', formData);
  } catch (error) {
    throw error;
  }
};
