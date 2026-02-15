/**
 * Shared state for Blockly operations
 * Replaces window.__blocklySetLoadingXml and window.__blocklyIsLoadingXml
 */

let isLoadingXml = false;

/**
 * Set the XML loading state
 * @param {boolean} loading - Whether XML is currently loading
 */
export const setXmlLoading = (loading) => {
    isLoadingXml = !!loading;
};

/**
 * Check if XML is currently loading
 * @returns {boolean} - True if XML is loading
 */
export const isXmlLoading = () => {
    return isLoadingXml;
};
