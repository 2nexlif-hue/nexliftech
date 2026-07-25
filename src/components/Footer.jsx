import { Lock } from 'lucide-react';
import './Footer.css';

const LogoSVG = () => (
  <svg className="footer-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="footer-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <path d="M 42 85 C 18 70 15 40 38 22 C 45 16 50 12 50 12 C 50 12 48 22 44 32 C 34 55 46 78 42 85 Z" fill="url(#footer-logo-grad)" opacity="0.9" />
    <path d="M 45 28 L 68 50 L 45 72" stroke="url(#footer-logo-grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/sheikh-gulfam-8a11ab124/',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      )
    },
    {
      label: 'GitHub',
      href: 'https://github.com/ShGulfam',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      )
    },
    {
      label: 'Twitter / X',
      href: 'https://twitter.com/Gulfam_91',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
        </svg>
      )
    },
    {
      label: 'ResearchGate',
      href: 'https://www.researchgate.net/profile/Sheikh-Gulfam',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <text x="1" y="19" fontSize="18" fontFamily="Georgia,serif" fontWeight="bold">R</text>
          <text x="9" y="19" fontSize="14" fontFamily="Georgia,serif">G</text>
        </svg>
      )
    },
    {
      label: 'Google Scholar',
      href: 'https://scholar.google.com/citations?user=kXQj-1EAAAAJ&hl=en',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 7.5L4.5 6.2 3 7l9 4.5 9-4.5-1.5-.8L12 9.5zM12 12l-9-4.5V16c0 2.5 4 4.5 9 4.5s9-2 9-4.5V7.5L12 12z"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="logo">
              <LogoSVG />
              <span className="logo-text">NexLifTech</span>
              <span className="logo-dot">.</span>
            </a>
            <p className="footer-desc">
              High-performance web applications, institutional ERPs, and automated backend engines built for scale.
            </p>
            <div className="social-links">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="social-link"
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div className="footer-links">
            <h4>Services</h4>
            <ul>
              <li><a href="#services">Web Development</a></li>
              <li><a href="#services">School Website</a></li>
              <li><a href="#services">E-Commerce</a></li>
              <li><a href="#services">Web Applications</a></li>
              <li><a href="#services">Performance SEO</a></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#portfolio">Portfolio</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Academic Profiles</h4>
            <ul>
              <li><a href="https://www.researchgate.net/profile/Sheikh-Gulfam" target="_blank" rel="noopener noreferrer">ResearchGate</a></li>
              <li><a href="https://scholar.google.com/citations?user=kXQj-1EAAAAJ&hl=en" target="_blank" rel="noopener noreferrer">Google Scholar</a></li>
              <li><a href="https://www.linkedin.com/in/sheikh-gulfam-8a11ab124/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} NexLifTech. All rights reserved.</p>
          <div className="footer-bottom-right">
            <p className="built-with">Developed by Sheikh Gulfam</p>
            <a href="/admin/login" className="admin-lock-link" aria-label="Admin Login" style={{ opacity: 0.3 }}>
              <Lock size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

