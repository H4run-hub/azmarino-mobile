import React, {createContext, useState, useContext, useCallback, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getNotifications as fetchNotificationsApi,
  getUnreadCount as fetchUnreadCountApi,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationApi,
  clearAllNotifications,
} from '../services/api';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
};

export const NotificationsProvider = ({children}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const getUnreadCount = () => notifications.filter(n => !n.read).length;

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setNotifications([]);
        return;
      }
      const data = await fetchNotificationsApi();
      if (data?.success && data.notifications) {
        setNotifications(
          data.notifications.map(n => ({
            id: n._id,
            type: n.type || 'system',
            title: n.title,
            titleTi: n.titleTi || '',
            body: n.body,
            bodyTi: n.bodyTi || '',
            icon: n.icon || '🔔',
            read: n.read,
            data: n.data || {},
            createdAt: n.createdAt,
          })),
        );
      }
    } catch (err) {
      // Silent fail — don't block app
      if (__DEV__) console.warn('Fetch notifications failed:', err.message);
    }
  }, []);

  // Poll every 60 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? {...n, read: true} : n)),
    );
    markNotificationRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
    markAllNotificationsRead();
  }, []);

  const deleteNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotificationApi(id);
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    clearAllNotifications();
  }, []);

  const addNotification = useCallback((notification) => {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setNotifications(prev => [{...notification, id, read: false, createdAt: new Date().toISOString()}, ...prev]);
  }, []);

  // Re-fetch when user logs in/out
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
        refresh,
        fetchNotifications,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
};
