import { createContext, useContext, useReducer, useEffect } from 'react';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now() + Math.random(),
          timestamp: new Date(),
          ...action.payload
        }]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
};

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    settings: {
      enableBrowserNotifications: false,
      enableSoundAlerts: true,
      newDemandAlerts: true,
      urgentDemandAlerts: true,
      hotspotAlerts: true
    }
  });

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: { enableBrowserNotifications: permission === 'granted' }
        });
      });
    }
  }, []);

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Browser notification
    if (state.settings.enableBrowserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type
      });
    }

    // Sound alert
    if (state.settings.enableSoundAlerts && notification.priority === 'high') {
      const audio = new Audio('/notification-sound.mp3');
      audio.catch(() => {}); // Ignore if sound file doesn't exist
    }

    // Auto remove after delay
    if (notification.autoRemove !== false) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markAsRead = (id) => {
    dispatch({ type: 'MARK_READ', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const value = {
    notifications: state.notifications,
    settings: state.settings,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    unreadCount: state.notifications.filter(n => !n.read).length
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
