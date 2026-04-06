import apiClient from './apiClient';

export const fetchTestsByType = async (getToken, type) => {
  try {
    return await apiClient.get(getToken, `/tests/${type}`);
  } catch (error) { throw error; }
};

export const submitTest = async (getToken, type, answers) => {
  try {
    return await apiClient.post(getToken, '/tests/submit', { type, answers });
  } catch (error) { throw error; }
};

// --- ADMIN SERVICES ---

export const fetchAllTests = async (getToken, type = '') => {
  try {
    const url = type ? `/tests/admin/all?type=${type}` : `/tests/admin/all`;
    return await apiClient.get(getToken, url);
  } catch (error) { throw error; }
};

export const createTest = async (getToken, testData) => {
  try {
    return await apiClient.post(getToken, '/tests', testData);
  } catch (error) { throw error; }
};

export const updateTest = async (getToken, id, testData) => {
  try {
    return await apiClient.put(getToken, `/tests/${id}`, testData);
  } catch (error) { throw error; }
};

export const deleteTest = async (getToken, id) => {
  try {
    return await apiClient.delete(getToken, `/tests/${id}`);
  } catch (error) { throw error; }
};

export const deleteTestChoice = async (getToken, id) => {
  try {
    return await apiClient.delete(getToken, `/tests/choices/${id}`);
  } catch (error) { throw error; }
};

export const uploadTestImage = async (getToken, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    return await apiClient.post(getToken, '/tests/upload-image', formData);
  } catch (error) { throw error; }
};

export const uploadChoiceImage = async (getToken, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    return await apiClient.post(getToken, '/tests/upload-choice-image', formData);
  } catch (error) { throw error; }
};
