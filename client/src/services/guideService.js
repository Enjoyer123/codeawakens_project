import { API_BASE_URL } from '../config/apiConfig';

// Fetch all guides with pagination
export const fetchAllGuides = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/api/guides?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch guides' }));
      throw new Error(errorData.message || 'Failed to fetch guides');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch guides by level
export const fetchGuidesByLevel = async (getToken, levelId) => {
  try {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/api/guides/level/${levelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch guides' }));
      throw new Error(errorData.message || 'Failed to fetch guides');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Fetch levels for guide dropdown
export const fetchLevelsForGuide = async (getToken) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/levels`, {
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

// Fetch single guide by ID
export const fetchGuideById = async (getToken, guideId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/${guideId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch guide' }));
      throw new Error(errorData.message || 'Failed to fetch guide');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Create guide
export const createGuide = async (getToken, guideData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    console.log('Creating guide with data:', guideData);

    const response = await fetch(`${API_BASE_URL}/api/guides`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guideData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      console.error('Error response:', errorData);
      throw new Error(errorData.message || `Failed to create guide (${response.status})`);
    }

    const data = await response.json();
    console.log('Guide created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createGuide:', error);
    throw error;
  }
};

// Update guide
export const updateGuide = async (getToken, guideId, guideData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/${guideId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guideData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update guide' }));
      throw new Error(errorData.message || 'Failed to update guide');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete guide
export const deleteGuide = async (getToken, guideId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/${guideId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete guide' }));
      throw new Error(errorData.message || 'Failed to delete guide');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Upload guide image
export const uploadGuideImage = async (getToken, guideId, imageFile) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    console.log('Uploading guide image:', {
      guideId,
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    const response = await fetch(`${API_BASE_URL}/api/guides/${guideId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      console.error('Error response:', errorData);
      throw new Error(errorData.message || `Failed to upload guide image (${response.status})`);
    }

    const data = await response.json();
    console.log('Guide image uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in uploadGuideImage:', error);
    throw error;
  }
};

// Delete guide image
export const deleteGuideImage = async (getToken, imageId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete guide image' }));
      throw new Error(errorData.message || 'Failed to delete guide image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

