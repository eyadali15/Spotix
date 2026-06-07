/**
 * Spotix — Auth Store (Zustand)
 * Manages user authentication state, tokens, and language
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  language: 'en',
  selectedRole: 'CLIENT',

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setRole: (role) => set({ selectedRole: role }),

  /**
   * Initialize from stored session
   */
  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('spotix_token');
      const userJSON = await AsyncStorage.getItem('spotix_user');
      const language = await AsyncStorage.getItem('spotix_language') || 'en';

      if (token && userJSON) {
        const user = JSON.parse(userJSON);
        set({ token, user, isAuthenticated: true, language });
      } else {
        set({ language });
      }
    } catch (error) {
      console.log('Session restore failed:', error);
    }
  },

  /**
   * Sign up a new user
   */
  signup: async ({ name, email, phone, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        phone,
        password,
        role,
        language: get().language,
      });

      const { user, token } = response.data;

      await AsyncStorage.setItem('spotix_token', token);
      await AsyncStorage.setItem('spotix_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Log in — accepts email or phone + password
   */
  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const isPhone = identifier.startsWith('+') || /^\d+$/.test(identifier);
      const body = isPhone ? { phone: identifier, password } : { email: identifier, password };
      const response = await api.post('/auth/login', body);
      const { user, token } = response.data;

      await AsyncStorage.setItem('spotix_token', token);
      await AsyncStorage.setItem('spotix_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Verify OTP
   */
  verifyOtp: async (code) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/verify-otp', { code });
      const updatedUser = { ...get().user, verified: true };
      await AsyncStorage.setItem('spotix_user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Verification failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Resend OTP
   */
  resendOtp: async () => {
    try {
      await api.post('/auth/resend-otp');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to resend' };
    }
  },

  /**
   * Update language
   */
  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem('spotix_language', language);
    try {
      if (get().isAuthenticated) {
        await api.put('/auth/language', { language });
      }
    } catch (e) {
      // Non-critical
    }
  },

  /**
   * Log out
   */
  logout: async () => {
    await AsyncStorage.removeItem('spotix_token');
    await AsyncStorage.removeItem('spotix_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));

export default useAuthStore;
