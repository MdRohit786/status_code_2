import { useNotifications as useNotificationContext } from '../context/NotificationContext';

export default function useNotifications() {
  return useNotificationContext();
}
