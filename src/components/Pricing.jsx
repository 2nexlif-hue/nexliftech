import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Pricing.css';

const DEFAULT_PLANS = [
  {
    name: "Starter Build",
    tabName: "Starter",
    description: "Lightweight SPA for personal sites or concise company landers.",
    price: "₹14,999",
    features: [
      "Single-page React / Vite SPA",
      "Sub-second load times",
      "Lighthouse SEO & Schema setup",
      "Sanitized contact form integration",
      "1 Revision cycle",
      "30 days technical support"
    ],
    isPopular: false
  },
  {
    name: "Pro Application",
    tabName: "Pro",
    description: "Full multi-page Web App with CMS and analytics integration.",
    price: "₹34,999",
    features: [
      "Multi-page Web App (up to 7 routes)",
      "Headless CMS integration",
      "Advanced SEO & telemetry analytics",
      "Security hardening & CSP headers",
      "3 Revision cycles",
      "90 days technical support"
    ],
    isPopular: true
  },
  {
    name: "Enterprise ERP",
    tabName: "Enterprise",
    description: "Custom ERPs, RBAC databases, and complex automation systems.",
    price: "Custom",
    features: [
      "Custom Full-Stack Web Application",
      "Postgres/Firestore DB & Auth",
      "Custom dashboards & automated reporting",
      "Payment gateway & API pipelines",
      "Dedicated development cycles",
      "1 Year priority engineering support"
    ],
    isPopular: false
  }
];

// Web Audio API synthesizer for futuristic tech UI hover & click sound effects
const playHoverSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Ignore audio autoplay restrictions quietly
  }
};

const playClickSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio policy restrictions
  }
};

export default function Pricing() {
  const [activeTab, setActiveTab] = useState(1); // Default to Professional
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'pricing_plans');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().plans) {
        setPlans(DEFAULT_PLANS);
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
            Fixed scope, zero bloat, and fast delivery cycles.
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
                whileHover={{ 
                  y: -12, 
                  scale: 1.03, 
                  borderColor: plan.isPopular ? 'rgba(6, 238, 255, 0.8)' : 'rgba(168, 85, 247, 0.6)',
                  boxShadow: plan.isPopular ? '0 0 45px rgba(6, 238, 255, 0.35)' : '0 0 35px rgba(168, 85, 247, 0.3)'
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                onMouseEnter={playHoverSound}
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
                    <motion.li 
                      key={i}
                      whileHover={{ x: 4, color: '#06eeff' }}
                      onMouseEnter={playHoverSound}
                    >
                      <Check size={18} className="feature-icon" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                
                <div className="pricing-action">
                  <a 
                    href="#contact" 
                    className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onMouseEnter={playHoverSound}
                    onClick={playClickSound}
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
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setActiveTab(index);
                  }}
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
