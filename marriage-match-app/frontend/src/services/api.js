import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  deactivateAccount: () => api.delete('/auth/account'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  blockUser: (userId) => api.post(`/users/block/${userId}`),
  unblockUser: (userId) => api.delete(`/users/block/${userId}`),
  reportUser: (userId, reason) => api.post(`/users/report/${userId}`, { reason }),
  getBlockedUsers: () => api.get('/users/blocked'),
};

// Profile API
export const profileAPI = {
  getMyProfile: () => api.get('/profiles/me'),
  updateMyProfile: (profileData) => api.put('/profiles/me', profileData),
  getProfile: (profileId) => api.get(`/profiles/${profileId}`),
  addPhoto: (photoData) => api.post('/profiles/photos', photoData),
  removePhoto: (photoId) => api.delete(`/profiles/photos/${photoId}`),
  setMainPhoto: (photoId) => api.put(`/profiles/photos/${photoId}/main`),
  getProfileViews: () => api.get('/profiles/views/me'),
};

// Match API
export const matchAPI = {
  discover: (params) => api.get('/matches/discover', { params }),
  performAction: (profileId, action) => api.post(`/matches/${profileId}/action`, { action }),
  getMutualMatches: (params) => api.get('/matches/mutual', { params }),
  getLikes: () => api.get('/matches/likes'),
};

// Message API
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (matchId, params) => api.get(`/messages/${matchId}`, { params }),
  sendMessage: (matchId, messageData) => api.post(`/messages/${matchId}`, messageData),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

export default api;