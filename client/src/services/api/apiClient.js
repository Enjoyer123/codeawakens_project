import { API_BASE_URL } from '../../config/apiConfig';

const fetchWithClient = async (getToken, endpoint, options = {}) => {
  const token = await getToken();

  const headers = new Headers({
    'Authorization': `Bearer ${token}`
  });

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
    throw new Error(errorData.message || `API request failed (${response.status})`);
  }

  const json = await response.json();
  if (options.returnFullResponse) {
    return json;
  }
  return json.data;
};

const apiClient = {
  get: (getToken, endpoint, config = {}) => fetchWithClient(getToken, endpoint, { method: 'GET', ...config }),

  post: (getToken, endpoint, data, config = {}) => {
    // If data is undefined/null, don't set body. If it's FormData pass as is, otherwise stringify.
    let body = undefined;
    if (data !== undefined && data !== null) {
      body = data instanceof FormData ? data : JSON.stringify(data);
    }
    return fetchWithClient(getToken, endpoint, { method: 'POST', body, ...config });
  },

  put: (getToken, endpoint, data, config = {}) => {
    let body = undefined;
    if (data !== undefined && data !== null) {
      body = data instanceof FormData ? data : JSON.stringify(data);
    }
    return fetchWithClient(getToken, endpoint, { method: 'PUT', body, ...config });
  },

  delete: (getToken, endpoint, data, config = {}) => {
    let body = undefined;
    if (data !== undefined && data !== null) {
      body = data instanceof FormData ? data : JSON.stringify(data);
    }
    return fetchWithClient(getToken, endpoint, { method: 'DELETE', body, ...config });
  },
};

export default apiClient;
