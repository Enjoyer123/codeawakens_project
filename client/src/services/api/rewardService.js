import apiClient from './apiClient';

export const fetchAllRewards = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/rewards?${params.toString()}`);
  } catch (error) { throw error; }
};

export const fetchLevelsForReward = async (getToken) => {
  try {
    return await apiClient.get(getToken, '/rewards/levels');
  } catch (error) { throw error; }
};

export const fetchRewardById = async (getToken, rewardId) => {
  try {
    return await apiClient.get(getToken, `/rewards/${rewardId}`);
  } catch (error) { throw error; }
};

export const createReward = async (getToken, rewardData) => {
  try {
    return await apiClient.post(getToken, '/rewards', rewardData);
  } catch (error) { throw error; }
};

export const updateReward = async (getToken, rewardId, rewardData) => {
  try {
    return await apiClient.put(getToken, `/rewards/${rewardId}`, rewardData);
  } catch (error) { throw error; }
};

export const deleteReward = async (getToken, rewardId) => {
  try {
    return await apiClient.delete(getToken, `/rewards/${rewardId}`);
  } catch (error) { throw error; }
};

export const uploadRewardFrame = async (getToken, rewardId, imageFile, frameNumber) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('frame_number', frameNumber.toString());
    formData.append('reward_id', rewardId.toString());
    
    return await apiClient.post(getToken, `/rewards/${rewardId}/frames`, formData);
  } catch (error) { throw error; }
};

export const deleteRewardFrame = async (getToken, rewardId, frameNumber) => {
  try {
    return await apiClient.delete(getToken, `/rewards/${rewardId}/frames`, { frame_number: frameNumber.toString() });
  } catch (error) { throw error; }
};
