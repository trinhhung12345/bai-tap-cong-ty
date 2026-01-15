# 🚀 React Native Learning Project

Dự án học tập React Native với Expo, xây dựng ứng dụng quản lý người dùng thông qua 3 ngày phát triển với các chủ đề: UI Components, Navigation, và API Integration.

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tech Stack](#-tech-stack)
- [Tính năng](#-tính-năng)
- [Cài đặt](#-cài-đặt)
- [Chạy dự án](#-chạy-dự-án)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API](#-api)
- [Development](#-development)
- [Tài liệu](#-tài-liệu)

## 🎯 Tổng quan

Dự án này là series bài học React Native theo từng ngày, mỗi ngày tập trung vào một khía cạnh khác nhau của mobile development:

### 📅 **Ngày 1**: UI Components + Layout
- Primitive UI components (View, Text, Image, Pressable)
- Flexbox layout system
- Component architecture (Card, Button, etc.)
- StyleSheet optimization

### 📅 **Ngày 2**: Navigation + TypeScript
- React Navigation v6 setup
- Stack Navigator + Bottom Tab Navigator
- Type-safe navigation params
- Nested navigation patterns

### 📅 **Ngày 3**: API Integration + State Management
- Axios HTTP client setup
- Zustand state management
- API error handling & retry
- Pull-to-refresh functionality

## 🛠️ Tech Stack

### **Core**
- **React Native 0.81.5** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript 5.9** - Type safety
- **React Navigation 7.x** - Navigation library

### **State & HTTP**
- **Zustand 4.5** - Lightweight state management
- **Axios 1.x** - HTTP client with interceptors

### **Development**
- **ESLint + Prettier** - Code quality
- **Babel** - JavaScript transpilation
- **Expo CLI** - Development tools

## ✨ Tính năng

### 🔧 **Core Features**
- ✅ User list với API integration
- ✅ User detail screen với comprehensive info
- ✅ Loading states với ActivityIndicator
- ✅ Error handling với retry functionality
- ✅ Pull-to-refresh support
- ✅ Empty state handling

### 🎨 **UI/UX**
- ✅ Responsive design với Flexbox
- ✅ Card-based user interface
- ✅ Loading skeletons
- ✅ Error messages với retry buttons
- ✅ Smooth animations và transitions

### 🔍 **Technical Features**
- ✅ Type-safe navigation
- ✅ Axios interceptors cho logging
- ✅ HTTP status code mapping
- ✅ Console error logging
- ✅ Service layer architecture

## 📦 Cài đặt

### Prerequisites
- Node.js 18+ và npm/yarn
- Android Studio (cho Androiemulator)
- Xcode (cho iOS simulator - md acOS only)

### Clone và Setup
```bash
# Clone repository
git clone <repository-url>
cd bai-tap-cong-ty

# Install dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..
```

## 🚀 Chạy dự án

### Development Server
```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

### Build Production
```bash
# Build for production
expo build:android
expo build:ios
```

## 📁 Cấu trúc dự án

```
bai-tap-cong-ty/
├── 📱 src/
│   ├── 🧩 components/          # Reusable UI components
│   │   ├── BackButton.tsx      # Navigation back button
│   │   ├── Button.tsx          # Custom button component
│   │   ├── Card.tsx            # Card wrapper component
│   │   ├── ErrorView.tsx       # Error display + retry
│   │   └── EmptyView.tsx       # Empty state component
│   ├── 🧭 navigation/          # Navigation configuration
│   │   └── index.tsx           # Navigators setup
│   ├── 📱 screens/             # Screen components
│   │   ├── Home.tsx            # Home screen
│   │   ├── List.tsx            # Users list screen
│   │   └── Detail.tsx          # User detail screen
│   ├── 🔧 services/            # API services
│   │   ├── api.ts              # Axios instance + interceptors
│   │   └── users.ts            # Users API functions
│   └── 🗂️ store/               # State management
│       └── store.ts            # Zustand stores
├── 📚 docs/                    # Documentation
│   ├── ngay-1.md               # Day 1: UI Components
│   ├── ngay-2.md               # Day 2: Navigation
│   └── ngay-3.md               # Day 3: API Integration
├── 🎨 assets/                  # Static assets
├── ⚙️ *.config.js              # Configuration files
└── 📄 package.json             # Dependencies & scripts
```

## 🌐 API

### **API Endpoint**
```
GET https://api.slingacademy.com/v1/sample-data/users
```

### **Response Format**
```json
{
  "success": true,
  "message": "Sample data for testing and learning purposes",
  "total_users": 1000,
  "offset": 0,
  "limit": 10,
  "users": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "profile_picture": "https://...",
      "job": "Developer",
      "gender": "male",
      "date_of_birth": "1990-01-01T00:00:00",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zipcode": "10001",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "phone": "+1-555-123-4567"
    }
  ]
}
```

### **HTTP Status Codes**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `408`: Request Timeout
- `429`: Too Many Requests
- `500`: Internal Server Error
- `502`: Bad Gateway
- `503`: Service Unavailable

## 💻 Development

### **Code Quality**
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

### **Testing**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### **Architecture Patterns**

#### **State Management**
```typescript
// Zustand store pattern
interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  // State & actions
}));
```

#### **API Service Layer**
```typescript
// Service pattern
export const usersService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data.users;
  },
};
```

#### **Error Handling**
```typescript
// Axios interceptor pattern
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = getErrorMessageFromStatus(status);
    return Promise.reject({ status, message });
  }
);
```

## 📚 Tài liệu

### **Learning Journey**
- **[Ngày 1](docs/ngay-1.md)**: UI Components + Layout - Học Flexbox, StyleSheet, và component architecture
- **[Ngày 2](docs/ngay-2.md)**: Navigation + TypeScript - React Navigation v6 và type-safe routing
- **[Ngày 3](docs/ngay-3.md)**: API Integration - Axios, Zustand, error handling, pull-to-refresh

### **Key Concepts**
- **React Native Basics**: Components, Props, State, Lifecycle
- **Navigation**: Stack & Tab navigators, params passing
- **State Management**: Local vs global state, Zustand patterns
- **API Integration**: HTTP clients, error handling, loading states
- **TypeScript**: Type safety, interfaces, generics

### **Best Practices**
- Component composition over inheritance
- Separation of concerns (UI, business logic, API)
- Error boundaries và graceful error handling
- Performance optimization với FlatList virtualization
- Type safety với TypeScript

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙋‍♂️ Support

Nếu có câu hỏi hoặc cần hỗ trợ:

- 📧 Email: [your-email@example.com]
- 💬 Issues: [GitHub Issues](https://github.com/username/repo/issues)
- 📖 Docs: Check `docs/` folder

---

**Happy Coding! 🎉**

*Built with ❤️ using React Native & Expo*
