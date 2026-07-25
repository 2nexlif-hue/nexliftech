import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import './Hero.css';

const DEFAULT_HERO = {
  badge: '// NEXLIFTECH_ENGINEERING',
  title: 'Architecting [High-Performance] Web Apps & Code',
  subtitle: 'Clean architecture, zero fluff. We build web applications, institutional ERPs, and automated workflows engineered to scale.',
  ctaText1: 'Start Project',
  ctaLink1: '#contact',
  ctaText2: 'View Builds',
  ctaLink2: '#portfolio',
  trustText: '$ core_tech_stack:',
  techBadges: ['React 19', 'Next.js', 'Vite', 'Firebase', 'Python', 'Node.js']
};

export default function Hero() {
  const [data, setData] = useState(DEFAULT_HERO);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'hero');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data();
        setData({ 
          ...DEFAULT_HERO, 
          ...remoteData,
          badge: DEFAULT_HERO.badge,
          title: DEFAULT_HERO.title,
          subtitle: DEFAULT_HERO.subtitle,
          trustText: DEFAULT_HERO.trustText,
          techBadges: DEFAULT_HERO.techBadges
        });
      }
    }, (err) => {
      console.error('Firestore hero load error:', err);
    });
    return unsubscribe;
  }, []);

  const renderTitle = (title) => {
    if (!title) return '';
    const parts = title.split(/\[(.*?)\]/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <span key={index} className="text-gradient">{part}</span>;
      }
      return part;
    });
  };

  return (
    <section id="home" className="hero">
      {/* Background video - cinemagraph style */}
      <div className="hero-video-wrapper">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="hero-video"
        >
          {/* Abstract tech/coding loop - royalty free */}
          <source
            src="https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero-video-overlay"></div>
      </div>

      <div className="bg-glow hero-glow"></div>
      <div className="particle-grid"></div>

      <div className="container hero-container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="badge hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {data.badge}
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderTitle(data.title)}
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <a href={data.ctaLink1} className="btn btn-primary btn-lg magnetic-btn">
              {data.ctaText1} <ArrowRight size={18} />
            </a>
            <a href={data.ctaLink2} className="btn btn-secondary btn-lg magnetic-btn">
              {data.ctaText2}
            </a>
          </motion.div>

          {data.techBadges && data.techBadges.length > 0 && (
            <motion.div
              className="trust-signals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <p>{data.trustText || 'Trusted technology stack:'}</p>
              <div className="tech-badges">
                {data.techBadges.map((tech, idx) => (
                  <span key={idx} className="tech-badge">
                    {idx === 0 && <Code size={14} />} {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
