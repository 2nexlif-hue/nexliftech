import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import './NotificationBell.css';

export default function NotificationBell({ notificationsHook, mobile = false }) {
  const { notifications, unreadCount, dismissNotification, isInitialized } = notificationsHook;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isInitialized) return null;

  return (
    <div className={`notification-bell-container ${mobile ? 'mobile' : ''}`} ref={dropdownRef}>
      <button 
        className="bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="count-badge">{unreadCount} New</span>}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`notification-item ${notif.dismissed ? 'read' : 'unread'}`}>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.date).toLocaleDateString()}
                    </span>
                  </div>
                  {!notif.dismissed && (
                    <button 
                      className="dismiss-btn"
                      onClick={() => dismissNotification(notif.id)}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
