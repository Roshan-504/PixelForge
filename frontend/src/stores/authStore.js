import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false, // Changed initial state to false
  error: null,
  isAuthenticated: false,

  // Clear errors
  clearError: () => set({ error: null }),

  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      
      get().setAuthToken(response.data.token);
      
      // Fetch user data
      const userResponse = await axiosInstance.get('/api/auth/me');
      set({ 
        user: userResponse.data.data.user,
        isAuthenticated: true,
        error: null 
      });
      
      toast.success('Logged in successfully!');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      set({ error: errorMsg, isAuthenticated: false });
      toast.error(errorMsg);
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout user
  logout: () => {
    set({ user: null, isAuthenticated: false });
    get().setAuthToken(null);
    toast.success('Logged out successfully!');
  },

  // Load user on app start
  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    
    set({ isLoading: true });
    try {
      get().setAuthToken(token);
      const response = await axiosInstance.get('/api/auth/me');
      set({ 
        user: response.data.data.user,
        isAuthenticated: true 
      });
    } catch (error) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  // Check if user has role
  hasRole: (role) => {
    return get().user?.role === role;
  }
}));

export default useAuthStore;