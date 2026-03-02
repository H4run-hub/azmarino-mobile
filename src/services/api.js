import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Always use production backend — works on physical devices and emulators
const API_BASE_URL = 'https://api.azmarino.online';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const logoutUser = async () => {
  await AsyncStorage.removeItem('azmarino_token');
  await AsyncStorage.removeItem('azmarino_user');
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
export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/api/products', { params });
    return response.data;
  } catch (error) {
    console.error('Get products failed:', error.response?.data || error.message);
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

export default api;
