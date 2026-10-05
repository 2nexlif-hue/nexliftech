import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';
import { getBotanySettings } from '../../utils/botanyFirestoreService';
import { DEFAULT_SERIES_SETTINGS } from '../../utils/botanyTestSeriesData';
import './BotanySeries.css';

export default function BotanySpotlightBanner() {
  const [settings, setSettings] = useState(DEFAULT_SERIES_SETTINGS);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const s = await getBotanySettings();
        if (s) setSettings(s);
      } catch (err) {
        console.warn('Could not load spotlight settings:', err);
      }
    }
    fetchSettings();
  }, []);

  if (!settings || !settings.isProminent) return null;

  // Check if prominentUntil has passed
  if (settings.prominentUntil) {
    const expiry = new Date(settings.prominentUntil);
    if (new Date() > expiry) return null;
  }

  return (
    <div className="hero-middle-flash-card" role="region" aria-label="Botany Test Series Flash Announcement">
      <div className="hero-flash-inner">
        <div className="hero-flash-left">
          <span className="hero-flash-badge">
            <span className="hero-flash-beacon" />
            <Zap size={13} fill="currentColor" />
            <span>FLASH UPDATE</span>
          </span>
          <div className="hero-flash-copy">
            <h4 className="hero-flash-title">
              {settings.flashHeadline || 'Botany Assistant Professor (PSC 2026) CBT Test Series is Live!'}
            </h4>
            <p className="hero-flash-details">
              {settings.flashDetails || '35 Scheduled Tests • ~2,700 High-Yield Questions • Option-by-Option Analysis (Curated by Dr. Aubid Ahmad)'}
            </p>
          </div>
        </div>

        <div className="hero-flash-right">
          <Link to="/botany-test-series" className="hero-flash-btn">
            <span>Explore Test Series</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
