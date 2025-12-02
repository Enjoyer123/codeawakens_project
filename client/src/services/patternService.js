const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Fetch all patterns with optional level_id filter
export const fetchAllPatterns = async (getToken, page = 1, limit = 100, levelId = null) => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (levelId) {
      params.append('level_id', levelId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/patterns?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch patterns' }));
      throw new Error(errorData.message || 'Failed to fetch patterns');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw error;
  }
};

// Fetch pattern by ID
export const fetchPatternById = async (getToken, patternId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/patterns/${patternId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pattern' }));
      throw new Error(errorData.message || 'Failed to fetch pattern');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pattern:', error);
    throw error;
  }
};

// Create pattern
export const createPattern = async (getToken, patternData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/patterns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patternData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create pattern';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
        console.error('Server error response:', errorData);
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating pattern:', error);
    throw error;
  }
};

// Update pattern
export const updatePattern = async (getToken, patternId, patternData) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/patterns/${patternId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patternData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update pattern' }));
      throw new Error(errorData.message || 'Failed to update pattern');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating pattern:', error);
    throw error;
  }
};

// Delete pattern
export const deletePattern = async (getToken, patternId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/patterns/${patternId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete pattern' }));
      throw new Error(errorData.message || 'Failed to delete pattern');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting pattern:', error);
    throw error;
  }
};

// Fetch pattern types
export const fetchPatternTypes = async (getToken) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/patterns/types`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch pattern types' }));
      throw new Error(errorData.message || 'Failed to fetch pattern types');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching pattern types:', error);
    throw error;
  }
};

// Unlock pattern
export const unlockPattern = async (patternId, getToken) => {
  try {
    const token = typeof getToken === 'function' ? await getToken() : getToken;
    const response = await fetch(`${API_BASE_URL}/api/patterns/${patternId}/unlock`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to unlock pattern' }));
      throw new Error(errorData.message || 'Failed to unlock pattern');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error unlocking pattern:', error);
    throw error;
  }
};

// Unlock level
export const unlockLevel = async (levelId, getToken) => {
  try {
    const token = typeof getToken === 'function' ? await getToken() : getToken;
    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}/unlock`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to unlock level' }));
      throw new Error(errorData.message || 'Failed to unlock level');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error unlocking level:', error);
    throw error;
  }
};


