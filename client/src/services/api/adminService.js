import apiClient from './apiClient';

export const fetchAllUsers = async (getToken, page = 1, limit = 5, search = '') => {
  try {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    return await apiClient.get(getToken, `/users?${params.toString()}`);
  } catch (error) { throw error; }
};

export const updateUserRole = async (getToken, userId, role) => {
  try {
    return await apiClient.put(getToken, `/users/${userId}/role`, { role });
  } catch (error) { throw error; }
};

export const getUserDetails = async (getToken, userId) => {
  try {
    return await apiClient.get(getToken, `/users/${userId}/details`);
  } catch (error) { throw error; }
};

export const deleteUser = async (getToken, userId) => {
  try {
    return await apiClient.delete(getToken, `/users/${userId}`);
  } catch (error) { throw error; }
};

export const resetUserTestScore = async (getToken, userId, type) => {
  try {
    return await apiClient.post(getToken, `/users/${userId}/reset-test`, { type });
  } catch (error) { throw error; }
};

export const fetchUserTestHistory = async (getToken, userId) => {
  try {
    return await apiClient.get(getToken, `/users/${userId}/tests`);
  } catch (error) { throw error; }
};