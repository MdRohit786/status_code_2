import { useState } from 'react';
import useNotifications from '../hooks/useNotifications';

export default function NotificationDemo() {
  const { addNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  const sampleNotifications = [
    {
      type: 'urgent',
      title: 'Urgent: Medicine Needed',
      message: 'Blood pressure medication required urgently in sector 5',
      priority: 'high',
      location: 'Sector 5, Block A'
    },
    {
      type: 'info',
      title: 'New Demand Posted',
      message: 'Fresh vegetables demand in your delivery area',
      priority: 'medium',
      location: 'Downtown Market'
    },
    {
      type: 'success',
      title: 'Delivery Completed',
      message: 'Your vegetable delivery was successful!',
      priority: 'low'
    },
    {
      type: 'warning',
      title: 'Demand Hotspot Alert',
      message: '8 milk demands detected in residential area',
      priority: 'medium',
      location: 'Green Valley'
    }
  ];

  const triggerTestNotification = (notification) => {
    addNotification(notification);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Show notification demo"
      >
        🔔
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-xl border p-4 w-72 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Notification Demo</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        {sampleNotifications.map((notification, index) => (
          <button
            key={index}
            onClick={() => triggerTestNotification(notification)}
            className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
          >
            <div className="font-medium">{notification.title}</div>
            <div className="text-gray-600 truncate">{notification.message}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
