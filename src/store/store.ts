import { create } from 'zustand';
import { User } from '../navigation/index';
import { usersService } from '../services/users';

interface Comment {
  id: number;
  userId: number;
  text: string;
  createdAt: Date;
}

interface UsersState {
  users: User[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean; // Day 7: Loading state for pagination
  hasMore: boolean;     // Day 7: Are there more items to load?
  page: number;         // Day 7: Current page for pagination
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;
  abortController: AbortController | null;
  userDetail: User | null;
  userDetailLoading: boolean;
  userDetailError: string | null;
  // Day 6: Mutations
  favorites: Set<number>; // User IDs đã favorite
  reactions: Map<number, 'like' | 'dislike'>; // User reactions
  comments: Comment[]; // List comments cho tất cả users
  isFavoriting: boolean;
  isLiking: boolean; // For like/dislike buttons
  isCommenting: boolean;
  fetchUsers: (signal?: AbortSignal) => Promise<void>;
  refreshUsers: (signal?: AbortSignal) => Promise<void>;
  loadMoreUsers: (signal?: AbortSignal) => Promise<void>; // Day 7: Load more users
  fetchUserById: (id: number, signal?: AbortSignal) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  cancelRequests: () => void;
  clearError: () => void;
  // Day 6: Mutation functions
  toggleFavorite: (userId: number) => Promise<void>;
  toggleReaction: (userId: number, type: 'like' | 'dislike') => Promise<void>;
  addComment: (userId: number, commentText: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  refreshing: false,
  loadingMore: false, // Day 7: Initial pagination state
  hasMore: true,     // Day 7: Assume more data initially
  page: 1,           // Day 7: Start from page 1
  error: null,
  pollingInterval: null,
  abortController: null,
  userDetail: null,
  userDetailLoading: false,
  userDetailError: null,
  // Day 6: Initial mutation states
  favorites: new Set<number>(),
  reactions: new Map<number, 'like' | 'dislike'>(),
  comments: [],
  isFavoriting: false,
  isLiking: false,
  isCommenting: false,

  fetchUsers: async (signal?: AbortSignal) => {
    set({ loading: true, error: null });
    try {
      const users = await usersService.getUsers(signal);
      set({ users, loading: false });
    } catch (error: any) {
      // Check if error is due to abortion
      if (
        error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled') ||
        error.name === 'CanceledError' ||
        error.name === 'AbortError' ||
        error.message?.includes('aborted')
      ) {
        console.log('🚫 Fetch users request was cancelled');
        set({ loading: false });
        return;
      }
      // Error is now handled by axios interceptors, so we get standardized error objects
      const errorMessage = error?.message || 'Failed to fetch users';
      console.error('Store Error:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  refreshUsers: async (signal?: AbortSignal) => {
    set({ refreshing: true, error: null });
    try {
      const users = await usersService.getUsers(signal);
      set({ users, refreshing: false });
    } catch (error: any) {
      // Check if error is due to abortion
      if (
        error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled') ||
        error.name === 'CanceledError' ||
        error.name === 'AbortError' ||
        error.message?.includes('aborted')
      ) {
        console.log('🚫 Refresh users request was cancelled');
        set({ refreshing: false });
        return;
      }
      // Error is now handled by axios interceptors, so we get standardized error objects
      const errorMessage = error?.message || 'Failed to refresh users';
      console.error('Refresh Error:', errorMessage);
      set({ error: errorMessage, refreshing: false });
    }
  },

  loadMoreUsers: async (signal?: AbortSignal) => {
    const { users, loadingMore, hasMore, page } = get();

    // Prevent loading more if already loading or no more data
    if (loadingMore || !hasMore) {
      console.log('🚫 Load more blocked: loadingMore=', loadingMore, 'hasMore=', hasMore);
      return;
    }

    console.log(`📄 Loading more users: page ${page + 1}`);
    set({ loadingMore: true });

    try {
      const response = await usersService.getUsersPaginated(page + 1, 10, signal);
      const newUsers = response.users;
      const hasMoreData = response.hasMore;

      console.log(`📄 Loaded ${newUsers.length} more users, hasMore: ${hasMoreData}`);

      set({
        users: [...users, ...newUsers],
        page: page + 1,
        hasMore: hasMoreData,
        loadingMore: false
      });
    } catch (error: any) {
      // Check if error is due to abortion
      if (
        error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled') ||
        error.name === 'CanceledError' ||
        error.name === 'AbortError' ||
        error.message?.includes('aborted')
      ) {
        console.log('🚫 Load more users request was cancelled');
        set({ loadingMore: false });
        return;
      }
      // Error is now handled by axios interceptors, so we get standardized error objects
      const errorMessage = error?.message || 'Failed to load more users';
      console.error('Load More Error:', errorMessage);
      set({ error: errorMessage, loadingMore: false });
    }
  },

  startPolling: () => {
    const { pollingInterval, abortController } = get();

    // Clear existing polling if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Cancel existing controller if any
    if (abortController) {
      abortController.abort();
    }

    // Create new controller for polling
    const controller = new AbortController();
    set({ abortController: controller });

    console.log('🔄 Starting polling every 10 seconds');

    const interval = setInterval(async () => {
      const currentController = get().abortController;
      if (currentController && !currentController.signal.aborted) {
        await get().refreshUsers(currentController.signal);
      }
    }, 10000); // 10 seconds

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval, abortController } = get();

    console.log('⏹️ Stopping polling');

    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }

    if (abortController) {
      abortController.abort();
      set({ abortController: null });
    }
  },

  fetchUserById: async (id: number, signal?: AbortSignal) => {
    set({ userDetailLoading: true, userDetailError: null });
    try {
      const user = await usersService.getUserById(id, signal);
      set({ userDetail: user, userDetailLoading: false });
    } catch (error: any) {
      // Check if error is due to abortion
      if (
        error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled') ||
        error.name === 'CanceledError' ||
        error.name === 'AbortError' ||
        error.message?.includes('aborted')
      ) {
        console.log('🚫 Fetch user detail request was cancelled');
        set({ userDetailLoading: false });
        return;
      }
      // Error is now handled by axios interceptors, so we get standardized error objects
      const errorMessage = error?.message || 'Failed to fetch user detail';
      console.error('User Detail Error:', errorMessage);
      set({ userDetailError: errorMessage, userDetailLoading: false });
    }
  },

  cancelRequests: () => {
    const { abortController } = get();
    if (abortController) {
      console.log('🚫 Cancelling all pending requests');
      abortController.abort();
      set({ abortController: null });
    }
  },

  clearError: () => set({ error: null }),

  // Day 6: Mutation functions
  toggleReaction: async (userId: number, type: 'like' | 'dislike') => {
    const { reactions, isLiking } = get();

    // Prevent double tap
    if (isLiking) {
      console.log('🛡️ Prevented double tap - already reacting');
      return;
    }

    const currentReaction = reactions.get(userId);
    const isSameReaction = currentReaction === type;

    console.log(`🚀 Starting ${type} toggle for user ${userId} (current: ${currentReaction || 'none'})`);
    set({ isLiking: true });

    // Optimistic UI: Update immediately
    const newReactions = new Map(reactions);

    if (isSameReaction) {
      // Remove reaction if same type
      newReactions.delete(userId);
      console.log(`✨ Optimistic: User ${userId} ${type} removed`);
    } else {
      // Set new reaction (replaces any existing)
      newReactions.set(userId, type);
      console.log(`✨ Optimistic: User ${userId} ${type} added`);
    }

    set({ reactions: newReactions });

    try {
      // Mock API call with 30% fail rate
      console.log(`📡 API call: POST /users/${userId}/reactions (${type})`);
      await usersService.toggleReaction(userId, type);

      console.log(`✅ API success: User ${userId} reaction ${type} confirmed`);
    } catch (error: any) {
      // Rollback on failure
      console.log(`❌ API failed: Rolling back ${type} for user ${userId}`, error.message);
      const rollbackReactions = new Map(reactions);

      if (isSameReaction) {
        // Add back the removed reaction
        rollbackReactions.set(userId, type);
        console.log(`🔄 Rolling back: User ${userId} ${type} added back`);
      } else {
        // Remove the added reaction and restore previous
        rollbackReactions.delete(userId);
        if (currentReaction) {
          rollbackReactions.set(userId, currentReaction);
          console.log(`🔄 Rolling back: User ${userId} restored to ${currentReaction}`);
        } else {
          console.log(`🔄 Rolling back: User ${userId} reaction removed`);
        }
      }

      set({ reactions: rollbackReactions });
    } finally {
      set({ isLiking: false });
      console.log(`🔒 Reaction buttons unlocked for user ${userId}`);
    }
  },

  toggleFavorite: async (userId: number) => {
    const { favorites, isFavoriting } = get();

    // Prevent double tap
    if (isFavoriting) {
      console.log('🛡️ Prevented double tap - already favoriting');
      return;
    }

    console.log(`🚀 Starting favorite toggle for user ${userId}`);
    set({ isFavoriting: true });

    // Optimistic UI: Update immediately
    const wasFavorited = favorites.has(userId);
    const newFavorites = new Set(favorites);

    if (wasFavorited) {
      newFavorites.delete(userId);
      console.log(`✨ Optimistic: User ${userId} unfavorited`);
    } else {
      newFavorites.add(userId);
      console.log(`✨ Optimistic: User ${userId} favorited`);
    }

    set({ favorites: newFavorites });

    try {
      // Mock API call with 30% fail rate
      console.log(`📡 API call: ${wasFavorited ? 'DELETE' : 'POST'} /users/${userId}/favorite`);
      await usersService.toggleFavorite(userId);

      console.log(`✅ API success: User ${userId} ${wasFavorited ? 'unfavorited' : 'favorited'}`);
    } catch (error: any) {
      // Rollback on failure
      console.log(`❌ API failed: Rolling back favorite for user ${userId}`, error.message);
      const rollbackFavorites = new Set(favorites);
      if (wasFavorited) {
        rollbackFavorites.add(userId); // Add back
        console.log(`🔄 Rolling back: User ${userId} marked as favorite again`);
      } else {
        rollbackFavorites.delete(userId); // Remove again
        console.log(`🔄 Rolling back: User ${userId} unmarked as favorite`);
      }
      set({ favorites: rollbackFavorites });
    } finally {
      set({ isFavoriting: false });
      console.log(`🔒 Button unlocked for user ${userId}`);
    }
  },

  addComment: async (userId: number, commentText: string) => {
    const { comments, isCommenting } = get();

    // Prevent double tap
    if (isCommenting) {
      console.log('🛡️ Prevented double tap - already commenting');
      return;
    }

    // Validation
    if (!commentText.trim()) {
      console.log('❌ Comment validation failed: empty text');
      return;
    }

    console.log(`📝 Comment validation passed: "${commentText}"`);
    console.log(`🚀 Starting comment submission for user ${userId}`);
    set({ isCommenting: true });

    // Optimistic UI: Add comment immediately
    const optimisticComment: Comment = {
      id: Date.now(), // Temporary ID
      userId,
      text: commentText,
      createdAt: new Date(),
    };

    const newComments = [...comments, optimisticComment];
    set({ comments: newComments });
    console.log(`✨ Optimistic: Comment added to UI for user ${userId}`);

    try {
      // Mock API call with 30% fail rate
      console.log(`📡 API call: POST /users/${userId}/comments`);
      await usersService.addComment(userId, commentText);

      console.log(`✅ API success: Comment posted for user ${userId}`);
    } catch (error: any) {
      // Rollback on failure
      console.log(`❌ API failed: Removing optimistic comment for user ${userId}`, error.message);
      const rollbackComments = comments.filter(c => c.id !== optimisticComment.id);
      set({ comments: rollbackComments });
      console.log(`🔄 Rolling back: Comment removed from UI for user ${userId}`);
    } finally {
      set({ isCommenting: false });
      console.log(`🔒 Comment button unlocked for user ${userId}`);
    }
  },
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
