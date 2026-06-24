import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import LottieReact from 'lottie-react';
import './Services.css';

// Fix for Vite CommonJS/ESM interop with lottie-react
const Lottie = LottieReact.default || LottieReact;

// Inline lightweight Lottie animation data for each service
// These are simple, elegant "line art" style animations
const lottieData = {
  code: {
    v: "5.7.4", fr: 30, ip: 0, op: 60, w: 100, h: 100,
    layers: [{ 
      ty: 4, nm: "code", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, 
      p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, 
      s: { a: 1, k: [
        { t: 0, s: [90, 90, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
        { t: 30, s: [100, 100, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
        { t: 60, s: [90, 90, 100] }
      ]}},
      shapes: [
        { ty: "gr", it: [
          { ty: "rc", d: 1, s: { a: 0, k: [60, 45] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 6 } },
          { ty: "st", c: { a: 0, k: [0.55, 0.36, 0.96, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 } },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ], nm: "rect" },
        { ty: "gr", it: [
          { ty: "sh", d: 1, ks: { a: 0, k: { c: false, v: [[-12, -5], [-20, 0], [-12, 5]], i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]] }}},
          { ty: "st", c: { a: 0, k: [0.39, 0.4, 0.95, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 }, lc: 2, lj: 2 },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ], nm: "left" },
        { ty: "gr", it: [
          { ty: "sh", d: 1, ks: { a: 0, k: { c: false, v: [[12, -5], [20, 0], [12, 5]], i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]] }}},
          { ty: "st", c: { a: 0, k: [0.39, 0.4, 0.95, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 }, lc: 2, lj: 2 },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ], nm: "right" }
      ], ip: 0, op: 60, st: 0
    }]
  }
};

// Service card definitions with icons and colors
const services = [
  {
    title: "Custom Web Development",
    description: "Fast, modern single-page applications and websites built using React, Next.js, and modern tech stacks.",
    icon: "💻",
    color: "rgba(139, 92, 246, 0.15)"
  },
  {
    title: "E-Commerce Solutions",
    description: "Secure, high-converting online stores tailored to your business needs with seamless payment integration.",
    icon: "🛒",
    color: "rgba(99, 102, 241, 0.15)"
  },
  {
    title: "Web Applications",
    description: "Complex SaaS platforms, admin dashboards, and internal tools engineered for scale and usability.",
    icon: "🖥️",
    color: "rgba(6, 182, 212, 0.15)"
  },
  {
    title: "Performance Optimization",
    description: "We tune your existing sites to hit 100/100 Lighthouse scores, ensuring blazing fast load times and better SEO.",
    icon: "🚀",
    color: "rgba(16, 185, 129, 0.15)"
  },
  {
    title: "Security Hardening",
    description: "Protect your users and data with OWASP-compliant architecture, security headers, and modern auth flows.",
    icon: "🛡️",
    color: "rgba(168, 85, 247, 0.15)"
  },
  {
    title: "Maintenance & Support",
    description: "Ongoing technical support, automated backups, and dependency updates so you can focus on your business.",
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
            Expertise You Can <span className="text-gradient">Trust</span>
          </h2>
          <p className="section-subtitle">
            We deliver end-to-end digital solutions that combine striking aesthetics with engineering excellence.
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
                {index === 0 ? (
                  <Lottie
                    animationData={lottieData.code}
                    loop={true}
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <span className="service-emoji">{service.icon}</span>
                )}
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
