import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL_OVERRIDE } from '../config/apiConfig';

const API_BASE_URL = API_BASE_URL_OVERRIDE || 'https://api.azmarino.online';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** User-friendly message for network/API errors (never show raw AxiosError to user). */
export const getApiErrorMessage = (error) => {
  if (!error) return null;
  const msg = error.response?.data?.message;
  if (msg && typeof msg === 'string') return msg;
  const code = error.code || '';
  const fullMessage = error.message || '';
  if (code === 'ECONNABORTED' || code === 'ERR_NETWORK' || fullMessage.includes('Network Error')) {
    return 'ሰርቨር ኣይተራኸበን። ኢንተርነት ርአ።';
  }
  if (error.response?.status === 401) return 'ኢመይል ወይ ፓስወርድ ጌጋ።';
  if (error.response?.status === 503) return 'ኣገልግሎት ኣይርከብን። ደሓር ፈትን።';
  if (error.response?.status >= 500) return 'ሰርቨር ኣርሒቑ ኣሎ። ደሓር ፈትን።';
  if (fullMessage.includes('AxiosError') || fullMessage.includes('request failed')) {
    return 'ሓንቲ ጌጋ ተጋጊማ። ደሓር ፈትን።';
  }
  return fullMessage || 'ሓንቲ ጌጋ ተጋጊማ።';
};

// ── Request interceptor: attach JWT token if available ─────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('azmarino_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 (token expired) ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('azmarino_token');
      await AsyncStorage.removeItem('azmarino_user');
    }
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────────────────────────────────
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Server health check failed:', error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    if (token) {
      await AsyncStorage.setItem('azmarino_token', token);
      await AsyncStorage.setItem('azmarino_user', JSON.stringify(user));
    }
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (name, email, phone, password) => {
  try {
    const response = await api.post('/api/auth/register', { name, email, phone, password });
    const { token, user } = response.data;
    if (token) {
      await AsyncStorage.setItem('azmarino_token', token);
      await AsyncStorage.setItem('azmarino_user', JSON.stringify(user));
    }
    return response.data;
  } catch (error) {
    console.error('Register failed:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyEmail = async (code) => {
  try {
    const response = await api.post('/api/auth/verify-email', { code });
    return response.data;
  } catch (error) {
    console.error('Email verification failed:', error.response?.data || error.message);
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const response = await api.post('/api/auth/resend-verification');
    return response.data;
  } catch (error) {
    console.error('Resend verification failed:', error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('azmarino_token');
  await AsyncStorage.removeItem('azmarino_user');
};

export const requestForgotPassword = async (email) => {
  try {
    const response = await api.post('/api/auth/forgot-password', { email: email.trim() });
    return response.data;
  } catch (error) {
    console.error('Forgot password failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get me failed:', error.response?.data || error.message);
    throw error;
  }
};

export const updateMe = async (updates) => {
  try {
    const response = await api.put('/api/auth/me', updates);
    if (response.data.user) {
      await AsyncStorage.setItem('azmarino_user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Update me failed:', error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/api/auth/change-password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    console.error('Change password failed:', error.response?.data || error.message);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ────────────────────────────────────────────────────────────────────────
export const getProducts = async (params = {}, retries = 1) => {
  try {
    const response = await api.get('/api/products', { params });
    return response.data;
  } catch (error) {
    if (retries > 0 && (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
      await new Promise(r => setTimeout(r, 800));
      return getProducts(params, retries - 1);
    }
    // One clear log: app will use fallback products (see HomeScreen)
    const code = error.code || '';
    const msg = error.message || '';
    const detail = error.response?.data?.message || error.response?.status || '';
    if (__DEV__) {
      console.warn(
        `[API] Get products failed. Using fallback. | code=${code} message=${msg} ${detail ? `response=${detail}` : ''}`
      );
    }
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get product failed:', error.response?.data || error.message);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────
// VISION (camera search) — uses backend proxy so API key stays server-side
// ────────────────────────────────────────────────────────────────────────
export const visionIdentify = async (base64Image, mimeType = 'image/jpeg') => {
  const response = await api.post('/api/vision/identify', { image: base64Image, mimeType });
  return response.data;
};

// ────────────────────────────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────────────────────────────
export const createPaymentIntent = async (items, customerEmail, shippingInfo) => {
  try {
    const response = await api.post('/api/stripe/payment-intent', {
      items,
      customerEmail,
      shippingInfo,
    });
    return response.data; // { success, clientSecret, paymentIntentId, amount }
  } catch (error) {
    console.error('Create payment intent failed:', error.response?.data || error.message);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Create order failed:', error.response?.data || error.message);
    throw error;
  }
};

export const trackOrder = async (orderNumber, email) => {
  try {
    const response = await api.get('/api/orders/track', {
      params: { orderNumber, email },
    });
    return response.data;
  } catch (error) {
    console.error('Track order failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getMyOrders = async () => {
  try {
    const response = await api.get('/api/orders/my');
    return response.data;
  } catch (error) {
    console.error('Get my orders failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrdersByEmail = async (email) => {
  try {
    const response = await api.get('/api/orders/by-email', { params: { email } });
    return response.data;
  } catch (error) {
    console.error('Get orders by email failed:', error.response?.data || error.message);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────
// REVIEWS
// ────────────────────────────────────────────────────────────────────────
export const getReviews = async (productId) => {
  try {
    const response = await api.get(`/api/reviews/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Get reviews failed:', error.response?.data || error.message);
    throw error;
  }
};

export const submitReview = async (productId, rating, comment) => {
  try {
    const response = await api.post(`/api/reviews/${productId}`, { rating, comment });
    return response.data;
  } catch (error) {
    console.error('Submit review failed:', error.response?.data || error.message);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────
export const getNotifications = async (type) => {
  try {
    const params = {};
    if (type && type !== 'all') params.type = type;
    const response = await api.get('/api/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Get notifications failed:', error.response?.data || error.message);
    throw error;
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  } catch (error) {
    return { success: false, unreadCount: 0 };
  }
};

export const markNotificationRead = async (id) => {
  try {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark read failed:', error.response?.data || error.message);
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Mark all read failed:', error.response?.data || error.message);
  }
};

export const deleteNotificationApi = async (id) => {
  try {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete notification failed:', error.response?.data || error.message);
  }
};

export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/api/notifications');
    return response.data;
  } catch (error) {
    console.error('Clear notifications failed:', error.response?.data || error.message);
  }
};

export default api;
