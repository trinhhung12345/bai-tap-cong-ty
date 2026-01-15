# Ngày 3 — Call API "đúng bài": loading/error/empty + refresh

## Tổng quan dự án
Dự án này triển khai API integration production-ready cho ứng dụng React Native, sử dụng axios instance với interceptors, service layer architecture, và Zustand state management. Ứng dụng fetch dữ liệu users từ API thật với đầy đủ xử lý loading, error, empty states, pull-to-refresh, và HTTP status code handling.

**Cấu trúc API & State**:
- **Axios Instance**: Centralized configuration với baseURL, timeout, request/response interceptors
- **Service Layer**: Tách biệt API logic thành dedicated service functions
- **State Management**: Zustand store quản lý users, loading, refreshing, error states
- **UI States**: Loading (ActivityIndicator), Error (ErrorView), Empty (EmptyView)
- **Error Handling**: Comprehensive HTTP status code mapping và network error handling
- **Pull-to-Refresh**: Native FlatList refresh functionality
- **Logging**: Request/response logging và error logging ra terminal

**Cơ chế hoạt động**:
- App khởi động → Axios instance init → List screen → useEffect gọi fetchUsers()
- Service layer: usersService.getUsers() → Axios instance với interceptors → API call
- Zustand store: Handle response/error → Update state (users/loading/refreshing/error)
- UI render theo state priority: loading → error → empty → success data
- Error logging: Detailed logging ra terminal cho debugging
- Pull-to-refresh: Manual refresh capability với visual feedback

## Mục tiêu
List call API thật (GET) + có loading/error/retry/empty + pull-to-refresh.

## Kiến thức phải nắm

### 1. Axios integration trong React Native
Axios là HTTP client mạnh mẽ cho JavaScript, được sử dụng rộng rãi trong React/React Native apps.

**Cài đặt và import**:
```bash
npm install axios
```
```typescript
import axios from 'axios';
```

**Basic GET request**:
```typescript
const response = await axios.get<ApiResponse>(
  'https://api.slingacademy.com/v1/sample-data/users'
);
```

**Response structure từ API**:
```typescript
interface ApiResponse {
  success: boolean;
  message: string;
  total_users: number;
  offset: number;
  limit: number;
  users: User[];
}
```

**Error handling**:
- Network errors: Connection timeout, no internet, DNS issues
- HTTP errors: 4xx (client errors), 5xx (server errors)
- API errors: success: false với error message

### 2. API state chuẩn UI
State management cho API calls cần handle 3 states chính:

**Loading State**:
```typescript
const [loading, setLoading] = useState(true);
// Hoặc với Zustand:
interface State {
  loading: boolean;
  // ...
}
```

**Error State**:
```typescript
const [error, setError] = useState<string | null>(null);
// Handle cả network errors và API errors
```

**Data State**:
```typescript
const [users, setUsers] = useState<User[]>([]);
```

**UI Rendering theo state priority**:
```typescript
if (loading) return <LoadingView />;
if (error) return <ErrorView message={error} onRetry={fetchData} />;
if (data.length === 0) return <EmptyView />;
return <DataView data={data} />;
```

### 3. ErrorView Component
Component hiển thị lỗi với nút retry, được sử dụng khi API call thất bại.

**Interface**:
```typescript
interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}
```

**Implementation** (`src/components/ErrorView.tsx`):
```typescript
export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color="#ff4444" />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Styles**: Center layout với icon, message, và retry button màu xanh.

### 4. EmptyView Component
Component hiển thị khi data array rỗng, kèm theo error logging.

**Interface**:
```typescript
interface EmptyViewProps {
  message?: string;
  error?: Error | string;
}
```

**Implementation** (`src/components/EmptyView.tsx`):
```typescript
export function EmptyView({ message = 'Không có dữ liệu', error }: EmptyViewProps) {
  useEffect(() => {
    if (error) {
      console.log('API Error:', error); // Log ra browser console
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
```

**Console Logging**: useEffect để log error ra console khi có error prop.

### 5. Zustand Store cho API State
Zustand là state management library lightweight, phù hợp cho API state.

**Store Interface**:
```typescript
interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  clearError: () => void;
}
```

**Implementation** (`src/store/store.ts`):
```typescript
export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<ApiResponse>(
        'https://api.slingacademy.com/v1/sample-data/users'
      );

      if (response.data.success) {
        set({ users: response.data.users, loading: false });
      } else {
        const errorMessage = response.data.message;
        console.error('API Error:', errorMessage); // Log ra terminal
        set({ error: errorMessage, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      console.error('API Error:', error); // Log ra terminal
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Key Points**:
- `set({ loading: true, error: null })`: Reset state trước khi fetch
- `console.error()`: Log errors ra terminal cho debugging
- Type-safe với TypeScript interfaces
- Async function với proper error handling

### 6. List Screen với API Integration
List screen sử dụng store và render theo state.

**Hook usage**:
```typescript
const { users, loading, error, fetchUsers } = useUsersStore();

useEffect(() => {
  fetchUsers(); // Fetch data khi component mount
}, [fetchUsers]);
```

**Conditional Rendering**:
```typescript
if (loading) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.loadingText}>Đang tải...</Text>
    </View>
  );
}

if (error) {
  return <ErrorView message={error} onRetry={fetchUsers} />;
}

if (users.length === 0) {
  return <EmptyView message="Không có người dùng nào" error={error || undefined} />;
}

return (
  <FlatList
    data={users}
    renderItem={renderItem}
    // ...
  />
);
```

**User Card Rendering**:
```typescript
const renderItem = ({ item }: { item: User }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => navigation.navigate('Detail', { user: item })}
  >
    <Image source={{ uri: item.profile_picture }} style={styles.cardImage} />
    <Text style={styles.cardTitle}>{`${item.first_name} ${item.last_name}`}</Text>
    <Text style={styles.cardSubtitle}>{item.email}</Text>
    <Text style={styles.cardJob}>{item.job}</Text>
  </TouchableOpacity>
);
```

### 7. Axios Instance với Interceptors
Production-ready axios configuration với centralized setup.

**Axios Instance Creation** (`src/services/api.ts`):
```typescript
import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const api: AxiosInstance = axios.create({
    baseURL: 'https://api.slingacademy.com/v1/sample-data',
    timeout: 10000, // 10 seconds
    headers: {
        'Content-Type': 'application/json',
    },
});
```

**Request Interceptor**:
```typescript
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
        // Add auth token here for future authentication
        const token = null; // TODO: Get from AsyncStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);
```

**Response Interceptor với Error Handling**:
```typescript
api.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            const message = getErrorMessageFromStatus(status);
            console.error(`❌ HTTP Error ${status}:`, message);
            return Promise.reject({ status, message, originalError: error });
        } else if (error.request) {
            console.error('❌ Network Error:', error.message);
            return Promise.reject({
                status: 0,
                message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
                originalError: error,
            });
        } else {
            console.error('❌ Unknown Error:', error.message);
            return Promise.reject({
                status: -1,
                message: 'Đã xảy ra lỗi không xác định.',
                originalError: error,
            });
        }
    }
);
```

### 8. Service Layer Architecture
Tách biệt API logic thành dedicated service functions.

**Service Structure** (`src/services/users.ts`):
```typescript
import api from './api';
import { User } from '../navigation/index';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    users?: T[];
}

export const usersService = {
    getUsers: async (): Promise<User[]> => {
        const response = await api.get<ApiResponse<User>>('/users');
        if (response.data.success && response.data.users) {
            return response.data.users;
        }
        throw new Error(response.data.message || 'Failed to fetch users');
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await api.get<ApiResponse<User>>(`/users/${id}`);
        if (response.data.success && response.data.users?.[0]) {
            return response.data.users[0];
        }
        throw new Error('User not found');
    },
};
```

**Benefits**:
- Centralized API endpoints
- Consistent error handling
- Easy to test và mock
- Type-safe với TypeScript

### 9. Pull-to-Refresh Implementation
Native FlatList refresh functionality với visual feedback.

**Store với Refresh State**:
```typescript
interface UsersState {
  users: User[];
  loading: boolean;
  refreshing: boolean;  // ← New state for pull-to-refresh
  error: string | null;
  fetchUsers: () => Promise<void>;
  refreshUsers: () => Promise<void>;  // ← New function
}
```

**Refresh Function**:
```typescript
refreshUsers: async () => {
  set({ refreshing: true, error: null });
  try {
    const users = await usersService.getUsers();
    set({ users, refreshing: false });
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to refresh users';
    console.error('Refresh Error:', errorMessage);
    set({ error: errorMessage, refreshing: false });
  }
},
```

**FlatList với RefreshControl**:
```typescript
<FlatList
  data={users}
  renderItem={renderItem}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refreshUsers}
      colors={['#2196F3']}
      tintColor="#2196F3"
    />
  }
/>
```

### 10. HTTP Status Code Handling
Comprehensive error mapping cho user-friendly messages.

**Status Code Mapping**:
```typescript
function getErrorMessageFromStatus(status: number): string {
  switch (status) {
    case 400: return 'Dữ liệu gửi không hợp lệ. Vui lòng kiểm tra lại.';
    case 401: return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403: return 'Bạn không có quyền truy cập tài nguyên này.';
    case 404: return 'Không tìm thấy tài nguyên yêu cầu.';
    case 408: return 'Yêu cầu đã timeout. Vui lòng thử lại.';
    case 429: return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 500: return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
    case 502: return 'Máy chủ đang bảo trì. Vui lòng thử lại sau.';
    case 503: return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    default: return `Lỗi không xác định (${status}). Vui lòng thử lại.`;
  }
}
```

**Error Types**:
- **Network Errors** (status: 0): Connection issues
- **HTTP Errors** (status: 4xx/5xx): Server response errors
- **API Errors** (status: custom): Application-specific errors

### 11. Detail Screen với User Data
Detail screen nhận user data qua navigation params và hiển thị chi tiết.

**Type-safe Navigation**:
```typescript
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

const route = useRoute<DetailScreenRouteProp>();
const params = route.params;
const user = 'user' in params ? params.user : null;
```

**User Information Display**:
- Profile picture với Image component
- Personal info: name, email, job
- Detailed sections: personal info, address, contact, location
- ScrollView cho content dài

## Từ khóa search (đúng thứ tự)
- axios React Native integration Zustand store
- React Native API state management loading error empty
- axios error handling network timeout React Native
- React Native FlatList pull to refresh onRefresh refreshing
- console.log debugging React Native terminal
- (VN) axios interceptor react native, error handling mobile app

## Checklist code
- [x] Cài axios dependency
- [x] Tạo User type interface matching API response
- [x] Tạo users store với Zustand (users/loading/refreshing/error/fetchUsers/refreshUsers)
- [x] Implement fetchUsers với service layer + error handling
- [x] Thêm console.error logging cho debugging (terminal + browser)
- [x] Tạo ErrorView component (message + retry button)
- [x] Tạo EmptyView component (empty state + error logging)
- [x] Tạo axios instance với baseURL, timeout, request/response interceptors
- [x] Implement service layer (src/services/users.ts) với typed API functions
- [x] Thêm pull-to-refresh cho FlatList với RefreshControl
- [x] Xử lý HTTP status codes chi tiết (400, 401, 403, 404, 408, 429, 500, 502, 503)
- [x] Update List.tsx: fetch data + loading/error/empty UI + user cards + pull-to-refresh
- [x] Update Detail.tsx: display user details từ navigation params
- [x] Update navigation types cho User data
- [x] **Đã implement đầy đủ**: Production-ready API architecture

## Bài tập
- [x] Làm ErrorView component (message + nút Retry)
- [x] Làm EmptyView component (khi data rỗng)
- [x] Làm axios instance với baseURL, timeout, interceptors
- [x] Làm service layer tách biệt API calls
- [x] Thêm pull-to-refresh cho FlatList
- [x] Xử lý HTTP status codes chi tiết (401, 403, 404, 500)

## Code Explanation Chi Tiết

### Axios Integration trong Store
```typescript
fetchUsers: async () => {
  set({ loading: true, error: null }); // 1. Reset state
  try {
    const response = await axios.get<ApiResponse>( // 2. API call
      'https://api.slingacademy.com/v1/sample-data/users'
    );

    if (response.data.success) { // 3. Handle success response
      set({ users: response.data.users, loading: false });
    } else { // 4. Handle API error (success: false)
      console.error('API Error:', response.data.message);
      set({ error: response.data.message, loading: false });
    }
  } catch (error) { // 5. Handle network/HTTP errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    console.error('API Error:', error);
    set({ error: errorMessage, loading: false });
  }
}
```

### Error Logging Strategy
- **Store level**: `console.error()` log ra terminal khi develop
- **Component level**: EmptyView log ra browser console khi debug UI
- **Dual logging**: Cả terminal và browser để debug comprehensive

### State Flow
```
User opens List → useEffect → fetchUsers() → loading: true
↓
API Response → success: true → users = data, loading: false
↓
API Response → success: false → error = message, loading: false
↓
Network Error → error = error.message, loading: false
↓
UI renders based on state priority: loading → error → empty → data
```

### TypeScript Integration
```typescript
// API Response type
interface ApiResponse {
  success: boolean;
  message: string;
  users: User[];
}

// User type matching API
type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string;
  job: string;
  // ... other fields
}
```

**Benefits**: IntelliSense, compile-time error checking, type-safe navigation params.

### React Native Specific Considerations
- **ActivityIndicator**: Built-in loading spinner component
- **FlatList**: Virtualization cho performance với large datasets
- **Image**: Automatic caching, support cho remote URLs
- **TouchableOpacity**: Press feedback cho mobile UX
- **StyleSheet**: Performance optimization cho styles

## Kết luận
🎉 **Implementation hoàn chỉnh và production-ready!**

Dự án đã successfully implement tất cả core requirements và advanced features:

### ✅ **Đã hoàn thành:**
- **Production-ready API Architecture**: Axios instance + interceptors + service layer
- **Complete State Management**: Zustand với loading/refreshing/error states
- **Comprehensive Error Handling**: HTTP status codes, network errors, user-friendly messages
- **Advanced UI Features**: Pull-to-refresh, loading states, error retry, empty states
- **Developer Experience**: TypeScript, logging, clean architecture

### 🏗️ **Architecture Highlights:**
- **Separation of Concerns**: UI (components) ↔ Business Logic (services) ↔ State (store)
- **Type Safety**: Full TypeScript coverage với interfaces và generics
- **Error Resilience**: Graceful error handling với user feedback
- **Performance**: FlatList virtualization, efficient state updates
- **Maintainability**: Modular code structure, easy to extend

### 🚀 **Production Features:**
- Centralized API configuration với baseURL và timeout
- Request/Response interceptors cho logging và authentication
- Service layer cho API abstraction và testing
- Pull-to-refresh với native RefreshControl
- HTTP status code mapping cho UX tốt
- Console logging cho debugging

### 📈 **Scalability:**
Code architecture sẵn sàng cho:
- Authentication với token management
- Caching và offline support
- Pagination và infinite scroll
- Multiple API endpoints
- Real-time data updates

**Dự án ngày 3 đã hoàn thành 100% với production-quality code!** 🎯
