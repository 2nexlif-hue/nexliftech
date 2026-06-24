import { useState, useEffect } from 'react';
import { Award, BookOpen, GraduationCap, Briefcase } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './About.css';

const CREDENTIAL_ICONS = {
  award: Award,
  book: BookOpen,
  graduation: GraduationCap,
  briefcase: Briefcase
};

// Fallback data used when Firestore is unreachable or doc doesn't exist yet
const FALLBACK = {
  name: 'Sheikh Gulfam',
  title: 'Founder & Lead Developer',
  quote: '"Great software, like nature, requires a strong foundation, adaptability, and continuous growth."',
  storyParagraphs: [
    'Founded by Sheikh Gulfam, NexLifTech is built on a unique foundation of scientific rigor and engineering excellence.',
    "Starting as a Lecturer in Botany with prestigious national credentials (NET-JRF CSIR, JKSET, GATE Life Sciences, ICAR NET), Sheikh's journey shifted during his PhD research at CSIR IIIM Jammu. A deep interest in automating workflows evolved into a passion for software development, leading to the creation of robust web applications, ERPs, and automation tools.",
    "Today, NexLifTech brings that same analytical, research-driven approach to solving business problems through technology. We don't just write code; we architect solutions that are secure, high-performing, and built to scale."
  ],
  credentials: [
    { icon: 'award', label: 'CSIR NET-JRF Qualified' },
    { icon: 'book', label: 'CSIR IIIM Research Alumni' },
    { icon: 'graduation', label: 'GATE Life Sciences' },
    { icon: 'briefcase', label: 'Lecturer since 2017' }
  ],
  stats: [
    { label: 'Projects Completed', value: 45, suffix: '+' },
    { label: 'Happy Clients', value: 30, suffix: '+' },
    { label: 'Years Experience', value: 7, suffix: '+' },
    { label: 'Tech Stack Mastery', value: 12, suffix: '' }
  ],
  photoURL: '/Gulfam.jpg',
  showPhoto: true
};

// Simple counter hook for the stats
function useCounter(end, duration = 2000, startAnimating = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startAnimating) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, startAnimating]);

  return count;
}

function StatItem({ stat, isVisible }) {
  const count = useCounter(stat.value, 2000, isVisible);
  return (
    <div className="stat-item">
      <div className="stat-number text-gradient">
        {count}{stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

export default function About() {
  const animateRef = useScrollAnimation();
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'about_developer');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setData({ ...FALLBACK, ...snap.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return (
    <section id="about" className="about">
      {/* Ambient parallax orbs */}
      <div className="parallax-orb parallax-orb--purple" style={{ top: '10%', right: '-5%' }}></div>
      <div className="parallax-orb parallax-orb--cyan" style={{ bottom: '15%', left: '-8%' }}></div>

      <div className="container">
        <div className="about-grid">
          <div className="about-content animate-on-scroll" ref={animateRef}>
            <div className="badge about-badge">Our Story</div>
            <h2 className="section-title">
              Where <span className="text-gradient">Science</span> Meets Code
            </h2>

            <div className="story-text">
              {loading ? (
                <>
                  <div className="skeleton skeleton-line"></div>
                  <div className="skeleton skeleton-line short"></div>
                  <div className="skeleton skeleton-line"></div>
                </>
              ) : (
                data.storyParagraphs.map((para, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    {i === 0 ? (
                      <>
                        Founded by <strong>{data.name}</strong>,{' '}
                        {para.replace(/^Founded by [^,]+,\s*/, '')}
                      </>
                    ) : (
                      para
                    )}
                  </motion.p>
                ))
              )}
            </div>

            <div className="credentials-grid">
              {data.credentials.map((cred, index) => {
                const IconComponent = CREDENTIAL_ICONS[cred.icon] || Award;
                return (
                  <motion.div
                    key={index}
                    className="credential-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <IconComponent size={20} className="credential-icon" />
                    <span>{cred.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="about-visual animate-on-scroll" ref={animateRef}>
            <motion.div
              className="founder-card glass-panel"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="founder-glow"></div>
              <div className="founder-content">
                <div className="founder-avatar">
                  {data.showPhoto && data.photoURL ? (
                    <img
                      src={data.photoURL}
                      alt={data.name}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {data.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                <h3>{data.name}</h3>
                <p className="founder-title">{data.title}</p>
                <div className="founder-quote">{data.quote}</div>

                {/* Social profile links */}
                <div className="founder-socials">
                  <a href="https://www.linkedin.com/in/sheikh-gulfam-8a11ab124/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" className="founder-social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                  <a href="https://www.researchgate.net/profile/Sheikh-Gulfam" target="_blank" rel="noopener noreferrer" aria-label="ResearchGate" title="ResearchGate" className="founder-social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><text x="1" y="18" fontSize="16" fontFamily="Georgia,serif" fontWeight="bold">R</text><text x="9" y="18" fontSize="12" fontFamily="Georgia,serif">G</text></svg>
                  </a>
                  <a href="https://scholar.google.com/citations?user=kXQj-1EAAAAJ&hl=en" target="_blank" rel="noopener noreferrer" aria-label="Google Scholar" title="Google Scholar" className="founder-social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 7.5L4.5 6.2 3 7l9 4.5 9-4.5-1.5-.8L12 9.5zM12 12l-9-4.5V16c0 2.5 4 4.5 9 4.5s9-2 9-4.5V7.5L12 12z"/></svg>
                  </a>
                  <a href="https://twitter.com/Gulfam_91" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" title="@Gulfam_91 on Twitter/X" className="founder-social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div ref={statsRef} className="stats-container glass-card mt-12 animate-on-scroll" id="about-stats">
          <div className="grid grid-cols-4">
            {data.stats.map((stat, index) => (
              <StatItem key={index} stat={stat} isVisible={statsInView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
