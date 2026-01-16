import api from './api';
import { User } from '../navigation/index';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  total_users?: number;
  offset?: number;
  limit?: number;
  users?: T[];
  user?: T; // For individual user responses
  [key: string]: any;
}

// Pagination response type
export interface PaginatedResponse<T> {
  users: T[];
  hasMore: boolean;
  total?: number;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  originalError?: any;
}

// Users service functions
export const usersService = {
  /**
   * Fetch all users
   */
  getUsers: async (signal?: AbortSignal): Promise<User[]> => {
    try {
      const response = await api.get<ApiResponse<User>>('/users', { signal });

      if (response.data.success && response.data.users) {
        return response.data.users;
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      // Re-throw with our standardized error format
      throw error;
    }
  },

  /**
   * Fetch users with pagination (Day 7: Load more functionality)
   */
  getUsersPaginated: async (page: number = 1, limit: number = 10, signal?: AbortSignal): Promise<PaginatedResponse<User>> => {
    try {
      // For demo purposes, we'll simulate pagination by slicing the full dataset
      // In real API, this would be: /users?page=${page}&limit=${limit}
      const response = await api.get<ApiResponse<User>>('/users', {
        params: { page, limit },
        signal
      });

      if (response.data.success && response.data.users) {
        const users = response.data.users;
        const totalUsers = response.data.total_users || users.length;

        // Calculate pagination logic
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);
        const hasMore = endIndex < totalUsers;

        console.log(`📄 Pagination: page ${page}, limit ${limit}, total ${totalUsers}, returned ${paginatedUsers.length}, hasMore: ${hasMore}`);

        return {
          users: paginatedUsers,
          hasMore,
          total: totalUsers
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch user by ID
   */
  getUserById: async (id: number, signal?: AbortSignal): Promise<User> => {
    try {
      const response = await api.get<ApiResponse<User>>(`/users/${id}`, { signal });

      if (response.data.success && response.data.user) {
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'User not found');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search users by query
   */
  searchUsers: async (query: string): Promise<User[]> => {
    try {
      const response = await api.get<ApiResponse<User>>('/users', {
        params: { search: query },
      });

      if (response.data.success && response.data.users) {
        return response.data.users;
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new user (placeholder for future implementation)
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.post<ApiResponse<User>>('/users', userData);

      if (response.data.success && response.data.users && response.data.users.length > 0) {
        return response.data.users[0];
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user (placeholder for future implementation)
   */
  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);

      if (response.data.success && response.data.users && response.data.users.length > 0) {
        return response.data.users[0];
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete user (placeholder for future implementation)
   */
  deleteUser: async (id: number): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<null>>(`/users/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle favorite status for a user (Day 6: Mock API with 30% fail rate)
   */
  toggleFavorite: async (userId: number): Promise<{ success: boolean }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 30% chance of failure for testing rollback
      if (Math.random() < 0.3) {
        console.log('🎲 Random failure triggered (30% chance)');
        throw new Error('Network error - please try again');
      }

      // Mock successful response
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle reaction (like/dislike) for a user (Day 6: Mock API with 30% fail rate)
   */
  toggleReaction: async (userId: number, type: 'like' | 'dislike'): Promise<{ success: boolean }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // 30% chance of failure for testing rollback
      if (Math.random() < 0.3) {
        console.log('🎲 Random failure triggered (30% chance)');
        throw new Error(`Failed to ${type} - network error`);
      }

      // Mock successful response
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add comment for a user (Day 6: Mock API with 30% fail rate)
   */
  addComment: async (userId: number, commentText: string): Promise<{ success: boolean }> => {
    try {
      // Basic validation
      if (!commentText.trim()) {
        throw new Error('Comment cannot be empty');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // 30% chance of failure for testing rollback
      if (Math.random() < 0.3) {
        console.log('🎲 Random failure triggered (30% chance)');
        throw new Error('Failed to post comment - network error');
      }

      // Mock successful response
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};

// Export default
export default usersService;
