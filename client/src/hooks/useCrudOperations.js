import { useState, useEffect, useCallback } from 'react';
import { createLoadErrorMessage, createSaveErrorMessage, createDeleteErrorMessage } from '../utils/errorHandler';

/**
 * Custom hook for CRUD operations
 * @param {object} config - Configuration object
 * @param {function} config.fetchFn - Function to fetch items (getToken, page, rowsPerPage, searchQuery)
 * @param {function} config.createFn - Function to create item (getToken, data)
 * @param {function} config.updateFn - Function to update item (getToken, id, data)
 * @param {function} config.deleteFn - Function to delete item (getToken, id)
 * @param {function} config.getToken - Function to get auth token
 * @param {number} config.page - Current page
 * @param {number} config.rowsPerPage - Rows per page
 * @param {string} config.searchQuery - Search query
 * @param {string} config.entityName - Entity name for error messages (e.g., 'blocks', 'weapons')
 * @param {string} config.entityNameThai - Entity name in Thai for error messages (e.g., 'บล็อก', 'อาวุธ')
 * @param {function} config.onPageChange - Callback when page changes
 * @param {function} config.onSearchChange - Callback when search changes
 * @returns {object} CRUD state and handlers
 */
export const useCrudOperations = ({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  getToken,
  page,
  rowsPerPage,
  searchQuery,
  entityName = 'items',
  entityNameThai = 'รายการ',
  onPageChange,
  onSearchChange,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: rowsPerPage,
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFn(getToken, page, rowsPerPage, searchQuery);
      
      // Handle different response structures
      const itemsKey = Object.keys(data).find(key => 
        key.includes(entityName) || 
        key === 'data' || 
        Array.isArray(data[key])
      );
      
      const itemsArray = itemsKey ? data[itemsKey] : data.items || data.data || [];
      
      setItems(Array.isArray(itemsArray) ? itemsArray : []);
      setPagination(data.pagination || {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } catch (err) {
      const errorMessage = createLoadErrorMessage(entityName, err);
      setError(errorMessage);
      setItems([]);
      setPagination({
        total: 0,
        totalPages: 0,
        page: 1,
        limit: rowsPerPage,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFn, getToken, page, rowsPerPage, searchQuery, entityName]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = useCallback(async (itemId, formData, onSuccess) => {
    try {
      if (itemId) {
        await updateFn(getToken, itemId, formData);
      } else {
        await createFn(getToken, formData);
      }
      await loadItems();
      onSuccess?.();
      return { success: true };
    } catch (err) {
      const errorMessage = createSaveErrorMessage(entityNameThai, err);
      return { success: false, error: errorMessage };
    }
  }, [createFn, updateFn, getToken, loadItems, entityNameThai]);

  const handleDelete = useCallback(async (itemId, onSuccess) => {
    try {
      await deleteFn(getToken, itemId);
      await loadItems();
      onSuccess?.();
      return { success: true };
    } catch (err) {
      const errorMessage = createDeleteErrorMessage(entityNameThai, err);
      return { success: false, error: errorMessage };
    }
  }, [deleteFn, getToken, loadItems, entityNameThai]);

  const handlePageChange = useCallback((newPage) => {
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleSearchChange = useCallback((value) => {
    onSearchChange?.(value);
  }, [onSearchChange]);

  return {
    items,
    loading,
    error,
    pagination,
    loadItems,
    handleSave,
    handleDelete,
    handlePageChange,
    handleSearchChange,
  };
};

