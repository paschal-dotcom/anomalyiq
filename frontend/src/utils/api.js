// src/utils/api.js
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://api.anomalyiq.com');

const api = axios.create({ baseURL: BASE, timeout: 300000 });

export const uploadDataset = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const startTraining  = (config) => api.post('/api/train', config);
export const getProgress    = (dtype)  => api.get(`/api/progress/${dtype}`);
export const getResults     = (dtype)  => api.get(`/api/results/${dtype}`);
export const getModels      = ()       => api.get('/api/models');
export const scoreTransaction = (req)  => api.post('/api/score', req);
export const getHealth      = ()       => api.get('/api/health');

export const exportCSV = (dtype, flaggedOnly = false) => {
  const url = `${BASE}/api/export/${dtype}?flagged_only=${flaggedOnly}`;
  window.open(url, '_blank');
};
