import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, LogIn } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SearchModal from './SearchModal';
import './Navbar.css';

const LogoSVG = () => (
  <svg className="navbar-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nav-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path d="M 42 85 C 18 70 15 40 38 22 C 45 16 50 12 50 12 C 50 12 48 22 44 32 C 34 55 46 78 42 85 Z" fill="url(#nav-logo-grad)" opacity="0.9" />
    <path d="M 45 28 L 68 50 L 45 72" stroke="url(#nav-logo-grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Navbar({ notificationsHook }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for global keyboard shortcuts (Ctrl+K, Cmd+K, /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/') {
        if (
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA' &&
          !document.activeElement.isContentEditable
        ) {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Pricing', href: '#pricing' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <a href="#home" className="logo" onClick={(e) => handleNavClick(e, '#home')}>
            <LogoSVG />
            <span className="logo-text">NexLifTech</span>
            <span className="logo-dot">.</span>
          </a>

          <div className="nav-desktop">
            <ul className="nav-links">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>{link.name}</a>
                </li>
              ))}
            </ul>
            
            <div className="nav-actions">
              <button 
                className="nav-search-trigger-btn"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search website"
                title="Search (Ctrl+K)"
              >
                <Search size={18} />
                <span className="search-hotkey">/</span>
              </button>
              <NotificationBell notificationsHook={notificationsHook} />
              
              {/* Desktop Admin Login Button */}
              <Link 
                to="/admin/login" 
                className="nav-login-btn"
                title="Admin Portal Login"
              >
                <LogIn size={15} />
                <span>Admin Login</span>
              </Link>

              <a href="#contact" className="btn btn-primary btn-sm" onClick={(e) => handleNavClick(e, '#contact')}>Start Project</a>
            </div>
          </div>

          <div className="nav-mobile-toggle">
            <button 
              className="mobile-search-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search website"
            >
              <Search size={22} />
            </button>
            <NotificationBell notificationsHook={notificationsHook} mobile />
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="container">
            <ul className="mobile-nav-links">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    onClick={(e) => handleNavClick(e, link.href)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              <li>
                <Link 
                  to="/admin/login" 
                  className="nav-login-btn mobile-login-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  <span>Admin Login</span>
                </Link>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={(e) => handleNavClick(e, '#contact')}
                >
                  Start Project
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Search Overlay Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
