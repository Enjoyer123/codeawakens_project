import { API_BASE_URL } from '../config/apiConfig';

export const fetchUserProfile = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/check-profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user profile' }));
      throw new Error(errorData.message || 'Failed to fetch user profile');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateUsername = async (getToken, username) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/profile/username`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update username' }));
      throw new Error(errorData.message || 'Failed to update username');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfileImage = async (getToken, file) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch(`${API_BASE_URL}/profile/profile/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload profile image' }));
      throw new Error(errorData.message || 'Failed to upload profile image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteProfileImage = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/profile/image`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete profile image' }));
      throw new Error(errorData.message || 'Failed to delete profile image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserByClerkId = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/user`, {
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

export const saveUserProgress = async (getToken, progressData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to save user progress' }));
      throw new Error(errorData.message || 'Failed to save user progress');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const checkAndAwardRewards = async (getToken, levelId, totalScore) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/profile/rewards/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level_id: levelId,
        total_score: totalScore,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to check and award rewards' }));
      throw new Error(errorData.message || 'Failed to check and award rewards');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};