const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const getAuthToken = () => {
  return localStorage.getItem('workspace_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('workspace_token', token);
  } else {
    localStorage.removeItem('workspace_token');
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data.errors || data.details || null
      );
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err.message || 'Network error occurred. Please check your internet connection.',
      0
    );
  }
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  del: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};

export default api;
