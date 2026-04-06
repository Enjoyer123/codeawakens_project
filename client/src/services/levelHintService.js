import { API_BASE_URL } from '../config/apiConfig';

export const fetchHintsByLevel = async (getToken, levelId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/levels/${levelId}/hints`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch hints' }));
      throw new Error(errorData.message || 'Failed to fetch hints');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAllLevelHints = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search.trim()) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/level-hints?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch level hints' }));
      throw new Error(errorData.message || 'Failed to fetch level hints');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const createLevelHint = async (getToken, data) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/level-hints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create level hint' }));
      throw new Error(errorData.message || 'Failed to create level hint');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const updateLevelHint = async (getToken, hintId, data) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/level-hints/${hintId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update level hint' }));
      throw new Error(errorData.message || 'Failed to update level hint');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const deleteLevelHint = async (getToken, hintId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/level-hints/${hintId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete level hint' }));
      throw new Error(errorData.message || 'Failed to delete level hint');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const uploadHintImage = async (getToken, hintId, file) => {
  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/level-hints/${hintId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload hint image' }));
      throw new Error(errorData.message || 'Failed to upload hint image');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};

export const deleteHintImage = async (getToken, imageId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/level-hints/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete hint image' }));
      throw new Error(errorData.message || 'Failed to delete hint image');
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    throw error;
  }
};
