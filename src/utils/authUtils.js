import axios from 'axios';
import API_URL from "./api";

export const setupTokenRefresh = () => {
  // Add request interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Prevent infinite loops
      if (error.response?.status === 401 && originalRequest._retry) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return Promise.reject(error);
        }
        
        try {
          const res = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          localStorage.setItem('token', res.data.token);
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('username');
          localStorage.removeItem('userRole');
          localStorage.removeItem('user');
          
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    if (refreshToken) {
      // Notify the server to invalidate this refresh token
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Clear local storage regardless of API call result
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
  }
};