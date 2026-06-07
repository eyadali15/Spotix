/**
 * Spotix — Washing Store (Zustand)
 */
import { create } from 'zustand';
import api from '../services/api';

const useWashingStore = create((set, get) => ({
  locations: [],
  selectedLocation: null,
  bookings: [],
  isLoading: false,
  error: null,

  fetchLocations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/washing');
      set({ locations: response.data.locations, isLoading: false });
      return response.data.locations;
    } catch (error) {
      set({ error: 'Failed to load washing locations', isLoading: false });
      return [];
    }
  },

  selectLocation: (loc) => set({ selectedLocation: loc }),
  clearSelected: () => set({ selectedLocation: null }),

  bookService: async (locationId, serviceId, bookingTime) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/washing/book', {
        locationId,
        serviceId,
        bookingTime: bookingTime.toISOString(),
      });
      set((state) => ({
        bookings: [response.data.booking, ...state.bookings],
        isLoading: false,
      }));
      return { success: true, booking: response.data.booking, service: response.data.service };
    } catch (error) {
      const message = error.response?.data?.error || 'Booking failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchMyBookings: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/washing/bookings/mine');
      set({ bookings: response.data.bookings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load bookings', isLoading: false });
    }
  },
}));

export default useWashingStore;
