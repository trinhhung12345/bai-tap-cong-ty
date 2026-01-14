import { create } from 'zustand';
import axios from 'axios';
import { User } from '../navigation/index';

// API Response type
interface ApiResponse {
  success: boolean;
  message: string;
  total_users: number;
  offset: number;
  limit: number;
  users: User[];
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  clearError: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<ApiResponse>(
        'https://api.slingacademy.com/v1/sample-data/users',
        // { timeout: 5000 },
      );
      if (response.data.success) {
        set({ users: response.data.users, loading: false });
      } else {
        const errorMessage = response.data.message;
        console.error('API Error:', errorMessage);
        set({ error: errorMessage, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      console.error('API Error:', error);
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Legacy bear store
export interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

export const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
