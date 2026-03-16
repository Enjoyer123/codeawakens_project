import { API_BASE_URL } from '../config/apiConfig';

/**
 * Get full image URL from path
 * @param {string} pathFile - Image path
 * @returns {string|null} Full URL or null if path is empty
 */
export const getImageUrl = (pathFile) => {
  if (!pathFile) return null;
  
  // Ensure we don't end up with double slashes if API_BASE_URL ends with one
  // and ensure pathFile starts with a slash if it doesn't already
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = pathFile.startsWith('/') ? pathFile : `/${pathFile}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Check if URL is already a full URL (starts with http)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isFullUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
};

/**
 * Get image URL, handling both relative paths and full URLs
 * @param {string} pathFile - Image path or URL
 * @returns {string|null} Full URL or null if path is empty
 */
export const getImageUrlSafe = (pathFile) => {
  if (!pathFile) return null;
  if (isFullUrl(pathFile)) return pathFile;
  return getImageUrl(pathFile);
};

