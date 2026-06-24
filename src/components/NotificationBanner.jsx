import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './NotificationBanner.css';

export default function NotificationBanner({ activeBanner, dismissNotification }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Small delay to allow CSS transition to work after mount
    if (activeBanner) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [activeBanner]);

  if (!activeBanner && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    // Wait for animation to finish before updating state
    setTimeout(() => {
      dismissNotification(activeBanner.id);
      setIsClosing(false);
    }, 300); // Matches CSS transition duration
  };

  return (
    <div className={`notification-banner ${isVisible ? 'visible' : ''}`}>
      <div className="container banner-content">
        <div className="banner-text">
          <span className="badge">New</span>
          <strong>{activeBanner.title}</strong> — {activeBanner.message}
        </div>
        
        <div className="banner-actions">
          <a href="#contact" className="banner-link">Claim Offer</a>
          
          <div className="banner-dismiss">
            {/* The "Don't show again" behavior is handled by dismissNotification 
                which saves to localStorage in the hook */}
            <button 
              className="close-btn" 
              onClick={handleClose}
              aria-label="Close notification"
              title="Don't show again"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
