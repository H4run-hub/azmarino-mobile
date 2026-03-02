import React, {createContext, useState, useContext} from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
};

// Initial mock notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'order',
    title: 'ትእዛዝ ተቐቢሉ! 🎉',
    body: 'ትእዛዝ #AZM104823 ብዓወት ቀሪቡ ኣሎ። ኣብ 3-5 መዓልታት ክበጽሓካ እዩ።',
    time: '2 ሰዓት ቅ.ሁ.',
    read: false,
    icon: '📦',
  },
  {
    id: 'n2',
    type: 'order',
    title: 'ትእዛዝ ብመገዲ ኣሎ 🚚',
    body: 'ትእዛዝ #AZM098712 ካብ ዓዲ ወጺኡ። ናይ ምስጋና ትሕዝቶ ብኢመይልካ ክስደደልካ እዩ።',
    time: '5 ሰዓት ቅ.ሁ.',
    read: false,
    icon: '🚚',
  },
  {
    id: 'n3',
    type: 'promo',
    title: 'Flash Sale — 60% ቅናሽ! ⚡',
    body: 'ሎሚ ጥራይ! ዝተመረጹ ፍርያት ክሳብ 60% ቅናሽ ኣሎ። ቅልጡፍ ምረጽ!',
    time: '1 ምዓልቲ ቅ.ሁ.',
    read: true,
    icon: '🔥',
  },
  {
    id: 'n4',
    type: 'promo',
    title: 'ሓድሽ ፍርያት ቀሪቡ ✨',
    body: 'ሓዲሽ ሰለስተ ምድብ ፍርያት ኣብ ኣዝማሪኖ ቀሪቡ ኣሎ። ኣጽናዕ!',
    time: '2 ምዓልቲ ቅ.ሁ.',
    read: true,
    icon: '🛍️',
  },
  {
    id: 'n5',
    type: 'system',
    title: 'እንቋዕ ደሓን መጻእካ! 👋',
    body: 'ናብ ኣዝማሪኖ እንቋዕ ደሓን መጻእካ። ካብ ሕጂ ምዝዛም ጀምር!',
    time: '1 ሰሙን ቅ.ሁ.',
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

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}>
      {children}
    </NotificationsContext.Provider>
  );
};
