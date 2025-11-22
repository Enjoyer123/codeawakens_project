const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Fetch all rewards with pagination
export const fetchAllRewards = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch rewards' }));
      throw new Error(errorData.message || 'Failed to fetch rewards');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch levels for reward dropdown
export const fetchLevelsForReward = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards/levels`, {
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

// Fetch single reward by ID
export const fetchRewardById = async (getToken, rewardId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reward' }));
      throw new Error(errorData.message || 'Failed to fetch reward');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Create reward
export const createReward = async (getToken, rewardData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rewardData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create reward' }));
      throw new Error(errorData.message || 'Failed to create reward');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Update reward
export const updateReward = async (getToken, rewardId, rewardData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rewardData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update reward' }));
      throw new Error(errorData.message || 'Failed to update reward');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete reward
export const deleteReward = async (getToken, rewardId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete reward' }));
      throw new Error(errorData.message || 'Failed to delete reward');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Upload reward frame image
export const uploadRewardFrame = async (getToken, rewardId, imageFile, frameNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('frame_number', frameNumber.toString());
    formData.append('reward_id', rewardId.toString());

    const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}/frames`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload reward frame' }));
      throw new Error(errorData.message || 'Failed to upload reward frame');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete reward frame image
export const deleteRewardFrame = async (getToken, rewardId, frameNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/rewards/${rewardId}/frames`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ frame_number: frameNumber.toString() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete reward frame' }));
      throw new Error(errorData.message || 'Failed to delete reward frame');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

