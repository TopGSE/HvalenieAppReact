import axios from 'axios';

let refreshingToken = null;

export const setupTokenRefresh = () => {
  // Add a request interceptor to add the token to all requests
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is not 401 or the request was already retried, reject
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }
      
      // Mark this request as retried
      originalRequest._retry = true;
      
      // Check if we have a refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return Promise.reject(error);
      }
      
      try {
        // Use a shared refreshing token promise to prevent multiple refresh requests
        if (!refreshingToken) {
          refreshingToken = axios.post('http://localhost:5000/auth/refresh-token', {
            refreshToken
          }).then(res => {
            refreshingToken = null;
            return res;
          }).catch(err => {
            refreshingToken = null;
            throw err;
          });
        }
        
        const res = await refreshingToken;
        
        // Update the stored tokens
        localStorage.setItem('token', res.data.token);
        
        // Update the request header and retry
        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh token is invalid, clear everything and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        
        window.location.href = '/login'; // Hard redirect to login page
        return Promise.reject(refreshError);
      }
    }
  );
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    if (refreshToken) {
      // Notify the server to invalidate this refresh token
      await axios.post('http://localhost:5000/auth/logout', { refreshToken });
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