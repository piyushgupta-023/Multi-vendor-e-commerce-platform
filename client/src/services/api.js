import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('marketnest_token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/login') || 
                        error.config?.url?.includes('/auth/register') ||
                        error.config?.url?.includes('/auth/demo-login');
      if (!isAuthUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('marketnest_token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('marketnest_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
