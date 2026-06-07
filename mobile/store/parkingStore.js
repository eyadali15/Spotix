/**
 * Spotix — Parking Store (Zustand)
 * Manages parking lots, reservations, and real-time updates
 */

import { create } from 'zustand';
import api from '../services/api';

const useParkingStore = create((set, get) => ({
  // State
  lots: [],
  selectedLot: null,
  reservations: [],
  ownerLots: [],
  ownerStats: {},
  isLoading: false,
  error: null,

  // Actions
  setSelectedLot: (lot) => set({ selectedLot: lot }),
  clearSelectedLot: () => set({ selectedLot: null }),
  clearError: () => set({ error: null }),

  /**
   * Fetch all parking lots (for map)
   */
  fetchLots: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/parking');
      set({ lots: response.data.lots, isLoading: false });
      return response.data.lots;
    } catch (error) {
      set({ error: 'Failed to load parking lots', isLoading: false });
      return [];
    }
  },

  /**
   * Fetch single lot details
   */
  fetchLotDetails: async (lotId) => {
    try {
      const response = await api.get(`/parking/${lotId}`);
      set({ selectedLot: response.data.lot });
      return response.data.lot;
    } catch (error) {
      return null;
    }
  },

  /**
   * Create a reservation
   */
  createReservation: async (lotId, startTime, endTime) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/reservation', { lotId, startTime: startTime?.toISOString(), endTime: endTime?.toISOString() });
      const reservation = response.data.reservation;

      // Update local state
      set((state) => ({
        reservations: [reservation, ...state.reservations],
        lots: state.lots.map((lot) =>
          lot.id === lotId
            ? { ...lot, availableSpots: lot.availableSpots - 1 }
            : lot
        ),
        isLoading: false,
      }));

      return { success: true, reservation };
    } catch (error) {
      const message = error.response?.data?.error || 'Reservation failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Fetch user's reservations
   */
  fetchReservations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/reservation/mine');
      set({ reservations: response.data.reservations, isLoading: false });
      return response.data.reservations;
    } catch (error) {
      set({ error: 'Failed to load reservations', isLoading: false });
      return [];
    }
  },

  /**
   * Cancel a reservation
   */
  cancelReservation: async (reservationId) => {
    try {
      await api.post(`/reservation/${reservationId}/cancel`);
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === reservationId ? { ...r, status: 'CANCELLED' } : r
        ),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Cancel failed' };
    }
  },

  // ==================== OWNER ACTIONS ====================

  /**
   * Fetch owner's parking lots
   */
  fetchOwnerLots: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/parking/owner/mine');
      set({ ownerLots: response.data.lots, isLoading: false });
      return response.data.lots;
    } catch (error) {
      set({ error: 'Failed to load your parkings', isLoading: false });
      return [];
    }
  },

  /**
   * Create a parking lot
   */
  createParkingLot: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/parking', data);
      set((state) => ({
        ownerLots: [response.data.lot, ...state.ownerLots],
        isLoading: false,
      }));
      return { success: true, lot: response.data.lot };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create parking';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  /**
   * Update a parking lot
   */
  updateParkingLot: async (lotId, data) => {
    try {
      const response = await api.put(`/parking/${lotId}`, data);
      set((state) => ({
        ownerLots: state.ownerLots.map((l) =>
          l.id === lotId ? response.data.lot : l
        ),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Update failed' };
    }
  },

  /**
   * Delete a parking lot
   */
  deleteParkingLot: async (lotId) => {
    try {
      await api.delete(`/parking/${lotId}`);
      set((state) => ({
        ownerLots: state.ownerLots.filter((l) => l.id !== lotId),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Delete failed' };
    }
  },

  /**
   * Validate a QR ticket (owner scanner)
   */
  validateTicket: async (qrToken) => {
    try {
      const response = await api.post('/reservation/validate', { qrToken });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Validation failed',
      };
    }
  },

  /**
   * Handle real-time parking update from socket
   */
  handleParkingUpdate: (data) => {
    set((state) => ({
      lots: state.lots.map((lot) =>
        lot.id === data.lotId
          ? { ...lot, availableSpots: data.availableSpots }
          : lot
      ),
      ownerLots: state.ownerLots.map((lot) =>
        lot.id === data.lotId
          ? { ...lot, availableSpots: data.availableSpots }
          : lot
      ),
      selectedLot:
        state.selectedLot?.id === data.lotId
          ? { ...state.selectedLot, availableSpots: data.availableSpots }
          : state.selectedLot,
    }));
  },
}));

export default useParkingStore;
