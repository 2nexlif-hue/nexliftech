import { ArrowRight, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import './Hero.css';

export default function Hero() {
  return (
    <section id="home" className="hero">
      {/* Background video - cinemagraph style */}
      <div className="hero-video-wrapper">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="hero-video"
          poster=""
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
            Next Life Technologies
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            We Build Digital Experiences That{' '}
            <span className="text-gradient">Drive Growth</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            State-of-the-art websites and web applications built with modern
            engineering, unparalleled performance, and robust security for
            schools, businesses, and personal brands.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
          >
            <a href="#contact" className="btn btn-primary btn-lg magnetic-btn">
              Start Your Project <ArrowRight size={18} />
            </a>
            <a href="#portfolio" className="btn btn-secondary btn-lg magnetic-btn">
              View Our Work
            </a>
          </motion.div>

          <motion.div
            className="trust-signals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <p>Trusted technology stack:</p>
            <div className="tech-badges">
              <span className="tech-badge"><Code size={14} /> React</span>
              <span className="tech-badge">Vite</span>
              <span className="tech-badge">Firebase</span>
              <span className="tech-badge">Next.js</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
