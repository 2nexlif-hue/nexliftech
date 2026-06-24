import { Check } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Pricing.css';

export default function Pricing() {
  const animateRef = useScrollAnimation();

  const plans = [
    {
      name: "Starter",
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

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Transparent <span className="text-gradient">Pricing</span></h2>
          <p className="section-subtitle">
            High-performance engineering at competitive rates. Choose the plan that fits your vision.
          </p>
        </div>

        <div className="grid grid-cols-3 pricing-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card glass-panel animate-on-scroll ${plan.isPopular ? 'popular' : ''}`}
              ref={animateRef}
              style={{ transitionDelay: `${index * 0.15}s` }}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
