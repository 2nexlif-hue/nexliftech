import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar({ notificationsHook }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <a href="#home" className="logo" onClick={(e) => handleNavClick(e, '#home')}>
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
            <NotificationBell notificationsHook={notificationsHook} />
            <a href="#contact" className="btn btn-primary btn-sm" onClick={(e) => handleNavClick(e, '#contact')}>Start Project</a>
          </div>
        </div>

        <div className="nav-mobile-toggle">
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
              <a 
                href="#contact" 
                className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}
                onClick={(e) => handleNavClick(e, '#contact')}
              >
                Start Project
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
