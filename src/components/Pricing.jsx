import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Pricing.css';

const DEFAULT_PLANS = [
  {
    name: "Starter",
    tabName: "Starter",
    description: "Perfect for personal brands and small local businesses.",
    price: "₹14,999",
    features: [
      "Single-page responsive website",
      "Modern design (Vite + React)",
      "Basic SEO setup",
      "Contact form integration",
      "1 Revision cycle",
      "1 month free support"
    ],
    isPopular: false
  },
  {
    name: "Professional",
    tabName: "Pro",
    description: "Ideal for growing businesses needing a comprehensive online presence.",
    price: "₹34,999",
    features: [
      "Multi-page website (up to 7 pages)",
      "CMS integration for easy updates",
      "Advanced SEO & Analytics",
      "Security headers & hardening",
      "3 Revision cycles",
      "3 months free support"
    ],
    isPopular: true
  },
  {
    name: "Enterprise ERP",
    tabName: "Enterprise",
    description: "Custom web applications and portals for schools or large organizations.",
    price: "Custom",
    features: [
      "Full-stack Web Application",
      "Database & User Authentication",
      "Custom dashboards & reporting",
      "Payment gateway integration",
      "Unlimited revisions during dev",
      "1 year priority support"
    ],
    isPopular: false
  }
];

export default function Pricing() {
  const [activeTab, setActiveTab] = useState(1); // Default to Professional
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'pricing_plans');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().plans) {
        setPlans(snap.data().plans);
      }
    }, (err) => {
      console.error('Firestore pricing plans load error:', err);
    });
    return unsubscribe;
  }, []);

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Transparent <span className="text-gradient">Pricing</span></h2>
          <p className="section-subtitle">
            High-performance engineering at competitive rates. Choose the plan that fits your vision.
          </p>
        </motion.div>

        {/* Desktop View: Side-by-side Grid */}
        <div className="pricing-desktop-view">
          <div className="grid grid-cols-3 pricing-grid">
            {plans.map((plan, index) => (
              <motion.div 
                key={index} 
                className={`pricing-card glass-panel ${plan.isPopular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {plan.isPopular && <div className="popular-badge">Most Popular</div>}
                
                <div className="pricing-header">
                  <h3>{plan.name}</h3>
                  <p className="pricing-desc">{plan.description}</p>
                  <div className="price">{plan.price}</div>
                  {plan.price !== 'Custom' && <div className="price-suffix">Starting at</div>}
                </div>
                
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <Check size={18} className="feature-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pricing-action">
                  <a 
                    href="#contact" 
                    className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-secondary'} w-full`}
                  >
                    {plan.price === 'Custom' ? 'Get a Quote' : 'Choose Plan'}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile View: Tabbed Carousel */}
        <div className="pricing-mobile-view">
          {/* Tabbed Navigation */}
          <motion.div 
            className="pricing-tabs-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="pricing-tabs">
              {plans.map((plan, index) => (
                <button
                  key={index}
                  className={`pricing-tab-btn ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  <span>{plan.tabName}</span>
                  {plan.isPopular && <span className="popular-tab-badge">Popular</span>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content Display Area */}
          <div className="pricing-content-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="pricing-card-wrapper"
              >
                {(() => {
                  const plan = plans[activeTab];
                  return (
                    <div className={`pricing-card glass-panel ${plan.isPopular ? 'popular' : ''}`}>
                      {plan.isPopular && <div className="popular-badge">Most Popular</div>}
                      
                      <div className="pricing-header">
                        <h3>{plan.name}</h3>
                        <p className="pricing-desc">{plan.description}</p>
                        <div className="price">{plan.price}</div>
                        {plan.price !== 'Custom' && <div className="price-suffix">Starting at</div>}
                      </div>
                      
                      <ul className="pricing-features">
                        {plan.features.map((feature, i) => (
                          <li key={i}>
                            <Check size={18} className="feature-icon" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="pricing-action">
                        <a 
                          href="#contact" 
                          className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-secondary'} w-full`}
                        >
                          {plan.price === 'Custom' ? 'Get a Quote' : 'Choose Plan'}
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
