import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Search, LogIn } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SearchModal from './SearchModal';
import LogoSVG from './Logo';
import './Navbar.css';

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
    { name: 'Test Series', href: '/botany-test-series', isRoute: true, badge: '⚡ FLASH' },
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
                  {link.isRoute ? (
                    <Link to={link.href} className="nav-route-link">
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className={`nav-link-badge ${link.badge.includes('FLASH') ? 'flash-badge-nav' : ''}`}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>{link.name}</a>
                  )}
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

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-menu-backdrop" 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu Drawer */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="container mobile-menu-inner">
            <ul className="mobile-nav-links">
              {navLinks.map((link) => (
                <li key={link.name}>
                  {link.isRoute ? (
                    <Link 
                      to={link.href} 
                      className="mobile-nav-item"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {link.name}
                        {link.badge && (
                          <span className={`nav-link-badge ${link.badge.includes('FLASH') ? 'flash-badge-nav' : ''}`} style={{ marginLeft: '6px' }}>
                            {link.badge}
                          </span>
                        )}
                      </span>
                      <span className="mobile-nav-arrow">→</span>
                    </Link>
                  ) : (
                    <a 
                      href={link.href} 
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="mobile-nav-item"
                    >
                      <span>{link.name}</span>
                      <span className="mobile-nav-arrow">→</span>
                    </a>
                  )}
                </li>
              ))}
              <li className="mobile-menu-divider" />
              <li>
                <Link 
                  to="/admin/login" 
                  className="nav-login-btn mobile-login-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={16} />
                  <span>Admin Portal</span>
                </Link>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="btn btn-primary mobile-cta-btn"
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
