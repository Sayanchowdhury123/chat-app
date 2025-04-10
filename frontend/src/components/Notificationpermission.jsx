import { requestForToken } from '../services/messanging';

export const NotificationPermission = () => {
  const enableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await requestForToken();
      // Send token to your backend
      await fetch('/api/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
    }
  };

  return (
    <button onClick={enableNotifications}>
      Enable Push Notifications
    </button>
  );
};