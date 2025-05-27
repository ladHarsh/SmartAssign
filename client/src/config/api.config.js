const BASE_URL = process.env.NODE_ENV === 'production'
     ? 'https://ai-based-evaluation-platform.onrender.com'  // Remove any trailing slash
    // ? process.env.REACT_APP_BASE_URL
    : 'http://localhost:9000';

const API_BASE_URL = `${BASE_URL}/api`;

export const getApiUrl = (endpoint) => {
    // Add a leading slash if endpoint doesn't have one
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${normalizedEndpoint}`;
};

export const getBaseUrl = (path) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${normalizedPath}`;
};

// export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;
// export const getBaseUrl = (path) => `${BASE_URL}${path}`; 