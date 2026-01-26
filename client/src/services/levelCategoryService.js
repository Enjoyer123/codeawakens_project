const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Fetch all level categories without pagination
export const fetchAllLevelCategories = async (getToken, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/level-categories?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch level categories' }));
      throw new Error(errorData.message || 'Failed to fetch level categories');
    }

    const data = await response.json();
    console.log('🔍 [fetchAllLevelCategories] data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching level categories:', error);
    throw error;
  }
};

// Create level category
export const createLevelCategory = async (getToken, levelCategoryData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/level-categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(levelCategoryData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create level category' }));
      throw new Error(errorData.message || 'Failed to create level category');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating level category:', error);
    throw error;
  }
};

// Update level category
export const updateLevelCategory = async (getToken, categoryId, levelCategoryData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/level-categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(levelCategoryData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update level category' }));
      throw new Error(errorData.message || 'Failed to update level category');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating level category:', error);
    throw error;
  }
};

// Delete level category
export const deleteLevelCategory = async (getToken, categoryId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/level-categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete level category' }));
      const error = new Error(errorData.message || 'Failed to delete level category');
      error.response = response;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting level category:', error);
    throw error;
  }
};

// Get level category by ID
export const getLevelCategoryById = async (getToken, categoryId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/level-categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch level category' }));
      throw new Error(errorData.message || 'Failed to fetch level category');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching level category:', error);
    throw error;
  }
};

