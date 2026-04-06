
import { API_BASE_URL } from '../config/apiConfig';

// Fetch all users (admin only) with pagination
export const fetchAllUsers = async (getToken, page = 1, limit = 5, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
      throw new Error(errorData.message || 'Failed to fetch users');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserRole = async (getToken, userId, role) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update user role' }));
      throw new Error(errorData.message || 'Failed to update user role');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const getUserDetails = async (getToken, userId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user details' }));
      throw new Error(errorData.message || 'Failed to fetch user details');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (getToken, userId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
      throw new Error(errorData.message || 'Failed to delete user');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }

};

export const resetUserTestScore = async (getToken, userId, type) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No token');

    const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }), // 'pre' or 'post'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to reset score' }));
      throw new Error(errorData.message || 'Failed to reset score');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserTestHistory = async (getToken, userId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No token');

    const response = await fetch(`${API_BASE_URL}/users/${userId}/tests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch history' }));
      throw new Error(errorData.message || 'Failed to fetch history');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};