import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('taskflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data)
};

export const tasksAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => API.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => API.delete(`/tasks/${id}`),
  restore: (id) => API.patch(`/tasks/${id}/restore`),
  permanentDelete: (id) => API.delete(`/tasks/${id}/permanent`),
  getTrash: () => API.get('/tasks/trash'),
  clearTrash: () => API.delete('/tasks/trash/all'),
  addComment: (id, text) => API.post(`/tasks/${id}/comment`, { text })
};

export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  addMember: (id, data) => API.post(`/projects/${id}/members`, data),
  delete: (id) => API.delete(`/projects/${id}`)
};

export const teamAPI = {
  getAll: () => API.get('/team'),
  getOne: (id) => API.get(`/team/${id}`),
  update: (id, data) => API.put(`/team/${id}`, data),
  delete: (id) => API.delete(`/team/${id}`)
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
  getNotifications: () => API.get('/dashboard/notifications')
};

export default API;
