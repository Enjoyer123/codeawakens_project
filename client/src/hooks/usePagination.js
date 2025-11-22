import { useState, useCallback } from 'react';

/**
 * Custom hook for pagination logic
 * @param {number} initialPage - Initial page number (default: 1)
 * @param {number} rowsPerPage - Number of rows per page (default: 10)
 * @returns {object} Pagination state and handlers
 */
export const usePagination = (initialPage = 1, rowsPerPage = 10) => {
  const [page, setPage] = useState(initialPage);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    rowsPerPage,
    handlePageChange,
    resetPage,
  };
};

