import apiClient from './apiClient';

export const fetchAllVictoryConditions = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/victory-conditions?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching victory conditions:', error);
    throw error;
  }
};

export const createVictoryCondition = async (getToken, victoryConditionData) => {
  try {
    return await apiClient.post(getToken, '/victory-conditions', victoryConditionData);
  } catch (error) {
    console.error('Error creating victory condition:', error);
    throw error;
  }
};

export const updateVictoryCondition = async (getToken, victoryConditionId, victoryConditionData) => {
  try {
    return await apiClient.put(getToken, `/victory-conditions/${victoryConditionId}`, victoryConditionData);
  } catch (error) {
    console.error('Error updating victory condition:', error);
    throw error;
  }
};

export const deleteVictoryCondition = async (getToken, victoryConditionId) => {
  try {
    return await apiClient.delete(getToken, `/victory-conditions/${victoryConditionId}`);
  } catch (error) {
    console.error('Error deleting victory condition:', error);
    throw error;
  }
};

export const getVictoryConditionById = async (getToken, victoryConditionId) => {
  try {
    return await apiClient.get(getToken, `/victory-conditions/${victoryConditionId}`);
  } catch (error) {
    console.error('Error fetching victory condition:', error);
    throw error;
  }
};
