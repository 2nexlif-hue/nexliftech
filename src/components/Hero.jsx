import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight, Code } from 'lucide-react';
import BotanySpotlightBanner from './BotanyTestSeries/BotanySpotlightBanner';
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
      <div className="bg-glow hero-glow"></div>
      <div className="particle-grid"></div>

      <div className="container hero-container">
        <div className="hero-content">
          <div className="badge hero-badge">
            {data.badge}
          </div>

          <h1 className="hero-title">
            {renderTitle(data.title)}
          </h1>

          <p className="hero-subtitle">
            {data.subtitle}
          </p>

          {/* Middle of screen Test Series Flash Announcement */}
          <div className="hero-announcement">
            <BotanySpotlightBanner />
          </div>

          <div className="hero-actions">
            <a href={data.ctaLink1} className="btn btn-primary btn-lg magnetic-btn">
              {data.ctaText1} <ArrowRight size={18} />
            </a>
            <a href={data.ctaLink2} className="btn btn-secondary btn-lg magnetic-btn">
              {data.ctaText2}
            </a>
          </div>

          {data.techBadges && data.techBadges.length > 0 && (
            <div className="trust-signals">
              <p>{data.trustText || 'Trusted technology stack:'}</p>
              <div className="tech-badges">
                {data.techBadges.map((tech, idx) => (
                  <span key={idx} className="tech-badge">
                    {idx === 0 && <Code size={14} />} {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
