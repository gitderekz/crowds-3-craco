

// src/services/authService.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Store tokens and user data consistently
const storeTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// Get user from localStorage
const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// Create axios instances
const api = axios.create({
  baseURL: API_URL,
});

const publicApi = axios.create({
  baseURL: API_URL,
});

// List of public endpoints that don't require authentication
const isPublicEndpoint = (url) => {
  const publicEndpoints = [
    '/photos/home',
    '/photos/categories',
    '/photos/sponsor',
    '/photos/public',
    '/auth/login',
    '/auth/register',
    '/categories'
  ];
  
  return publicEndpoints.some(endpoint => url.includes(endpoint));
};

// Request interceptor for API (authenticated requests)
api.interceptors.request.use(
  (config) => {
    // For FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    
    if (!isPublicEndpoint(config.url)) {
      const token = getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for API
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        storeTokens(accessToken, newRefreshToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Setup automatic token refresh
const setupTokenRefresh = () => {
  let refreshInterval;
  
  const checkAndRefresh = async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    if (accessToken && refreshToken) {
      try {
        const decoded = jwtDecode(accessToken);
        if (decoded.exp * 1000 < Date.now() + 300000) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          storeTokens(response.data.accessToken, response.data.refreshToken);
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }
  };
  
  refreshInterval = setInterval(checkAndRefresh, 300000);
  
  return () => {
    if (refreshInterval) clearInterval(refreshInterval);
  };
};

export { 
  api, 
  publicApi, 
  storeTokens, 
  clearTokens, 
  getAccessToken, 
  getRefreshToken, 
  getUser,
  setupTokenRefresh 
};


// --------------------------------------------
// // src/services/authService.js
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Store tokens and user data consistently
// const storeTokens = (accessToken, refreshToken) => {
//   localStorage.setItem('accessToken', accessToken);
//   localStorage.setItem('refreshToken', refreshToken);
// };

// const clearTokens = () => {
//   localStorage.removeItem('accessToken');
//   localStorage.removeItem('refreshToken');
//   localStorage.removeItem('user');
// };

// const getAccessToken = () => localStorage.getItem('accessToken');
// const getRefreshToken = () => localStorage.getItem('refreshToken');

// // Get user from localStorage
// const getUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem('user') || 'null');
//   } catch {
//     return null;
//   }
// };

// // Axios instance with interceptors
// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Public API instance (no auth required)
// const publicApi = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // List of public endpoints that don't require authentication
// const isPublicEndpoint = (url) => {
//   const publicEndpoints = [
//     '/photos/home',
//     '/photos/categories',
//     '/photos/sponsor',
//     '/photos/public',
//     '/auth/login',
//     '/auth/register',
//     '/categories'
//   ];
  
//   return publicEndpoints.some(endpoint => url.includes(endpoint));
// };

// // Request interceptor to add auth token
// api.interceptors.request.use(
//   (config) => {
//     // For multipart/form-data, don't set Content-Type (let browser set it with boundary)
//     if (config.data instanceof FormData) {
//       delete config.headers['Content-Type'];
//     }
    
//     if (!isPublicEndpoint(config.url)) {
//       const token = getAccessToken();
//       if (token) {
//         config.headers['Authorization'] = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor to handle token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     // If error is 401 and we haven't already retried
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
      
//       try {
//         const refreshToken = getRefreshToken();
//         if (!refreshToken) throw new Error('No refresh token');
        
//         // Attempt to refresh tokens
//         const response = await axios.post(`${API_URL}/auth/refresh-token`, {
//           refreshToken
//         });
        
//         const { accessToken, refreshToken: newRefreshToken } = response.data;
//         storeTokens(accessToken, newRefreshToken);
        
//         // Retry original request with new token
//         originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Refresh failed - clear tokens and redirect to login
//         clearTokens();
//         window.location.href = '/';
//         return Promise.reject(refreshError);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Setup automatic token refresh
// const setupTokenRefresh = () => {
//   let refreshInterval;
  
//   const checkAndRefresh = async () => {
//     const accessToken = getAccessToken();
//     const refreshToken = getRefreshToken();
    
//     if (accessToken && refreshToken) {
//       try {
//         const decoded = jwtDecode(accessToken);
//         // Refresh if token expires in less than 5 minutes
//         if (decoded.exp * 1000 < Date.now() + 300000) {
//           const response = await axios.post(`${API_URL}/auth/refresh-token`, {
//             refreshToken
//           });
//           storeTokens(response.data.accessToken, response.data.refreshToken);
//         }
//       } catch (error) {
//         console.error('Token refresh error:', error);
//       }
//     }
//   };
  
//   // Check every 5 minutes
//   refreshInterval = setInterval(checkAndRefresh, 300000);
  
//   // Return cleanup function
//   return () => {
//     if (refreshInterval) clearInterval(refreshInterval);
//   };
// };

// export { 
//   api, 
//   publicApi, 
//   storeTokens, 
//   clearTokens, 
//   getAccessToken, 
//   getRefreshToken, 
//   getUser,
//   setupTokenRefresh 
// };



// // ----------------------------------------
// // // src/services/authService.js
// // import axios from 'axios';
// // import {jwtDecode} from 'jwt-decode';

// // const API_URL = process.env.REACT_APP_API_URL;

// // // Store tokens in localStorage
// // const storeTokens = (accessToken, refreshToken) => {
// //   localStorage.setItem('accessToken', accessToken);
// //   localStorage.setItem('refreshToken', refreshToken);
// // };

// // const clearTokens = () => {
// //   localStorage.removeItem('accessToken');
// //   localStorage.removeItem('refreshToken');
// //   localStorage.removeItem('user');
// //   localStorage.removeItem('role');
// //   localStorage.removeItem('userId');
// // };

// // const getAccessToken = () => localStorage.getItem('accessToken');
// // const getRefreshToken = () => localStorage.getItem('refreshToken');

// // // Axios instance with interceptors
// // const api = axios.create({
// //   baseURL: API_URL,
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });
// // // Create a separate axios instance for public endpoints
// // const publicApi = axios.create({
// //   baseURL: API_URL,
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });

// // // Add this to your existing authService.js
// // const isPublicEndpoint = (url) => {
// //   const publicEndpoints = [
// //     '/photos/home',
// //     '/photos/categories',
// //     '/photos/sponsor',
// //     // '/photos/validate',
// //     '/photos/public',
// //     '/events/upcoming',
// //     '/auth/login',
// //     '/auth/register',
// //     '/events',
// //     '/categories'
// //   ];
  
// //   return publicEndpoints.some(endpoint => 
// //     url.includes(endpoint) || 
// //     url.endsWith(endpoint)
// //   );
// // };

// // // Request interceptor to add auth token
// // api.interceptors.request.use(
// //   (config) => {
// //     if (!isPublicEndpoint(config.url)) {
// //       const token = getAccessToken();
// //       if (token) {
// //         config.headers['Authorization'] = `Bearer ${token}`;
// //       }
// //     }
// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // // Response interceptor to handle token refresh
// // api.interceptors.response.use(
// //   (response) => response,
// //   async (error) => {
// //     const originalRequest = error.config;
    
// //     // If error is 401 and we haven't already retried
// //     if (error.response?.status === 401 && !originalRequest._retry) {
// //       originalRequest._retry = true;
      
// //       try {
// //         const refreshToken = getRefreshToken();
// //         if (!refreshToken) throw new Error('No refresh token');
        
// //         // Attempt to refresh tokens
// //         const response = await axios.post(`${API_URL}/auth/refresh-token`, {
// //           refreshToken
// //         });
        
// //         const { accessToken, refreshToken: newRefreshToken } = response.data;
// //         storeTokens(accessToken, newRefreshToken);
        
// //         // Retry original request with new token
// //         originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
// //         return api(originalRequest);
// //       } catch (refreshError) {
// //         // Refresh failed - clear tokens and redirect to login
// //         clearTokens();
// //         window.location.href = '/';
// //         return Promise.reject(refreshError);
// //       }
// //     }
    
// //     return Promise.reject(error);
// //   }
// // );
// // // Add to src/services/authService.js
// // const setupTokenRefresh = () => {
// //   // Check token every 5 minutes
// //   setInterval(async () => {
// //     const accessToken = getAccessToken();
// //     const refreshToken = getRefreshToken();
    
// //     if (accessToken && refreshToken) {
// //       try {
// //         // Verify if access token is expired or about to expire
// //         const decoded = jwtDecode(accessToken);
// //         if (decoded.exp * 1000 < Date.now() + 300000) { // 5 minutes before expiration
// //           const response = await axios.post(`${API_URL}/auth/refresh-token`, {
// //             refreshToken
// //           });
// //           storeTokens(response.data.accessToken, response.data.refreshToken);
// //         }
// //       } catch (error) {
// //         console.error('Token refresh error:', error);
// //       }
// //     }
// //   }, 300000); // 5 minutes
// // };

// // export { api, publicApi, storeTokens, clearTokens, getAccessToken, getRefreshToken, setupTokenRefresh };