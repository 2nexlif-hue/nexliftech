import { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, Play, 
  ArrowRight, Tag, Sparkles, UserCheck, LogOut, ArrowLeft, Search 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBotanySettings, getBotanySyllabus, getBotanySchedule } from '../../utils/botanyFirestoreService';
import { initiateRazorpayPayment } from '../../utils/razorpayService';
import StudentAuthModal from './StudentAuthModal';
import StudentExamEngine from './StudentExamEngine';
import './BotanySeries.css';

// Sample Diagnostic Demonstration Questions (Microbiology & Lower Plants)
const DEMO_QUESTIONS = [
  {
    id: 'demo_1',
    question: 'Which of the following plant viruses possesses a circular double-stranded DNA genome with discontinuous site-specific gaps (pararetrovirus)?',
    optionA: 'Tobacco Mosaic Virus (TMV)',
    optionB: 'Cauliflower Mosaic Virus (CaMV)',
    optionC: 'Turnip Yellow Mosaic Virus (TYMV)',
    optionD: 'Potato Virus X (PVX)',
    correctOption: 'B',
    analysisA: 'Incorrect. TMV has a positive-sense single-stranded RNA genome (~6.4 kb) encapsulated in helical rod-shaped virions.',
    analysisB: 'Correct. Cauliflower Mosaic Virus (CaMV) is a caulimovirus (pararetrovirus) having open circular dsDNA with 3 site-specific discontinuities.',
    analysisC: 'Incorrect. TYMV has a positive-sense ssRNA genome packed inside an icosahedral shell.',
    analysisD: 'Incorrect. PVX is a flexuous filamentous potexvirus with an ssRNA genome.',
    referenceNote: 'CaMV transcribes a 35S pregenomic RNA and replicates via host reverse transcriptase without genomic integration.'
  },
  {
    id: 'demo_2',
    question: 'In Carl Woese\'s Three-Domain classification, the archaebacterial cell membrane is uniquely characterized by:',
    optionA: 'Ester-linked unbranched fatty acid chains',
    optionB: 'Ether-linked branched phytanyl isoprenoid chains',
    optionC: 'Peptidoglycan containing muramic acid',
    optionD: 'Cellulose and chitin microfibrils',
    correctOption: 'B',
    analysisA: 'Incorrect. Ester-linked unbranched fatty acids are characteristic of Bacteria and Eukarya.',
    analysisB: 'Correct. Archaea uniquely possess branched phytanyl chains linked to glycerol via ether bonds, forming mono- or bilayers resilient to extreme heat and acid.',
    analysisC: 'Incorrect. Archaebacterial cell walls lack peptidoglycan (muramic acid); some Methanogens possess pseudomurein.',
    analysisD: 'Incorrect. Cellulose and chitin occur in plant and fungal walls, respectively.',
    referenceNote: 'Ether linkages protect archaea in hydrothermal vents, hypersaline basins, and solfataric springs.'
  },
  {
    id: 'demo_3',
    question: 'According to Sporne\'s (1975) classification of Pteridophytes, which of the following fossil genera is characterized by naked dichotomous axes and terminal sporangia?',
    optionA: 'Rhynia',
    optionB: 'Lepidodendron',
    optionC: 'Sphenophyllum',
    optionD: 'Psilotum',
    correctOption: 'A',
    analysisA: 'Correct. Rhynia (Psilophytopsida) from the Rhynie Chert (Devonian) had leafless, rootless dichotomous axes with terminal sporangia.',
    analysisB: 'Incorrect. Lepidodendron is an arborescent fossil lycophyte with microphyllous leaves and ligulate scars.',
    analysisC: 'Incorrect. Sphenophyllum is a fossil sphenopsid with whorled cuneate leaves and articulate stems.',
    analysisD: 'Incorrect. Psilotum is a living rootless pteridophyte possessing enations and synangia.',
    referenceNote: 'Rhynia gwynne-vaughanii was originally discovered by Kidston and Lang in 1917.'
  }
];

export default function BotanySeriesHome() {
  const { currentUser, logout } = useAuth();

  // Data states
  const [settings, setSettings] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'syllabus' | 'schedule' | 'pricing'

  // Search & Filter
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [activeUnitAccordion, setActiveUnitAccordion] = useState({ unit_1: true });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPendingAction, setAuthPendingAction] = useState(null); // 'cbt_demo' | 'checkout_full' | 'checkout_unit'
  const [showCbtEngine, setShowCbtEngine] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedSettings, loadedSyllabus, loadedSchedule] = await Promise.all([
          getBotanySettings(),
          getBotanySyllabus(),
          getBotanySchedule()
        ]);
        setSettings(loadedSettings);
        setSyllabus(loadedSyllabus);
        setSchedule(loadedSchedule);
      } catch (err) {
        console.error('Failed to load Botany Series portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'EARLYBIRD') {
      setDiscountApplied(300);
      setCouponMessage('Coupon EARLYBIRD applied! ₹300 discount unlocked.');
    } else {
      setCouponMessage('Invalid or expired coupon code.');
    }
  }

  function handleEnrollClick(planType = 'full_series') {
    if (!currentUser) {
      setAuthPendingAction(planType);
      setShowAuthModal(true);
      return;
    }
    executeCheckout(currentUser, planType);
  }

  function handleDemoCbtClick() {
    if (!currentUser) {
      setAuthPendingAction('cbt_demo');
      setShowAuthModal(true);
      return;
    }
    setShowCbtEngine(true);
  }

  function handleAuthSuccess(user) {
    if (authPendingAction === 'cbt_demo') {
      setShowCbtEngine(true);
    } else if (authPendingAction === 'full_series') {
      executeCheckout(user, 'full_series');
    }
    setAuthPendingAction(null);
  }

  function executeCheckout(user, planType) {
    const basePrice = settings?.fullSeriesPrice || 1499;
    const finalAmount = Math.max(1, basePrice - discountApplied);

    initiateRazorpayPayment({
      planType,
      planTitle: 'Botany Assistant Professor Entrance Test Series (35 Tests)',
      amountInINR: finalAmount,
      user,
      razorpayKeyId: settings?.razorpayKey,
      onSuccess: (subRecord) => {
        setEnrollSuccessMessage(`Enrollment confirmed! Subscription ID: ${subRecord.subscriptionId}. Your official receipt and access credentials have been recorded.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onFailure: (err) => {
        alert(err.message || 'Payment could not be completed.');
      }
    });
  }

  const basePrice = settings?.fullSeriesPrice || 1499;
  const originalPrice = settings?.originalPrice || 2499;
  const finalPrice = Math.max(1, basePrice - discountApplied);

  const filteredSyllabus = syllabus.filter(u => {
    if (!syllabusSearch.trim()) return true;
    const q = syllabusSearch.toLowerCase();
    return u.title.toLowerCase().includes(q) || u.subunits?.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="botany-portal-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-spinner" style={{ width: 36, height: 36 }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Botany Examination Suite...</p>
      </div>
    );
  }

  return (
    <div className="botany-portal-page">
      {/* Top Navbar */}
      <header className="cbt-topbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="cbt-topbar-left">
          <a href="/" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> <span>Back to NexLifTech</span>
          </a>
          <div className="cbt-test-info">
            <h2>Botany Assistant Professor Entrance Examination</h2>
            <span>PSC Entrance Examination Suite 2026</span>
          </div>
        </div>

        <div className="cbt-topbar-right">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentUser.displayName || currentUser.email}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={logout} title="Sign Out">
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => { setAuthPendingAction(null); setShowAuthModal(true); }}
            >
              <UserCheck size={14} /> <span>Student Sign In</span>
            </button>
          )}
        </div>
      </header>

      <main className="botany-container">
        {enrollSuccessMessage && (
          <div className="botany-modal-alert success" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
            <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                🎉 Congratulations! You are successfully enrolled.
              </strong>
              <span>{enrollSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <section className="botany-hero-card">
          <div className="botany-badge-pill">
            <Sparkles size={14} />
            <span>Target PSC Entrance 2026 • Computer-Based Test (CBT) Portal</span>
          </div>

          <h1 className="botany-hero-title">
            Botany Assistant Professor <span className="text-gradient">Entrance Examination</span> Test Series
          </h1>

          <p className="botany-hero-subtitle">
            Comprehensive 35-Test Calendar covering all 10 PSC Units, ~2,700 High-Yield Questions, Full-Length Mocks &amp; In-Depth Option-by-Option Scientific Analysis.
          </p>

          {/* Academic Direction & Service Attribution */}
          <div className="botany-attributions-bar">
            <div className="attribution-item">
              <div className="attribution-avatar">DA</div>
              <div className="attribution-text">
                <span className="attribution-role">Academic Direction &amp; Content</span>
                <span className="attribution-name">Dr. Aubid Ahmad</span>
                <span className="attribution-desc">Assistant Professor (Botany)</span>
              </div>
            </div>

            <div style={{ width: '1px', background: 'var(--border-light)' }}></div>

            <div className="attribution-item">
              <div className="attribution-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>SG</div>
              <div className="attribution-text">
                <span className="attribution-role">Engineering, CBT &amp; Deployment</span>
                <span className="attribution-name">Sheikh Gulfam / NexLifTech</span>
                <span className="attribution-desc">Lecturer Botany | CSIR NET-JRF | MSc Data Science Scholar</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => handleEnrollClick('full_series')}
            >
              <span>Enroll in Full Test Series</span>
              <ArrowRight size={16} />
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleDemoCbtClick}
            >
              <Play size={14} className="accent-icon" />
              <span>Launch Diagnostic Demo CBT (Free)</span>
            </button>
          </div>
        </section>

        {/* Key Metrics */}
        <div className="botany-metrics-grid">
          <div className="botany-metric-card">
            <span className="metric-card-val">10</span>
            <span className="metric-card-label">Syllabus Units</span>
            <span className="metric-card-sub">Microbiology to Biostats</span>
          </div>

          <div className="botany-metric-card">
            <span className="metric-card-val">35</span>
            <span className="metric-card-label">Scheduled Tests</span>
            <span className="metric-card-sub">Unit Tests, Clusters &amp; 9 Mocks</span>
          </div>

          <div className="botany-metric-card">
            <span className="metric-card-val">~2,700</span>
            <span className="metric-card-label">High-Yield Questions</span>
            <span className="metric-card-sub">Exam Difficulty &amp; Numericals</span>
          </div>

          <div className="botany-metric-card">
            <span className="metric-card-val">100%</span>
            <span className="metric-card-label">Option Analysis</span>
            <span className="metric-card-sub">Why A is right, B/C/D wrong</span>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="botany-portal-tabs">
          <button 
            className={`botany-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Sparkles size={16} /> <span>Features &amp; Highlights</span>
          </button>
          <button 
            className={`botany-tab-btn ${activeTab === 'syllabus' ? 'active' : ''}`}
            onClick={() => setActiveTab('syllabus')}
          >
            <BookOpen size={16} /> <span>10-Unit Syllabus Explorer</span>
          </button>
          <button 
            className={`botany-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={16} /> <span>35-Test Calendar</span>
          </button>
          <button 
            className={`botany-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <Tag size={16} /> <span>Enrollment &amp; Pricing</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="botany-card">
              <div className="botany-card-header">
                <h3>Designed for Serious Aspirants of Assistant Professor Entrance</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="subunit-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>NTA/PSC Pattern CBT Interface</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Real-time countdown timer, question palette (Answered, Marked for Review, Unattempted), and question jumping to build authentic test temperament.
                  </p>
                </div>

                <div className="subunit-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>Option-by-Option Breakdown</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Unlike ordinary test series that give one-line answers, our engine explains exactly why the right option is correct, and why every other distractor is false.
                  </p>
                </div>

                <div className="subunit-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                    <strong style={{ color: 'var(--text-primary)' }}>Cluster &amp; Remediation Tests</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    5 multi-unit cluster tests, J&amp;K Himalayan flora specials, rapid-fire numerical drills (Genetics, Ecology, Biostatistics), and personalized weak-topic retests.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Preview Box */}
            <div className="botany-card" style={{ background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Try the Diagnostic CBT Simulation Right Now
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Experience the examination environment, test timer, and detailed option analysis firsthand.
                  </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleDemoCbtClick}>
                  <Play size={14} /> <span>Start Free Sample Test</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYLLABUS */}
        {activeTab === 'syllabus' && (
          <div className="botany-card">
            <div className="botany-card-header">
              <div>
                <h3>Official PSC Entrance Syllabus (10 Units)</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Organized by Sheikh Gulfam for Public Service Commission examination.
                </p>
              </div>
            </div>

            <div className="syllabus-search-bar">
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Search size={16} className="input-icon" />
                <input 
                  type="text" 
                  className="syllabus-search-input"
                  placeholder="Search syllabus topics (e.g. CaMV, Sporne, APG-IV, Operon, Glycolysis, IUCN, CRISPR)..."
                  value={syllabusSearch}
                  onChange={(e) => setSyllabusSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="syllabus-units-list">
              {filteredSyllabus.map(unit => {
                const isOpen = !!activeUnitAccordion[unit.unitId];
                return (
                  <div key={unit.unitId} className="syllabus-unit-item">
                    <button 
                      type="button" 
                      className="syllabus-unit-trigger"
                      onClick={() => setActiveUnitAccordion(prev => ({ ...prev, [unit.unitId]: !prev[unit.unitId] }))}
                    >
                      <div className="syllabus-unit-trigger-left">
                        <span className="unit-number-badge">U{unit.unitNumber}</span>
                        <span>Unit-{unit.unitNumber}: {unit.title}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {unit.subunits?.length || 0} Subunits {isOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="syllabus-unit-body">
                        <div className="subunits-grid">
                          {unit.subunits?.map(s => (
                            <div key={s.id} className="subunit-card">
                              <div className="subunit-title">{s.title}</div>
                              <p className="subunit-desc">{s.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="botany-card">
            <div className="botany-card-header">
              <div>
                <h3>Day-by-Day 35-Test Examination Calendar</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Paced every second day to allow thorough post-test error analysis.
                </p>
              </div>
            </div>

            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Date &amp; Day</th>
                    <th>Test Name</th>
                    <th>Type</th>
                    <th>Coverage</th>
                    <th>Format</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t.dayLabel}</td>
                      <td>
                        <strong>{t.title}</strong>
                        {t.description && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="schedule-badge badge-unit">{t.category}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.unitCovered}</td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {t.questionCount > 0 ? `${t.questionCount} Q, ${t.durationMinutes} min` : 'Strategy & Rest'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PRICING & ENROLLMENT */}
        {activeTab === 'pricing' && (
          <div className="botany-pricing-grid">
            {/* Full Series Pass */}
            <div className="pricing-pack-card popular">
              <span className="popular-badge">Complete Package</span>
              <h3 className="pricing-plan-name">Full 35-Test Series Pass</h3>
              <p className="pricing-plan-desc">
                Complete access to all Diagnostic, 10 Unit Tests, 5 Clusters, Numericals, PYQs, and 9 Grand Mocks.
              </p>

              <div className="pricing-amount-row">
                <span className="pricing-final-price">₹{finalPrice}</span>
                <span className="pricing-strike-price">₹{originalPrice}</span>
                {discountApplied > 0 && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                    (₹{discountApplied} OFF)
                  </span>
                )}
              </div>

              <div className="coupon-input-box">
                <input 
                  type="text" 
                  className="coupon-input"
                  placeholder="Coupon (e.g. EARLYBIRD)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMessage && (
                <div style={{ fontSize: '0.78rem', color: discountApplied > 0 ? '#10b981' : '#ef4444', marginBottom: '1rem' }}>
                  {couponMessage}
                </div>
              )}

              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>All 35 Computer-Based Simulation Tests (~2,700 questions)</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>Option-by-option scientific explanation for every MCQ</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>9 Full-Length Mocks calibrated to actual PSC Entrance level</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>Personalized weak-area remediation &amp; numerical recall drills</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>Instant Razorpay activation with automated confirmation email</span>
                </li>
              </ul>

              <button 
                type="button" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={() => handleEnrollClick('full_series')}
              >
                <span>Enroll in Full Test Series</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Unit-Wise Flexi Pass */}
            <div className="pricing-pack-card">
              <h3 className="pricing-plan-name">Unit-Wise Individual Test</h3>
              <p className="pricing-plan-desc">
                Target specific units (e.g., Cytology, Lower Plants, or Physiology) on an individual test basis.
              </p>

              <div className="pricing-amount-row">
                <span className="pricing-final-price">₹{settings?.unitWisePrice || 199}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ per unit test</span>
              </div>

              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>50 High-Yield questions for the chosen single PSC unit</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>Option-by-option scientific analysis &amp; review</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>60 Minutes timed examination simulation</span>
                </li>
                <li className="pricing-feature-item">
                  <CheckCircle2 size={16} className="feature-check-icon" />
                  <span>Upgrade to full series anytime with price adjustment</span>
                </li>
              </ul>

              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={() => handleEnrollClick('unit_pass')}
              >
                <span>Select Unit &amp; Enroll</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Student Auth Modal */}
      <StudentAuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* CBT Simulator Fullscreen Modal */}
      {showCbtEngine && (
        <StudentExamEngine 
          testData={{
            title: 'Diagnostic Entrance Assessment Demo',
            unitCovered: 'Unit 1 & Lower Plants High-Yield Sample',
            durationMinutes: 10
          }}
          questions={DEMO_QUESTIONS}
          onClose={() => setShowCbtEngine(false)}
        />
      )}
    </div>
  );
}
