import { useState, useEffect } from 'react';

const NOTIFICATIONS_STORAGE_KEY = 'nexliftech_notifications_state';

// Initial dummy notifications. In a real app, you might fetch this from an API.
const INITIAL_NOTIFICATIONS = [
  {
    id: 'launch-promo-2026',
    title: 'Welcome to NexLifTech!',
    message: 'We are live! Get a free performance audit with any new project.',
    type: 'promo',
    isBanner: true, // Should show as a banner at the top
    date: new Date().toISOString(),
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Merge initial with stored (to pick up new ones, but keep dismissed state of old ones)
        const merged = INITIAL_NOTIFICATIONS.map(initNotif => {
          const stored = parsedData.find(n => n.id === initNotif.id);
          return stored ? { ...initNotif, dismissed: stored.dismissed } : { ...initNotif, dismissed: false };
        });
        setNotifications(merged);
      } catch (e) {
        console.error('Failed to parse notifications from local storage', e);
        setNotifications(INITIAL_NOTIFICATIONS.map(n => ({...n, dismissed: false})));
      }
    } else {
      setNotifications(INITIAL_NOTIFICATIONS.map(n => ({...n, dismissed: false})));
    }
    
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever notifications change (specifically 'dismissed' state)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(
        notifications.map(n => ({ id: n.id, dismissed: n.dismissed }))
      ));
    }
  }, [notifications, isInitialized]);

  const dismissNotification = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  };

  const activeBanner = notifications.find(n => n.isBanner && !n.dismissed);
  const unreadCount = notifications.filter(n => !n.dismissed).length;

  return {
    notifications,
    activeBanner,
    unreadCount,
    dismissNotification,
    isInitialized
  };
}
