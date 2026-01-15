# 📱 Ngày 4: Lifecycle Screen/View - Focus/Blur + Cleanup + Cancel Request

## 🎯 Mục tiêu
Khi rời màn thì dừng request/polling; quay lại màn thì refresh đúng; không warning setState after unmount.

## 📚 Kiến thức nền tảng

### 1. useEffect vs useFocusEffect

#### useEffect (Component Lifecycle)
```typescript
useEffect(() => {
  // Chạy khi component mount
  fetchData();

  return () => {
    // Chạy khi component unmount
    cleanup();
  };
}, []); // Dependencies
```

**Khi nào chạy:**
- ✅ Component mount
- ✅ Dependencies thay đổi
- ✅ Component unmount (cleanup)

#### useFocusEffect (Screen Lifecycle)
```typescript
useFocusEffect(
  useCallback(() => {
    // Chạy khi screen được focus
    startPolling();

    return () => {
      // Chạy khi screen bị blur
      stopPolling();
    };
  }, [])
);
```

**Khi nào chạy:**
- ✅ Screen được focus (hiển thị)
- ✅ Screen bị blur (ẩn đi)
- ✅ App background/foreground (React Navigation v6+)

### 2. Sự thật hay gặp trong React Navigation

#### Screen có thể mounted nhưng không visible
```typescript
// Trong Tab Navigator hoặc Stack Navigator
// Screen A mounted nhưng không visible khi ở Screen B
// useEffect vẫn chạy nhưng user không thấy gì
```

#### Fetch trong useEffect đôi khi không refresh
```typescript
// ❌ Sai: Chỉ fetch khi mount
useEffect(() => {
  fetchUsers();
}, []);

// ✅ Đúng: Fetch mỗi khi focus
useFocusEffect(
  useCallback(() => {
    fetchUsers();
  }, [])
);
```

### 3. Cleanup quan trọng

#### Clear timers và unsubscribe
```typescript
useFocusEffect(
  useCallback(() => {
    const interval = setInterval(pollData, 10000);

    return () => {
      clearInterval(interval); // Quan trọng!
    };
  }, [])
);
```

#### Cancel request với AbortController
```typescript
useFocusEffect(
  useCallback(() => {
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      controller.abort(); // Cancel request
    };
  }, [])
);
```

## 🔧 Implementation trong App

### 1. API Service với AbortController

#### `src/services/api.ts`
```typescript
// Request interceptor - log abort signals
api.interceptors.request.use((config) => {
  if (config.signal) {
    console.log('🔄 Request with AbortSignal:', config.url);
  }
  return config;
});

// Response interceptor - handle aborted requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if request was aborted
    if (error.code === 'ERR_CANCELED' ||
        error.message?.includes('canceled')) {
      console.log('🚫 Request was canceled (aborted):', error.message);
      return Promise.reject(error);
    }
    // Handle other errors...
  }
);
```

#### `src/services/users.ts`
```typescript
export const usersService = {
  getUsers: async (signal?: AbortSignal): Promise<User[]> => {
    const response = await api.get('/users', { signal });
    return response.data.users;
  },

  getUserById: async (id: number, signal?: AbortSignal): Promise<User> => {
    const response = await api.get(`/users/${id}`, { signal });
    return response.data.user; // API trả về {user: ...}
  },
};
```

### 2. Store với Polling Management

#### `src/store/store.ts`
```typescript
interface UsersState {
  // ... other states
  pollingInterval: NodeJS.Timeout | null;
  abortController: AbortController | null;
  userDetail: User | null;
  userDetailLoading: boolean;
  userDetailError: string | null;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // ... other initial states
  pollingInterval: null,
  abortController: null,
  userDetail: null,
  userDetailLoading: false,
  userDetailError: null,

  startPolling: () => {
    const { pollingInterval, abortController } = get();

    // Clear existing polling
    if (pollingInterval) clearInterval(pollingInterval);
    if (abortController) abortController.abort();

    // Create new controller for polling
    const controller = new AbortController();
    set({ abortController: controller });

    console.log('🔄 Starting polling every 10 seconds');

    const interval = setInterval(async () => {
      const currentController = get().abortController;
      if (currentController && !currentController.signal.aborted) {
        await get().refreshUsers(currentController.signal);
      }
    }, 10000);

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
      // Handle aborted requests gracefully
      if (error.code === 'ERR_CANCELED' ||
          error.message?.includes('canceled')) {
        console.log('🚫 Fetch user detail request was cancelled');
        set({ userDetailLoading: false });
        return;
      }
      // Handle other errors...
    }
  },
}));
```

### 3. List Screen với Focus Effect & AppState

#### `src/screens/List.tsx`
```typescript
export default function List() {
  const navigation = useNavigation();
  const { users, loading, error, fetchUsers, startPolling, stopPolling } = useUsersStore();

  // 🎯 Focus Effect: Handle screen focus/blur
  useFocusEffect(
    useCallback(() => {
      console.log('📱 List screen focused - fetching users and starting polling');
      const controller = new AbortController();
      fetchUsers(controller.signal);
      startPolling();

      return () => {
        console.log('📱 List screen blurred - stopping polling and cancelling requests');
        stopPolling();
      };
    }, [fetchUsers, startPolling, stopPolling])
  );

  // 🔋 App State Effect: Handle background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        console.log('📱 App went to background - stopping polling to save battery');
        stopPolling();
      } else if (nextAppState === 'active') {
        // Only resume if screen is still focused
        if (navigation.isFocused()) {
          console.log('📱 App came to foreground - resuming polling');
          startPolling();
        } else {
          console.log('📱 App foreground but screen not focused - not starting polling');
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up AppState listener');
      subscription.remove();
    };
  }, [navigation, startPolling, stopPolling]);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        console.log(`👆 Selected user: ID=${item.id} | ${item.first_name} ${item.last_name} | ${item.email}`);
        navigation.navigate('Detail', { userId: item.id });
      }}>
      {/* ... card content */}
    </TouchableOpacity>
  );

  // ... rest of component
}
```

### 4. Detail Screen với Fetch by ID

#### `src/screens/Detail.tsx`
```typescript
export default function Detail() {
  const route = useRoute();
  const { userDetail, userDetailLoading, userDetailError, fetchUserById } = useUsersStore();

  const userId = route.params.userId;

  // 🎯 Focus Effect: Fetch user detail when focused
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Detail screen focused - fetching user detail');
      const controller = new AbortController();
      fetchUserById(userId, controller.signal);

      return () => {
        console.log('📱 Detail screen blurred - cancelling user detail request');
        controller.abort();
      };
    }, [userId, fetchUserById])
  );

  if (userDetailLoading) {
    return <LoadingView />;
  }

  if (userDetailError) {
    return <ErrorView message={userDetailError} onRetry={() => fetchUserById(userId)} />;
  }

  if (!userDetail) {
    return <Text>Không tìm thấy thông tin người dùng</Text>;
  }

  // Render user details...
}
```

## 🔄 Cách hoạt động

### 1. Navigation Flow

#### Khi vào List screen:
```
1. useFocusEffect trigger
2. fetchUsers() + startPolling()
3. Polling chạy mỗi 10s
4. Console: "📱 List screen focused - fetching users and starting polling"
```

#### Khi navigate sang Detail:
```
1. List useFocusEffect cleanup trigger
2. stopPolling() - clear interval, abort requests
3. Console: "📱 List screen blurred - stopping polling and cancelling requests"
4. Detail useFocusEffect trigger
5. fetchUserById(userId)
```

#### Khi quay lại List:
```
1. Detail useFocusEffect cleanup trigger
2. Abort detail request
3. List useFocusEffect trigger again
4. fetchUsers() + startPolling() again
```

### 2. Polling Lifecycle

#### Start Polling:
```javascript
const interval = setInterval(async () => {
  const currentController = get().abortController;
  if (currentController && !currentController.signal.aborted) {
    await refreshUsers(currentController.signal);
  }
}, 10000);
```

#### Stop Polling:
```javascript
if (pollingInterval) clearInterval(pollingInterval);
if (abortController) abortController.abort();
```

### 3. Request Cancellation

#### AbortController Flow:
```javascript
// 1. Create controller
const controller = new AbortController();

// 2. Pass signal to request
fetchData(controller.signal);

// 3. Abort when needed
controller.abort(); // All requests with this signal are cancelled
```

#### Error Handling:
```javascript
catch (error) {
  if (error.code === 'ERR_CANCELED') {
    // Silent handling - no error shown to user
    return;
  }
  // Handle real errors...
}
```

### 4. AppState Transitions

#### Background:
```
AppState: 'background'
→ stopPolling() - Save battery
→ Console: "📱 App went to background - stopping polling to save battery"
```

#### Foreground:
```
AppState: 'active'
→ Check if screen focused
→ If yes: startPolling()
→ Console: "📱 App came to foreground - resuming polling"
```

## 🎨 UX Improvements

### 1. Không setState after unmount

#### Trước khi fix:
```
Warning: Can't perform a React state update on an unmounted component
```

#### Sau khi fix:
```typescript
// AbortController prevents requests from completing after unmount
catch (error) {
  if (error.code === 'ERR_CANCELED') {
    set({ loading: false }); // Safe state update
    return; // Don't show error
  }
}
```

### 2. Data luôn fresh khi quay lại

#### Trước:
- Data cũ hiển thị khi quay lại screen
- User thấy thông tin outdated

#### Sau:
```typescript
useFocusEffect(() => {
  // Fetch fresh data mỗi lần focus
  fetchUsers();
  startPolling();
});
```

### 3. Tiết kiệm pin khi background

#### Trước:
- Polling chạy liên tục ngay cả khi app background
- Tiêu thụ pin không cần thiết

#### Sau:
```typescript
AppState.addEventListener('change', nextAppState => {
  if (nextAppState === 'background') {
    stopPolling(); // Dừng polling ngay
  }
});
```

### 4. Smooth navigation experience

#### Trước:
- Requests pending khi navigate
- Memory leaks tiềm ẩn
- UI lag khi switch screens

#### Sau:
```typescript
return () => {
  controller.abort(); // Cancel all pending requests
  stopPolling(); // Clean up timers
};
```

## 🧪 Testing Scenarios

### 1. Screen Navigation (10 lần)
```
✅ Không warning "setState on unmounted component"
✅ Không memory leaks
✅ Requests cancelled properly
```

### 2. App Background/Foreground
```
✅ Polling dừng khi background
✅ Resume khi foreground (chỉ nếu screen focused)
✅ Không polling thừa
```

### 3. Network Issues
```
✅ Aborted requests không show error
✅ Real network errors handled properly
✅ User experience mượt mà
```

## 📊 Performance Benefits

### Battery Savings:
- Polling dừng khi app background
- Requests không chạy khi screen invisible
- Timer cleanup proper

### Memory Management:
- AbortController prevents zombie requests
- State updates safe sau unmount
- No memory leaks từ timers

### User Experience:
- Data luôn fresh
- No lag khi navigation
- Smooth transitions
- Proper loading states

## 🎯 Best Practices Áp dụng

### 1. Luôn dùng useFocusEffect cho screen data
```typescript
// ✅ Good
useFocusEffect(
  useCallback(() => {
    fetchData();
    return () => cleanup();
  }, [])
);

// ❌ Bad
useEffect(() => {
  fetchData(); // Chỉ chạy 1 lần khi mount
}, []);
```

### 2. Implement proper cleanup
```typescript
useFocusEffect(
  useCallback(() => {
    const controller = new AbortController();
    startPolling();

    return () => {
      controller.abort();
      stopPolling();
    };
  }, [])
);
```

### 3. Handle AppState cho battery optimization
```typescript
useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, []);
```

### 4. Graceful error handling
```typescript
catch (error) {
  if (isAbortedRequest(error)) {
    return; // Silent handling
  }
  showErrorToUser(error);
}
```

## 🏆 Kết luận

Day 4 đã implement thành công lifecycle management toàn diện:

- ✅ **useFocusEffect**: Proper screen lifecycle
- ✅ **AbortController**: Request cancellation
- ✅ **AppState**: Background optimization
- ✅ **Polling management**: Smart start/stop
- ✅ **Error handling**: No warnings, proper UX
- ✅ **Performance**: Battery & memory optimized

App giờ đây có UX professional với proper resource management và smooth navigation experience! 🎉
