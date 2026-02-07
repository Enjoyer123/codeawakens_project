import { API_BASE_URL } from '../config/apiConfig';

// Fetch all blocks with pagination (public endpoint for users)
export const fetchPublicBlocks = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/blocks/public?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch blocks' }));
      throw new Error(errorData.message || 'Failed to fetch blocks');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
};

// Fetch all blocks with pagination (admin endpoint)
export const fetchAllBlocks = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/blocks?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch blocks' }));
      throw new Error(errorData.message || 'Failed to fetch blocks');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
};

// Create block
export const createBlock = async (getToken, blockData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/blocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create block' }));
      throw new Error(errorData.message || 'Failed to create block');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating block:', error);
    throw error;
  }
};

// Update block
export const updateBlock = async (getToken, blockId, blockData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update block' }));
      throw new Error(errorData.message || 'Failed to update block');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating block:', error);
    throw error;
  }
};

// Delete block
export const deleteBlock = async (getToken, blockId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/blocks/${blockId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete block' }));
      const error = new Error(errorData.message || 'Failed to delete block');
      error.response = response;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting block:', error);
    throw error;
  }
};

// Get block by ID
export const getBlockById = async (getToken, blockId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/blocks/${blockId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch block' }));
      throw new Error(errorData.message || 'Failed to fetch block');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching block:', error);
    throw error;
  }
};

export const uploadBlockImage = async (getToken, file) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/api/blocks/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to upload block image');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

