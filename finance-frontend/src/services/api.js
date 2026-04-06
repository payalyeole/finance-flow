import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const cache = new Map();
const CACHE_TIME = 30000; // 30 seconds

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 sec
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Cache helper - GET requests cache 
async function cachedGet(url, params = {}) {
  const key = url + JSON.stringify(params);
  const cached = cache.get(key);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return cached.data;
  }

  const res = await api.get(url, { params });
  cache.set(key, { data: res, time: Date.now() });
  return res;
}

export function clearCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// Dashboard - cached
export const dashboardAPI = {
  getSummary: (recentLimit = 10, trendMonths = 6) =>
    cachedGet('/dashboard/summary', { recentLimit, trendMonths }),
};

// Transactions
export const transactionAPI = {
  getAll: (params) => cachedGet('/transactions', params),
  getById: (id) => cachedGet(`/transactions/${id}`),
  create: async (data) => {
    const res = await api.post('/transactions', data);
    clearCache('/transactions');
    clearCache('/dashboard');
    return res;
  },
  update: async (id, data) => {
    const res = await api.put(`/transactions/${id}`, data);
    clearCache('/transactions');
    clearCache('/dashboard');
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    clearCache('/transactions');
    clearCache('/dashboard');
    return res;
  },
};

// Users
export const userAPI = {
  getAll: () => cachedGet('/users'),
  getById: (id) => cachedGet(`/users/${id}`),
  create: async (data) => {
    const res = await api.post('/users', data);
    clearCache('/users');
    return res;
  },
  update: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    clearCache('/users');
    return res;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle-status`);
    clearCache('/users');
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/users/${id}`);
    clearCache('/users');
    return res;
  },
};

export default api;