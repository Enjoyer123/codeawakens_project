import { API_BASE_URL } from '../config/apiConfig';

// Get all test cases for a level
export const fetchTestCasesByLevel = async (getToken, levelId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/test-cases/level/${levelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch test cases' }));
      throw new Error(errorData.message || 'Failed to fetch test cases');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Create test case
export const createTestCase = async (getToken, data) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/test-cases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create test case' }));
      throw new Error(errorData.message || 'Failed to create test case');
    }

    return await response.json();
  } catch (error) {
    console.error('Create test case error:', error);
    throw error;
  }
};

// Update test case
export const updateTestCase = async (getToken, testCaseId, data) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/test-cases/${testCaseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update test case' }));
      throw new Error(errorData.message || 'Failed to update test case');
    }

    return await response.json();
  } catch (error) {
    console.error('Update test case error:', error);
    throw error;
  }
};

// Delete test case
export const deleteTestCase = async (getToken, testCaseId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/test-cases/${testCaseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete test case' }));
      throw new Error(errorData.message || 'Failed to delete test case');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
