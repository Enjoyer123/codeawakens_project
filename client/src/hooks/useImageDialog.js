import { useState, useCallback } from 'react';

/**
 * A shared hook for managing image dialog state (open/close, selected item, error).
 * Designed to reduce boilerplate in management pages with image dialogs.
 *
 * @param {Function} selector (optional) A function to extract the relevant entity from a list based on selectedId
 * @returns {Object} { isOpen, selectedId, error, openDialog, closeDialog, setError, dialogItem }
 */
export const useImageDialog = (list = [], idField = 'id') => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  const openDialog = useCallback((item) => {
    if (item && item[idField]) {
      setSelectedId(item[idField]);
    }
    setError(null);
    setIsOpen(true);
  }, [idField]);

  const closeDialog = useCallback((openState = false) => {
    setIsOpen(openState);
    if (!openState) {
      setSelectedId(null);
      setError(null);
    }
  }, []);

  // Optionally derived selected item for passing to the dialog component
  const dialogItem = selectedId && list ? list.find(item => item[idField] === selectedId) : null;

  return {
    isOpen,
    selectedId,
    error,
    openDialog,
    closeDialog,
    setError,
    dialogItem
  };
};
