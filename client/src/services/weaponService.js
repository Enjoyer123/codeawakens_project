import { API_BASE_URL } from '../config/apiConfig';

// Fetch all weapons with pagination
export const fetchAllWeapons = async (getToken, page = 1, limit = 10, search = '') => {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/weapons?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch weapons' }));
      throw new Error(errorData.message || 'Failed to fetch weapons');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Fetch single weapon by ID
export const fetchWeaponById = async (getToken, weaponId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/weapons/${weaponId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch weapon' }));
      throw new Error(errorData.message || 'Failed to fetch weapon');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Create weapon
export const createWeapon = async (getToken, weaponData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/weapons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weaponData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create weapon' }));
      throw new Error(errorData.message || 'Failed to create weapon');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Update weapon
export const updateWeapon = async (getToken, weaponId, weaponData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/weapons/${weaponId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weaponData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update weapon' }));
      throw new Error(errorData.message || 'Failed to update weapon');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Delete weapon
export const deleteWeapon = async (getToken, weaponId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/weapons/${weaponId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete weapon' }));
      throw new Error(errorData.message || 'Failed to delete weapon');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Add weapon image
export const addWeaponImage = async (getToken, weaponId, imageFile, imageData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type_file', imageData.type_file);
    formData.append('type_animation', imageData.type_animation);
    formData.append('frame', imageData.frame.toString());
    formData.append('weapon_key', imageData.weapon_key);

    console.log('Uploading image:', {
      weaponId,
      type_file: imageData.type_file,
      type_animation: imageData.type_animation,
      frame: imageData.frame,
      weapon_key: imageData.weapon_key,
      fileName: imageFile.name,
      fileSize: imageFile.size
    });

    const response = await fetch(`${API_BASE_URL}/weapons/${weaponId}/images`, {
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
      throw new Error(errorData.message || `Failed to add weapon image (${response.status})`);
    }

    const data = await response.json();
    console.log('Image uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in addWeaponImage:', error);
    throw error;
  }
};

// Update weapon image
export const updateWeaponImage = async (getToken, imageId, imageFile, imageData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (imageData.type_file) {
      formData.append('type_file', imageData.type_file);
    }
    if (imageData.type_animation) {
      formData.append('type_animation', imageData.type_animation);
    }
    if (imageData.frame !== undefined) {
      formData.append('frame', imageData.frame.toString());
    }

    console.log('Updating image:', {
      imageId,
      type_file: imageData.type_file,
      type_animation: imageData.type_animation,
      frame: imageData.frame,
      hasFile: !!imageFile,
      fileName: imageFile?.name,
      fileSize: imageFile?.size
    });

    const response = await fetch(`${API_BASE_URL}/weapons/images/${imageId}`, {
      method: 'PUT',
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
      throw new Error(errorData.message || `Failed to update weapon image (${response.status})`);
    }

    const data = await response.json();
    console.log('Image updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateWeaponImage:', error);
    throw error;
  }
};

// Delete weapon image
export const deleteWeaponImage = async (getToken, imageId) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/weapons/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete weapon image' }));
      throw new Error(errorData.message || 'Failed to delete weapon image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

