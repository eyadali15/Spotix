/**
 * Spotix — Review Store (Zustand)
 * Optimistic UI updates for reviews
 */
import { create } from 'zustand';
import api from '../services/api';

const useReviewStore = create((set, get) => ({
  reviews: {},  // keyed by `${locationType}_${locationId}`
  isLoading: false,

  getKey: (locationType, locationId) => `${locationType}_${locationId}`,

  fetchReviews: async (locationType, locationId) => {
    const key = `${locationType}_${locationId}`;
    set({ isLoading: true });
    try {
      const response = await api.get(`/reviews/${locationType}/${locationId}`);
      set((state) => ({
        reviews: { ...state.reviews, [key]: response.data.reviews },
        isLoading: false,
      }));
      return response.data.reviews;
    } catch (error) {
      set({ isLoading: false });
      return [];
    }
  },

  addReview: async (locationType, locationId, rating, comment, userName) => {
    const key = `${locationType}_${locationId}`;
    // Optimistic update
    const optimistic = {
      id: `temp_${Date.now()}`,
      rating,
      comment,
      user: { name: userName },
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reviews: {
        ...state.reviews,
        [key]: [optimistic, ...(state.reviews[key] || [])],
      },
    }));

    try {
      const response = await api.post('/reviews', { locationType, locationId, rating, comment });
      // Replace optimistic with real
      set((state) => ({
        reviews: {
          ...state.reviews,
          [key]: (state.reviews[key] || []).map((r) =>
            r.id === optimistic.id ? response.data.review : r
          ),
        },
      }));
      return { success: true, review: response.data.review };
    } catch (error) {
      // Rollback
      set((state) => ({
        reviews: {
          ...state.reviews,
          [key]: (state.reviews[key] || []).filter((r) => r.id !== optimistic.id),
        },
      }));
      return { success: false, error: error.response?.data?.error || 'Failed to add review' };
    }
  },

  getReviews: (locationType, locationId) => {
    const key = `${locationType}_${locationId}`;
    return get().reviews[key] || [];
  },
}));

export default useReviewStore;
