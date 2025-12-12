import axios from 'axios'; // Імпортуємо axios для HTTP-запитів
// Базовий URL API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({ // Створюємо екземпляр axios з базовим URL та таймаутом
  baseURL: API_BASE_URL,
  timeout: 10000,
}); 

export const apiService = {
  // Отримати всі станції
  getStations: async (params = {}) => {
    try {
      const response = await api.get('/stations', { params }); 
      return response.data; 
    } catch (error) {
      console.error('Error fetching stations:', error); 
      throw error;
    }
  },

  // Створити станцію
  createStation: async (payload) => {
    try {
      const response = await api.post('/stations', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  },

  // Оновити станцію
  updateStation: async (stationId, payload) => {
    try {
      const response = await api.put(`/stations/${stationId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  },

  // Видалити (деактивувати) станцію
  deleteStation: async (stationId) => {
    try {
      const response = await api.delete(`/stations/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  },

  // Отримати останні вимірювання
  getLatestMeasurements: async () => {
    try {
      const response = await api.get('/measurements/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching measurements:', error);
      throw error;
    }
  },

  // Отримати всі вимірювання
  getMeasurements: async (params = {}) => {
    try {
      const response = await api.get('/measurements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all measurements:', error);
      throw error;
    }
  },

  // Створити вимірювання
  createMeasurement: async (payload) => {
    try {
      const response = await api.post('/measurements', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating measurement:', error);
      throw error;
    }
  },

  // Оновити вимірювання
  updateMeasurement: async (measurementId, payload) => {
    try {
      const response = await api.put(`/measurements/${measurementId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating measurement:', error);
      throw error;
    }
  },

  // Видалити вимірювання
  deleteMeasurement: async (measurementId) => {
    try {
      const response = await api.delete(`/measurements/${measurementId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw error;
    }
  },

  // Синхронізація з SaveEcoBot
  syncSaveEcoBot: async () => {
    try {
      const response = await api.get('/saveecobot/sync');
      return response.data;
    } catch (error) {
      console.error('Error syncing SaveEcoBot:', error);
      throw error;
    }
  },

  // Перевірка здоров'я системи
  getHealth: async () => {
    try {
      // call /health on the same host/port as API_BASE_URL
      const base = API_BASE_URL.replace(/\/api$/, '');
      const response = await axios.get(`${base}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
};

export default apiService;
// Коментарі до коду:
// Імпортуємо axios для HTTP-запитів.
// Встановлюємо базовий URL API з змінної оточення або використовуємо localhost за замовчуванням.
// Створюємо екземпляр axios з базовим URL та таймаутом.
// Експортуємо об'єкт apiService з методами для взаємодії з API:
// - getStations: отримує список станцій моніторингу.
// - getLatestMeasurements: отримує останні вимірювання.
// - getMeasurements: отримує всі вимірювання з можливістю передачі параметрів.
// - syncSaveEcoBot: виконує синхронізацію даних з SaveEcoBot.
// - getHealth: перевіряє стан здоров'я системи.
// Кожен метод обробляє помилки та виводить їх у консоль.