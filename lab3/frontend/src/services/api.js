import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const airIndexService = {
  /**
   * Calculate air quality index
   */
  calculate: async (data) => {
    const response = await api.post('/airindex/calc', data);
    return response.data;
  },

  /**
   * Generate synthetic data
   */
  generateData: async (params = {}) => {
    const response = await api.get('/airindex/generate', { params });
    return response.data;
  },

  /**
   * Get all records
   */
  getRecords: async (params = {}) => {
    const response = await api.get('/airindex', { params });
    return response.data;
  },

  /**
   * Get statistics
   */
  getStatistics: async (params = {}) => {
    const response = await api.get('/airindex/stats', { params });
    return response.data;
  }
};

export default api;
