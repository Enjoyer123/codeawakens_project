import apiClient from './apiClient';

export const fetchAllPatterns = async (getToken, page = 1, limit = 100, levelId = null) => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (levelId) params.append('level_id', levelId.toString());

    return await apiClient.get(getToken, `/patterns?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw error;
  }
};

export const fetchPatternById = async (getToken, patternId) => {
  try {
    return await apiClient.get(getToken, `/patterns/${patternId}`);
  } catch (error) {
    console.error('Error fetching pattern:', error);
    throw error;
  }
};

export const createPattern = async (getToken, patternData) => {
  try {
    return await apiClient.post(getToken, '/patterns', patternData);
  } catch (error) {
    console.error('Error creating pattern:', error);
    throw error;
  }
};

export const updatePattern = async (getToken, patternId, patternData) => {
  try {
    return await apiClient.put(getToken, `/patterns/${patternId}`, patternData);
  } catch (error) {
    console.error('Error updating pattern:', error);
    throw error;
  }
};

export const deletePattern = async (getToken, patternId) => {
  try {
    return await apiClient.delete(getToken, `/patterns/${patternId}`);
  } catch (error) {
    console.error('Error deleting pattern:', error);
    throw error;
  }
};

export const fetchPatternTypes = async (getToken) => {
  try {
    return await apiClient.get(getToken, '/patterns/types');
  } catch (error) {
    console.error('Error fetching pattern types:', error);
    throw error;
  }
};

// Note: unlockPattern parameter order is (patternId, getToken)
export const unlockPattern = async (patternId, getToken) => {
  try {
    const tokenResolver = () => typeof getToken === 'function' ? getToken() : getToken;
    return await apiClient.put(tokenResolver, `/patterns/${patternId}/unlock`, {});
  } catch (error) {
    console.error('Error unlocking pattern:', error);
    throw error;
  }
};

export const unlockLevel = async (levelId, getToken) => {
  try {
    const tokenResolver = () => typeof getToken === 'function' ? getToken() : getToken;
    return await apiClient.put(tokenResolver, `/levels/${levelId}/unlock`, {});
  } catch (error) {
    console.error('Error unlocking level:', error);
    throw error;
  }
};
