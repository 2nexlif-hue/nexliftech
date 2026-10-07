import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './Services.css';

const DEFAULT_SERVICES = [
  {
    title: "Full-Stack Web Apps",
    description: "React, Next.js, and Node.js applications built with modular state management and zero-lag rendering.",
    icon: "💻",
    color: "rgba(139, 92, 246, 0.15)"
  },
  {
    title: "Institutional ERPs",
    description: "Tailored admin portals, student/staff databases, automated roll assignment, and RBAC authentication.",
    icon: "🖥️",
    color: "rgba(99, 102, 241, 0.15)"
  },
  {
    title: "Workflow Automation",
    description: "Python, Selenium & Apps Script bots for automated data processing, web scraping, and custom reports.",
    icon: "⚡",
    color: "rgba(6, 182, 212, 0.15)"
  },
  {
    title: "Performance Optimization",
    description: "Lighthouse 100/100 tuning, asset minification, route lazy-loading, and edge caching strategies.",
    icon: "🚀",
    color: "rgba(16, 185, 129, 0.15)"
  },
  {
    title: "Security Hardening",
    description: "OWASP-compliant architecture, CSP security headers, rate limiting, and sanitized inputs.",
    icon: "🛡️",
    color: "rgba(168, 85, 247, 0.15)"
  },
  {
    title: "API & DB Architecture",
    description: "RESTful API design, Firestore real-time synchronization, and database index optimization.",
    icon: "🔧",
    color: "rgba(244, 114, 182, 0.15)"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

export default function Services() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-50px' });
  const services = DEFAULT_SERVICES;

  return (
    <section id="services" className="services">
      {/* Ambient parallax orbs */}
      <div className="parallax-orb parallax-orb--pink" style={{ top: '20%', right: '5%' }}></div>
      <div className="parallax-orb parallax-orb--cyan" style={{ bottom: '10%', left: '5%' }}></div>

      <div className="container">
        <motion.div
          ref={headerRef}
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">
            Engineering <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="section-subtitle">
            Full-stack web applications, automated workflows, and system hardening engineered for maximum throughput.
          </p>
        </motion.div>

        <div className="grid grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="glass-card service-card"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              custom={index}
              whileHover={{
                y: -8,
                borderColor: 'rgba(139, 92, 246, 0.3)',
                boxShadow: '0 0 25px rgba(139, 92, 246, 0.15)',
                transition: { duration: 0.25 }
              }}
            >
              <div className="service-icon-wrapper" style={{ background: service.color }}>
                <span className="service-emoji" aria-hidden="true">{service.icon}</span>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
