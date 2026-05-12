/**
 * Demo API Service — Public fetch functions (no Clerk token required).
 * Used by DemoGameCore for the landing page interactive demo.
 */
import { API_BASE_URL } from '../../config/apiConfig';

const demoFetch = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(err.message || `Demo API error (${response.status})`);
  }
  const json = await response.json();
  // Mirror the apiClient response shape: unwrap json.data
  if (json.data === null || json.data === undefined) return null;
  if (typeof json.data === 'object' && !Array.isArray(json.data)) {
    json.data.message = json.message;
  }
  return json.data;
};

export const fetchDemoLevel = (levelId) => demoFetch(`/demo/level/${levelId}`);
export const fetchDemoWeapons = () => demoFetch('/demo/weapons');
