// Kept separate from the syllabus and question banks so the homepage banner
// does not download the full exam data on its first visit.
export const DEFAULT_SERIES_SETTINGS = {
  isProminent: true,
  prominentUntil: '2026-11-20',
  badgeText: 'PSC Entrance 2026',
  title: 'Botany Assistant Professor Entrance Test Series',
  subtitle: '50 coded tests across 10 PSC units: 44 subunit tests, 3 mocks, a grand finale and a real exam experience.',
  fullSeriesPrice: 1499,
  originalPrice: 2499,
  unitWisePrice: 199,
  allowUnitWisePurchase: true,
  razorpayKey: 'rzp_live_TGUYt8AMIuHwLa',
  contactSupportEmail: 'admissions@nexliftech.space',
  promoCodes: []
};

const LEGACY_SUBTITLE = 'Targeted 35-Test Plan covering all 10 PSC Units, ~2,700 High-Yield Questions, Full-Length Mocks & In-Depth Option Analysis.';

export function normalizeBotanySettings(saved = {}) {
  const settings = { ...DEFAULT_SERIES_SETTINGS, ...saved };
  if (settings.subtitle === LEGACY_SUBTITLE) settings.subtitle = DEFAULT_SERIES_SETTINGS.subtitle;
  if (settings.flashDetails?.includes('35 planned tests')) {
    settings.flashDetails = settings.flashDetails.replace('35 planned tests', '50 coded tests');
  }
  if (settings.flashDetails?.startsWith('Targeted 35-Test Calendar covering all 10 PSC Units')) {
    settings.flashDetails = '50 coded tests across 10 PSC units, with 3,650 planned questions, full mocks, a grand finale and a real exam experience.';
  }
  return settings;
}
