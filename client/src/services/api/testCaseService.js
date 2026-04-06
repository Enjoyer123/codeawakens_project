import apiClient from './apiClient';

export const fetchTestCasesByLevel = async (getToken, levelId) => {
  try {
    return await apiClient.get(getToken, `/test-cases/level/${levelId}`);
  } catch (error) { throw error; }
};

export const createTestCase = async (getToken, data) => {
  try {
    return await apiClient.post(getToken, '/test-cases', data);
  } catch (error) {
    console.error('Create test case error:', error);
    throw error;
  }
};

export const updateTestCase = async (getToken, testCaseId, data) => {
  try {
    return await apiClient.put(getToken, `/test-cases/${testCaseId}`, data);
  } catch (error) {
    console.error('Update test case error:', error);
    throw error;
  }
};

export const deleteTestCase = async (getToken, testCaseId) => {
  try {
    return await apiClient.delete(getToken, `/test-cases/${testCaseId}`);
  } catch (error) { throw error; }
};
