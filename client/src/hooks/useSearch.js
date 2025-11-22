import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for search functionality with optional debounce
 * @param {function} onSearchChange - Callback when search changes
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 0, no debounce)
 * @returns {object} Search state and handlers
 */
export const useSearch = (onSearchChange, debounceMs = 0) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        onSearchChange?.(searchQuery);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      onSearchChange?.(searchQuery);
    }
  }, [searchQuery, debounceMs, onSearchChange]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    clearSearch,
  };
};

