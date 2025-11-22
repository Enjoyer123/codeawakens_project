const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Fetch all victory conditions with pagination
export const fetchAllVictoryConditions = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/victory-conditions?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch victory conditions' }));
      throw new Error(errorData.message || 'Failed to fetch victory conditions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching victory conditions:', error);
    throw error;
  }
};

// Create victory condition
export const createVictoryCondition = async (getToken, victoryConditionData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/victory-conditions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(victoryConditionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create victory condition' }));
      throw new Error(errorData.message || 'Failed to create victory condition');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating victory condition:', error);
    throw error;
  }
};

// Update victory condition
export const updateVictoryCondition = async (getToken, victoryConditionId, victoryConditionData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/victory-conditions/${victoryConditionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(victoryConditionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update victory condition' }));
      throw new Error(errorData.message || 'Failed to update victory condition');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating victory condition:', error);
    throw error;
  }
};

// Delete victory condition
export const deleteVictoryCondition = async (getToken, victoryConditionId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/victory-conditions/${victoryConditionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete victory condition' }));
      const error = new Error(errorData.message || 'Failed to delete victory condition');
      error.response = response;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting victory condition:', error);
    throw error;
  }
};

// Get victory condition by ID
export const getVictoryConditionById = async (getToken, victoryConditionId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/victory-conditions/${victoryConditionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch victory condition' }));
      throw new Error(errorData.message || 'Failed to fetch victory condition');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching victory condition:', error);
    throw error;
  }
};

