/**
 * Spotix — API Service
 * Axios instance with JWT auth interceptor
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For physical devices, use your computer's LAN IP
// For Android emulator, use 10.0.2.2
// For iOS simulator, use localhost
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // Android emulator
    if (__DEV__) {
      return 'http://192.168.1.110:3001/api';
    }
    return 'http://10.0.2.2:3001/api';
  }
  // iOS — physical device needs LAN IP, simulator can use localhost
  return 'http://192.168.1.110:3001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('spotix_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Token retrieval error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear session
      await AsyncStorage.removeItem('spotix_token');
      await AsyncStorage.removeItem('spotix_user');
      // The app will detect this and redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
