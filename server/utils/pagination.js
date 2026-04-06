/**
 * Parse pagination parameters from query string
 * @param {object} query - req.query object
 * @param {number} [defaultLimit=10] - default items per page
 * @returns {{ page: number, limit: number, search: string, skip: number }}
 */
export const parsePagination = (query, defaultLimit = 10) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || defaultLimit;
  const search = query.search || "";
  const skip = (page - 1) * limit;
  return { page, limit, search, skip };
}

/**
 * Build pagination metadata for response
 * @param {number} page - current page
 * @param {number} limit - items per page
 * @param {number} total - total items count
 * @returns {{ page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean }}
 */
export const buildPaginationResponse = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}


