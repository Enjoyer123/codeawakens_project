const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Fetch all levels with pagination
export const fetchAllLevels = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/levels?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch levels' }));
      throw new Error(errorData.message || 'Failed to fetch levels');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch all categories
export const fetchAllCategories = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
      throw new Error(errorData.message || 'Failed to fetch categories');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch levels for prerequisite dropdown
export const fetchLevelsForPrerequisite = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels/prerequisites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch levels' }));
      throw new Error(errorData.message || 'Failed to fetch levels');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch single level by ID
export const fetchLevelById = async (getToken, levelId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch level' }));
      throw new Error(errorData.message || 'Failed to fetch level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Create level
export const createLevel = async (getToken, levelData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(levelData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create level' }));
      throw new Error(errorData.message || 'Failed to create level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Update level
export const updateLevel = async (getToken, levelId, levelData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(levelData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update level' }));
      throw new Error(errorData.message || 'Failed to update level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete level
export const deleteLevel = async (getToken, levelId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete level' }));
      throw new Error(errorData.message || 'Failed to delete level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Upload level background image
export const uploadLevelBackgroundImage = async (getToken, imageFile) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('backgroundImage', imageFile);

    const response = await fetch(`${API_BASE_URL}/api/levels/upload-background`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload background image' }));
      throw new Error(errorData.message || 'Failed to upload background image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

