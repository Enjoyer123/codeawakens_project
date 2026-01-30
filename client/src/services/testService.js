import { API_BASE_URL } from '../config/apiConfig';

export const fetchTestsByType = async (getToken, type) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests/${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Failed to fetch tests');
      error.response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const submitTest = async (getToken, type, answers) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, answers }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit test');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// --- ADMIN SERVICES ---

export const fetchAllTests = async (getToken, type = '') => {
  try {
    const token = await getToken();
    const url = type
      ? `${API_BASE_URL}/api/tests/admin/all?type=${type}`
      : `${API_BASE_URL}/api/tests/admin/all`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("as", response);

    if (!response.ok) throw new Error('Failed to fetch tests');
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const createTest = async (getToken, testData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to create test');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const updateTest = async (getToken, id, testData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update test');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteTest = async (getToken, id) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to delete test');
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteTestChoice = async (getToken, id) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/tests/choices/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to delete choice');
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const uploadTestImage = async (getToken, file) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/api/tests/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Content-Type is set automatically for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to upload image');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const uploadChoiceImage = async (getToken, file) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/api/tests/upload-choice-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to upload choice image');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};
