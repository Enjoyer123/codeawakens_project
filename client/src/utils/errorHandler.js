/**
 * Format error message from error object
 * @param {Error|string|unknown} error - Error object or message
 * @param {string} defaultMessage - Default message if error is not available
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error, defaultMessage = 'เกิดข้อผิดพลาด') => {
  if (!error) return defaultMessage;
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return defaultMessage;
};

/**
 * Create error message for loading operations
 * @param {string} entityName - Name of the entity (e.g., 'blocks', 'weapons')
 * @param {Error|string|unknown} error - Error object
 * @returns {string} Formatted error message
 */
export const createLoadErrorMessage = (entityName, error) => {
  const baseMessage = `Failed to load ${entityName}.`;
  const errorMessage = formatErrorMessage(error);
  return errorMessage ? `${baseMessage} ${errorMessage}` : baseMessage;
};

/**
 * Create error message for save operations
 * @param {string} entityName - Name of the entity
 * @param {Error|string|unknown} error - Error object
 * @returns {string} Formatted error message
 */
export const createSaveErrorMessage = (entityName, error) => {
  const baseMessage = `ไม่สามารถบันทึก${entityName}ได้`;
  const errorMessage = formatErrorMessage(error);
  return errorMessage ? `${baseMessage}: ${errorMessage}` : baseMessage;
};

/**
 * Create error message for delete operations
 * @param {string} entityName - Name of the entity
 * @param {Error|string|unknown} error - Error object
 * @returns {string} Formatted error message
 */
export const createDeleteErrorMessage = (entityName, error) => {
  const baseMessage = `ไม่สามารถลบ${entityName}ได้`;
  const errorMessage = formatErrorMessage(error);
  return errorMessage ? `${baseMessage}: ${errorMessage}` : baseMessage;
};

