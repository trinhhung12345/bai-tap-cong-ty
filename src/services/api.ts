import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: 'https://api.slingacademy.com/v1/sample-data',
  //   timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);

    // Add authorization header if token exists (for future auth)
    const token = null; // TODO: Get from AsyncStorage or context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log if request has signal (for cancellation tracking)
    if (config.signal) {
      console.log('🔄 Request with AbortSignal:', config.url);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Check if request was aborted (canceled intentionally)
    if (
      error.code === 'ERR_CANCELED' ||
      error.message?.includes('canceled') ||
      error.name === 'CanceledError'
    ) {
      // Re-throw aborted requests without wrapping as network errors
      console.log('🚫 Request was canceled (aborted):', error.message);
      return Promise.reject(error);
    }

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = getErrorMessageFromStatus(status);

      console.error(`❌ HTTP Error ${status}:`, message);

      // Return a standardized error object
      return Promise.reject({
        status,
        message,
        originalError: error,
      });
    } else if (error.request) {
      // Network error (no response received)
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        status: 0,
        message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        originalError: error,
      });
    } else {
      // Other errors
      console.error('❌ Unknown Error:', error.message);
      return Promise.reject({
        status: -1,
        message: 'Đã xảy ra lỗi không xác định.',
        originalError: error,
      });
    }
  }
);

// Helper function to get user-friendly error messages from HTTP status codes
function getErrorMessageFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Dữ liệu gửi không hợp lệ. Vui lòng kiểm tra lại.';
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền truy cập tài nguyên này.';
    case 404:
      return 'Không tìm thấy tài nguyên yêu cầu.';
    case 408:
      return 'Yêu cầu đã timeout. Vui lòng thử lại.';
    case 429:
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    case 500:
      return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
    case 502:
      return 'Máy chủ đang bảo trì. Vui lòng thử lại sau.';
    case 503:
      return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
    default:
      return `Lỗi không xác định (${status}). Vui lòng thử lại.`;
  }
}

export default api;
