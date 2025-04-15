import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// List of public routes that don't require authentication
const publicRoutes = [
  'auth/login',
  'auth/register',
  '/photos/home',
  '/photos/client',
  '/photos/sponsor',
  '/photos/:id/likes', // Public route to get photo likes
];

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !publicRoutes.some(route => config.url.includes(route))) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for public routes
    if (publicRoutes.some(route => originalRequest.url.includes(route))) {
      return Promise.reject(error);
    }

    // If the error is due to an expired token, try to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/refresh-token`, { refreshToken });
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Redirect to login if refresh fails
    return null;
  }
};

export default api;