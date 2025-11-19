
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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

      const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
        throw new Error(errorData.message || 'Failed to fetch users');
      }
  
      const data = await response.json();
      return data;
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
  
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
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
  
      const data = await response.json();
      return data;
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
  
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user details' }));
        throw new Error(errorData.message || 'Failed to fetch user details');
      }
  
      const data = await response.json();
      return data;
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
  
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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
  
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };