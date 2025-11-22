/**
 * Get full image URL from path
 * @param {string} pathFile - Image path
 * @returns {string|null} Full URL or null if path is empty
 */
export const getImageUrl = (pathFile) => {
  if (!pathFile) return null;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${pathFile}`;
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

