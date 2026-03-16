import React, {createContext, useState, useContext} from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
};

// Initial mock notifications — use translation keys so language switch works
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'order',
    titleKey: 'notifOrderReceivedTitle',
    bodyKey: 'notifOrderReceivedBody',
    timeAgo: {value: 2, unit: 'hours'},
    read: false,
    icon: '📦',
  },
  {
    id: 'n2',
    type: 'order',
    titleKey: 'notifOrderShippedTitle',
    bodyKey: 'notifOrderShippedBody',
    timeAgo: {value: 5, unit: 'hours'},
    read: false,
    icon: '🚚',
  },
  {
    id: 'n3',
    type: 'promo',
    titleKey: 'notifBigSaleTitle',
    bodyKey: 'notifBigSaleBody',
    timeAgo: {value: 1, unit: 'days'},
    read: true,
    icon: '🔥',
  },
  {
    id: 'n4',
    type: 'promo',
    titleKey: 'notifNewProductsTitle',
    bodyKey: 'notifNewProductsBody',
    timeAgo: {value: 2, unit: 'days'},
    read: true,
    icon: '🛍️',
  },
  {
    id: 'n5',
    type: 'system',
    titleKey: 'notifWelcomeTitle',
    bodyKey: 'notifWelcomeBody',
    timeAgo: {value: 1, unit: 'week'},
    read: true,
    icon: '🎊',
  },
];

export const NotificationsProvider = ({children}) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const getUnreadCount = () => notifications.filter(n => !n.read).length;

  const markAsRead = id => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? {...n, read: true} : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const deleteNotification = id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => setNotifications([]);

  const addNotification = (notification) => {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNotifications(prev => [{ ...notification, id, time: timeStr, read: false }, ...prev]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
};
