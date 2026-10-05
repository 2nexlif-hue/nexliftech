import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { getBotanySettings } from '../../utils/botanyFirestoreService';
import './BotanySeries.css';

export default function BotanySpotlightBanner() {
  const [settings, setSettings] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const s = await getBotanySettings();
        setSettings(s);
      } catch (err) {
        console.warn('Could not load spotlight settings:', err);
      }
    }
    fetchSettings();
  }, []);

  if (dismissed || !settings || !settings.isProminent) return null;

  // Check if prominentUntil has passed
  if (settings.prominentUntil) {
    const expiry = new Date(settings.prominentUntil);
    if (new Date() > expiry) return null;
  }

  return (
    <aside className="botany-spotlight-banner" aria-label="Featured Examination Test Series">
      <div className="container spotlight-content">
        <div className="spotlight-left">
          <span className="spotlight-pill">
            <Sparkles size={13} />
            <span>{settings.badgeText || 'PSC Entrance 2026'}</span>
          </span>
          <span className="spotlight-headline">
            <strong>Botany Assistant Professor Test Series is Live!</strong>{' '}
            <span className="spotlight-details">
              35 Tests • ~2,700 Questions with Option-by-Option Analysis (Curated by Dr. Aubid Ahmad)
            </span>
          </span>
        </div>

        <div className="spotlight-right">
          <Link to="/botany-test-series" className="spotlight-btn">
            <span>Explore Test Series</span>
            <ArrowRight size={14} />
          </Link>
          <button 
            type="button" 
            className="spotlight-close-btn"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss spotlight banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
