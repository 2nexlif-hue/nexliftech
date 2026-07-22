import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, CornerDownLeft, Sparkles, ArrowRight } from 'lucide-react';
import './SearchModal.css';

const SEARCHABLE_ITEMS = [
  // Services
  {
    title: 'Custom Web Development',
    category: 'Services',
    description: 'Modern, high-performance single-page apps and websites using React, Next.js, and clean code.',
    target: '#services',
    tags: ['react', 'next.js', 'frontend', 'website', 'spa']
  },
  {
    title: 'E-Commerce Solutions',
    category: 'Services',
    description: 'High-converting, secure online stores with payment gateways and custom checkout flows.',
    target: '#services',
    tags: ['shop', 'store', 'cart', 'payment', 'stripe']
  },
  {
    title: 'Web Applications',
    category: 'Services',
    description: 'Complex SaaS systems, custom admin dashboards, and scalable internal tooling.',
    target: '#services',
    tags: ['saas', 'dashboard', 'portal', 'cloud', 'database']
  },
  {
    title: 'Performance Optimization',
    category: 'Services',
    description: 'Blazing fast load times, 100/100 Lighthouse scores, and search engine visibility adjustments.',
    target: '#services',
    tags: ['speed', 'lighthouse', 'seo', 'fast', 'rank']
  },
  {
    title: 'Security Hardening',
    category: 'Services',
    description: 'OWASP-compliant architecture, robust security headers, secure authentication, and data safety.',
    target: '#services',
    tags: ['security', 'auth', 'ssl', 'firebase', 'firewall']
  },
  {
    title: 'Maintenance & Support',
    category: 'Services',
    description: 'Continuous technical updates, security patching, automated backups, and general reliability checks.',
    target: '#services',
    tags: ['support', 'backup', 'update', 'help', 'uptime']
  },

  // Projects
  {
    title: 'Govt HSS Shangus ERP',
    category: 'Projects',
    description: 'Admission & Exam portal for Govt Higher Secondary School Shangus. Features bulk roll assignments and reports.',
    target: '#portfolio',
    tags: ['school', 'erp', 'education', 'admission', 'student', 'shangus']
  },
  {
    title: 'Visit Alpines',
    category: 'Projects',
    description: 'Premium travel and itinerary booking application showcasing breathtaking Alpine tour packages.',
    target: '#portfolio',
    tags: ['travel', 'booking', 'tourism', 'alpine', 'himalayas']
  },
  {
    title: 'WalletVibe',
    category: 'Projects',
    description: 'Online personal finance tool to simplify expenditure tracking, lend/borrow records, bank statements, and reports.',
    target: '#portfolio',
    tags: ['walletvibe', 'finance', 'money', 'expenditure', 'borrow', 'lend', 'reports', 'bank', 'budget']
  },
  {
    title: 'Automated Educational & Reporting Suite',
    category: 'Projects',
    description: 'Python, Selenium & Apps Script tools for auto UDISE+ student profile sync, bulk JKBOSE 10th–12th result downloads, RR & exam submissions, QR generation, system cleanup, and reports.',
    target: '#portfolio',
    tags: ['python', 'automation', 'udise+', 'jkbose', 'bulk results', 'qr code', 'reporting', 'rr forms', 'exam forms', 'sheets', 'vba']
  },

  // About / Founder
  {
    title: 'Sheikh Gulfam (Founder)',
    category: 'Founder & Bio',
    description: 'Lecturer in Botany and Research Scholar at CSIR IIIM Jammu, transitioned into a software architect.',
    target: '#about',
    tags: ['gulfam', 'founder', 'botany', 'csir', 'research', 'lecturer', 'developer']
  },
  {
    title: 'Academic Credentials',
    category: 'Founder & Bio',
    description: 'CSIR NET-JRF Qualified, GATE Life Sciences holder, CSIR IIIM Jammu alumnus.',
    target: '#about',
    tags: ['net', 'jrf', 'gate', 'phd', 'research', 'iiim']
  },

  // Pricing
  {
    title: 'Starter Plan',
    category: 'Pricing',
    description: 'Perfect for landing pages, portfolios, or personal brands looking to build an online footprint.',
    target: '#pricing',
    tags: ['pricing', 'starter', 'basic', 'cheap', 'budget']
  },
  {
    title: 'Pro Plan',
    category: 'Pricing',
    description: 'Best for growing businesses needing dynamic custom pages, blogging features, or contact portals.',
    target: '#pricing',
    tags: ['pro', 'popular', 'business', 'pricing']
  },
  {
    title: 'Enterprise ERP',
    category: 'Pricing',
    description: 'Full-scale school management systems, e-commerce, custom SaaS, and advanced administrative portals.',
    target: '#pricing',
    tags: ['enterprise', 'erp', 'custom', 'school', 'saas', 'pricing']
  },

  // Contact
  {
    title: 'Start a Project / Contact',
    category: 'General',
    description: 'Get in touch for custom inquiries, project consultation, or software architecture design.',
    target: '#contact',
    tags: ['contact', 'email', 'phone', 'hire', 'quote', 'support']
  },
  {
    title: 'Admin Dashboard Login',
    category: 'General',
    description: 'Access the NexLifTech administrative control panel for pricing and dynamic content management.',
    target: '/admin/login',
    tags: ['admin', 'login', 'dashboard', 'lock', 'panel']
  }
];

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const listRef = useRef(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle clicking outside modal content
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Filter items
  const filteredItems = SEARCHABLE_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!query) return true;

    const cleanQuery = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(cleanQuery) ||
      item.description.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(cleanQuery))
    );
  });

  // Reset selection index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleItemClick = useCallback((item) => {
    onClose();
    if (item.target.startsWith('#')) {
      const element = document.querySelector(item.target);
      if (element) {
        const navHeight = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      window.location.href = item.target;
    }
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleItemClick(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleItemClick, onClose]);

  // Keep selected item visible in scroll container
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  const categories = ['All', 'Services', 'Projects', 'Founder & Bio', 'Pricing', 'General'];

  return (
    <div className="search-overlay" onClick={handleOverlayClick}>
      <div className="search-modal glass-panel" ref={modalRef}>
        <div className="search-header-container">
          <div className="search-input-wrapper">
            <Search className="search-icon-input" size={20} />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search services, projects, credentials, pricing..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-clear-btn" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <button className="search-close-btn" onClick={onClose} aria-label="Close search">
            <span className="esc-key">ESC</span>
            <X size={20} className="close-icon-mobile" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="search-categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`search-category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="search-results-wrapper">
          {filteredItems.length > 0 ? (
            <div className="search-results-list" ref={listRef}>
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="search-result-info">
                    <span className="search-result-category-badge">{item.category}</span>
                    <h4 className="search-result-title">
                      {highlightText(item.title, query)}
                    </h4>
                    <p className="search-result-desc">
                      {highlightText(item.description, query)}
                    </p>
                  </div>
                  <div className="search-result-action">
                    {selectedIndex === index ? (
                      <span className="enter-badge">
                        <span>Select</span>
                        <CornerDownLeft size={12} />
                      </span>
                    ) : (
                      <ArrowRight size={16} className="arrow-icon" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="search-empty-state">
              <Sparkles size={36} className="empty-icon" />
              <h3>No results found</h3>
              <p>We couldn't find anything matching "{query}". Try checking your spelling or search another topic.</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="search-footer">
          <div className="shortcut-item">
            <span className="key-btn">↑↓</span>
            <span>Navigate</span>
          </div>
          <div className="shortcut-item">
            <span className="key-btn">Enter</span>
            <span>Open Link</span>
          </div>
          <div className="shortcut-item">
            <span className="key-btn">Esc</span>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
