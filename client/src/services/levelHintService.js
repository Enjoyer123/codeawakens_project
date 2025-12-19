import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const fetchHintsByLevel = async (getToken, levelId) => {
  const token = await getToken();
  const res = await axios.get(`${API_BASE_URL}/api/levels/${levelId}/hints`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const fetchAllLevelHints = async (getToken, page = 1, limit = 10, search = '') => {
  const token = await getToken();
  const res = await axios.get(`${API_BASE_URL}/api/level-hints`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, limit, search },
  });
  return res.data;
};

export const createLevelHint = async (getToken, data) => {
  const token = await getToken();
  const res = await axios.post(`${API_BASE_URL}/api/level-hints`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateLevelHint = async (getToken, hintId, data) => {
  const token = await getToken();
  const res = await axios.put(`${API_BASE_URL}/api/level-hints/${hintId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteLevelHint = async (getToken, hintId) => {
  const token = await getToken();
  const res = await axios.delete(`${API_BASE_URL}/api/level-hints/${hintId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const uploadHintImage = async (getToken, hintId, file) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('image', file);

  const res = await axios.post(
    `${API_BASE_URL}/api/level-hints/${hintId}/images`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

export const deleteHintImage = async (getToken, imageId) => {
  const token = await getToken();
  const res = await axios.delete(
    `${API_BASE_URL}/api/level-hints/images/${imageId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};



