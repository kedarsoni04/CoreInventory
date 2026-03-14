import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ci_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ci_token');
      localStorage.removeItem('ci_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  requestResetOTP: (data) => api.post('/auth/request-reset-otp', data),
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const productsAPI = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const receiptsAPI = {
  list: (params) => api.get('/receipts', { params }),
  get: (id) => api.get(`/receipts/${id}`),
  create: (data) => api.post('/receipts', data),
  update: (id, data) => api.put(`/receipts/${id}`, data),
  delete: (id) => api.delete(`/receipts/${id}`),
  validate: (id) => api.post(`/receipts/${id}/validate`),
  addItem: (id, data) => api.post(`/receipts/${id}/items`, data),
  updateItem: (id, itemId, data) => api.put(`/receipts/${id}/items/${itemId}`, data),
  deleteItem: (id, itemId) => api.delete(`/receipts/${id}/items/${itemId}`),
};

export const deliveriesAPI = {
  list: (params) => api.get('/deliveries', { params }),
  get: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: (id) => api.delete(`/deliveries/${id}`),
  validate: (id) => api.post(`/deliveries/${id}/validate`),
  addItem: (id, data) => api.post(`/deliveries/${id}/items`, data),
  updateItem: (id, itemId, data) => api.put(`/deliveries/${id}/items/${itemId}`, data),
  deleteItem: (id, itemId) => api.delete(`/deliveries/${id}/items/${itemId}`),
};

export const transfersAPI = {
  list: () => api.get('/transfers'),
  get: (id) => api.get(`/transfers/${id}`),
  create: (data) => api.post('/transfers', data),
  validate: (id) => api.post(`/transfers/${id}/validate`),
};

export const adjustmentsAPI = {
  list: () => api.get('/adjustments'),
  create: (data) => api.post('/adjustments', data),
  validate: (id) => api.post(`/adjustments/${id}/validate`),
};

export const warehousesAPI = {
  list: () => api.get('/warehouses'),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
};

export const locationsAPI = {
  list: (params) => api.get('/locations', { params }),
  create: (data) => api.post('/locations', data),
};

export const ledgerAPI = {
  list: (params) => api.get('/ledger', { params }),
};

export default api;
