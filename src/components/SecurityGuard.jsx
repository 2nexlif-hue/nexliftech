import { useState, useEffect } from 'react';
import { ShieldAlert, Lock, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './SecurityGuard.css';

export default function SecurityGuard() {
  const { currentUser } = useAuth();
  const [warningMessage, setWarningMessage] = useState('');
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // If Admin is logged in, bypass all security restrictions so admin can inspect & debug freely!
  const isAdmin = Boolean(currentUser);

  // Show security warning toast
  const triggerWarning = (msg) => {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage('');
    }, 3500);
  };

  useEffect(() => {
    if (isAdmin) {
      console.log(
        '%c🔓 ADMIN SESSION ACTIVE',
        'color: #00ff99; font-size: 16px; font-weight: 800; font-family: monospace;'
      );
      console.log(
        '%cSecurity restrictions and DevTools inspection blockers are bypassed for logged-in Admin.',
        'color: #9494b8; font-size: 12px; font-family: monospace;'
      );
      return;
    }

    // 1. Console warning header
    console.log(
      '%c🛑 SECURITY WARNING!',
      'color: #ff0055; font-size: 32px; font-weight: 800; font-family: monospace;'
    );
    console.log(
      '%cSource code, components, and assets are protected under Next LIfe Technologies Security Policy. Inspection and reproduction are strictly prohibited.',
      'color: #06eeff; font-size: 14px; font-family: monospace;'
    );

    // 2. Keyboard shortcut blocker
    const handleKeyDown = (e) => {
      const targetTag = e.target.tagName;
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target.isContentEditable;

      // Block F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerWarning('F12 DevTools shortcut is disabled by Next LIfe Technologies security policy.');
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        triggerWarning('DevTools inspection shortcut is disabled by Next LIfe Technologies security policy.');
        return false;
      }

      // Block Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerWarning('View Page Source is disabled by Next LIfe Technologies security policy.');
        return false;
      }

      // Block Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        if (!isInput) {
          e.preventDefault();
          e.stopPropagation();
          triggerWarning('Page saving is disabled by Next LIfe Technologies security policy.');
          return false;
        }
      }

      // Block Ctrl+P (Print Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        triggerWarning('Page printing & PDF export are disabled.');
        return false;
      }
    };

    // 3. Right-Click (Context Menu) Blocker
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerWarning('Right-click context menu is disabled to protect Next LIfe Technologies content.');
      return false;
    };

    // 4. Text Copy Blocker outside inputs
    const handleCopy = (e) => {
      const targetTag = e.target.tagName;
      if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA' && !e.target.isContentEditable) {
        e.preventDefault();
        triggerWarning('Copying Next LIfe Technologies site content is disabled.');
        return false;
      }
    };

    // 5. DevTools Detection via Window Threshold
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        setIsDevToolsOpen(true);
      } else {
        setIsDevToolsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    window.addEventListener('resize', checkDevTools);

    const devToolsInterval = setInterval(checkDevTools, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(devToolsInterval);
    };
  }, [isAdmin]);

  if (isAdmin) {
    return null; // Don't render security warnings or overlays for logged-in admin!
  }

  return (
    <>
      {/* Toast Warning */}
      {warningMessage && (
        <div className="security-toast-container">
          <div className="security-toast">
            <ShieldAlert size={20} className="security-toast-icon" />
            <span className="security-toast-text">{warningMessage}</span>
            <button className="security-toast-close" onClick={() => setWarningMessage('')}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* DevTools Fullscreen Warning Overlay */}
      {isDevToolsOpen && (
        <div className="security-fullscreen-overlay">
          <div className="security-modal glass-panel">
            <div className="security-modal-badge">
              <Lock size={14} /> SECURITY SHIELD ACTIVE
            </div>
            <div className="security-modal-icon">
              <AlertTriangle size={44} />
            </div>
            <h2>Developer Tools Access Detected</h2>
            <p>
              Source code inspection and developer tools have been restricted to protect Next LIfe Technologies components, algorithms, and intellectual property.
            </p>
            <p className="security-modal-sub">
              Please close developer tools to restore full application access.
            </p>
            <button className="btn btn-primary" onClick={() => setIsDevToolsOpen(false)}>
              Close DevTools Warning
            </button>
          </div>
        </div>
      )}
    </>
  );
}
