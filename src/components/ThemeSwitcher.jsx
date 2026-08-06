import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Zap, Palette } from 'lucide-react';
import './ThemeSwitcher.css';

const THEMES = [
  { id: 'light', name: 'Light Mode (Default)', icon: Sun },
  { id: 'dark', name: 'Dark Aurora', icon: Moon },
  { id: 'cyber', name: 'Cyber Neon', icon: Zap }
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // 1. Initialize theme on load (Default is 'light')
  useEffect(() => {
    const savedTheme = localStorage.getItem('nex_theme_preference') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // 2. Handle theme change
  const handleSelectTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('nex_theme_preference', themeId);
    setIsOpen(false);
  };

  // 3. Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ActiveIcon = currentTheme === 'dark' ? Moon : currentTheme === 'cyber' ? Zap : Sun;

  return (
    <div className="theme-switcher-wrapper" ref={wrapperRef}>
      {isOpen && (
        <div className="theme-menu-popup">
          <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>
            Select Theme
          </div>
          {THEMES.map(t => {
            const IconComponent = t.icon;
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTheme(t.id)}
                className={`theme-option-btn ${isActive ? 'active' : ''}`}
              >
                <IconComponent size={15} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="theme-trigger-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title="Change Theme (Default: Light)"
        aria-label="Toggle Theme Switcher"
      >
        <ActiveIcon size={22} />
      </button>
    </div>
  );
}
