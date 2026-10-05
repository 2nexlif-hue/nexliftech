import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, Play, 
  ArrowRight, Tag, Sparkles, UserCheck, LogOut, ArrowLeft, Search, 
  GraduationCap, Lock, Clock, ShieldCheck, Award, HelpCircle, 
  ChevronDown, ChevronUp, Zap, Check, AlertCircle, FileText, X, Star, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getBotanySettings, getBotanySyllabus, getBotanySchedule } from '../../utils/botanyFirestoreService';
import { initiateRazorpayPayment } from '../../utils/razorpayService';
import StudentAuthModal from './StudentAuthModal';
import StudentExamEngine from './StudentExamEngine';
import LogoSVG from '../Logo';
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
    optionD: 'Phospholipids with glycerol-3-phosphate backbone',
    correctOption: 'B',
    analysisA: 'Incorrect. Ester-linked unbranched fatty acids are characteristic of Eubacteria and Eukarya, not Archaea.',
    analysisB: 'Correct. Archaebacteria possess ether linkages connecting glycerol to branched isopranyl chains (phytanyl/biphytanyl), conferring extreme stability.',
    analysisC: 'Incorrect. Archaebacteria lack true peptidoglycan and muramic acid; their cell walls contain pseudomurein or S-layers.',
    analysisD: 'Incorrect. Archaea utilize glycerol-1-phosphate (G1P) backbones, whereas Eubacteria and Eukarya utilize glycerol-3-phosphate (G3P).',
    referenceNote: 'Biphytanyl tetraether monolayers allow hyperthermophilic archaea like Sulfolobus to resist thermal denaturation at >90°C.'
  },
  {
    id: 'demo_3',
    question: 'Heterokaryosis in fungi was first demonstrated by which researcher in 1912?',
    optionA: 'A.F. Blakeslee',
    optionB: 'H.N. Hansen',
    optionC: 'H. Burgeff',
    optionD: 'G. Pontecorvo',
    correctOption: 'C',
    analysisA: 'Incorrect. Blakeslee discovered heterothallism in Mucorales in 1904, not heterokaryosis.',
    analysisB: 'Incorrect. Hansen and Smith demonstrated the dual phenomenon in imperfect fungi in 1932.',
    analysisC: 'Correct. Hans Burgeff first demonstrated heterokaryosis in Phycomyces nitens in 1912.',
    analysisD: 'Incorrect. Guido Pontecorvo discovered the parasexual cycle in Aspergillus nidulans in 1953.',
    referenceNote: 'Heterokaryosis allows genetically distinct nuclei to coexist within a shared cytoplasm.'
  },
  {
    id: 'demo_4',
    question: 'The causal organism of White Blister (White Rust) of crucifers belongs to which of the following taxonomic orders?',
    optionA: 'Peronosporales',
    optionB: 'Albuginales',
    optionC: 'Erysiphales',
    optionD: 'Uredinales',
    correctOption: 'B',
    analysisA: 'Incorrect. Historically Albugo was placed in Peronosporaceae, but molecular phylogenetics segregated it into the distinct family Albuginaceae (order Albuginales).',
    analysisB: 'Correct. Albugo candida is classified under the order Albuginales within Oomycota.',
    analysisC: 'Incorrect. Erysiphales comprises the powdery mildews (Ascomycota).',
    analysisD: 'Incorrect. Uredinales (Pucciniales) comprises the true rust fungi (Basidiomycota).',
    referenceNote: 'Albugo forms prominent sub-epidermal conidial sorus crusts with crustotheca-like white pustules.'
  },
  {
    id: 'demo_5',
    question: 'Which of the following extinct fossil pteridophytes exhibited naked dichotomously branched aerial axes with terminal fusiform sporangia and no leaves or true roots?',
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

const FAQ_ITEMS = [
  {
    q: 'How many tests are included in the Full Series Pass?',
    a: 'The Full 35-Test Series Pass gives you complete access to all 35 scheduled computer-based simulation tests: 10 Unit Tests (50 MCQs each), 5 Multi-Unit Cluster Tests (60 MCQs each), 11 Special & PYQ Drills, and 9 Full-Length Grand Mocks (100 MCQs each, calibrated strictly to actual PSC entrance difficulty).'
  },
  {
    q: 'Why is option-by-option scientific rationale so crucial?',
    a: 'Unlike ordinary books or online platforms that only give one-word answers or brief one-line hints, our CBT engine explains why the right option is correct AND why each of the 3 distractors is false. This trains your diagnostic elimination skills for tricky PSC negative marking.'
  },
  {
    q: 'Is negative marking simulated in the tests?',
    a: 'Yes, exactly according to official PSC guidelines: +1.00 mark for every correct answer, -0.25 mark penalty for every wrong answer, and 0 for unattempted questions.'
  },
  {
    q: 'Can I take the tests on mobile or tablet?',
    a: 'Yes, 100%. The CBT testing interface is fully responsive across mobile phones, tablets, laptops, and desktop computers.'
  },
  {
    q: 'How long will my test access remain valid?',
    a: 'Your access remains active with unlimited review and re-attempt capability until the completion of the J&K PSC Assistant Professor Botany Examination 2026.'
  },
  {
    q: 'How does payment activation work?',
    a: 'Payments are processed securely via Razorpay (UPI, Google Pay, PhonePe, Paytm, Cards, NetBanking). Your subscription and access credentials activate immediately upon payment.'
  }
];

export default function BotanySeriesHome() {
  const { currentUser, userProfile, logout } = useAuth();

  const emailLower = currentUser?.email?.toLowerCase().trim() || '';
  const isFacultyAdmin = (
    emailLower === 'e.educational.24@gmail.com' ||
    emailLower === 'admin@nexliftech.com' ||
    emailLower === 'sheikhgulfam91@gmail.com' ||
    userProfile?.role === 'botany_admin' ||
    userProfile?.role === 'admin'
  );

  // Data states
  const [settings, setSettings] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Explorer Tab: 'schedule' | 'syllabus' | 'features' | 'faq'
  const [explorerTab, setExplorerTab] = useState('schedule');

  // Search & Filters
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all' | 'unit' | 'cluster' | 'mock' | 'special'
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [activeUnitAccordion, setActiveUnitAccordion] = useState({ unit_1: true });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Unit-Wise Pass selection
  const [selectedUnitForPass, setSelectedUnitForPass] = useState('unit_1');
  const [showUnitSelectorModal, setShowUnitSelectorModal] = useState(false);

  // FAQ accordion
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPendingAction, setAuthPendingAction] = useState(null); // 'cbt_demo' | 'full_series' | 'unit_pass'
  const [showCbtEngine, setShowCbtEngine] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('');

  const pricingSectionRef = useRef(null);

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

  function scrollToPricing() {
    if (pricingSectionRef.current) {
      pricingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'EARLYBIRD') {
      setDiscountApplied(300);
      setCouponMessage('🎉 Coupon EARLYBIRD applied! ₹300 discount unlocked.');
    } else {
      setCouponMessage('❌ Invalid or expired coupon code.');
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
    } else if (authPendingAction === 'full_series' || authPendingAction === 'unit_pass') {
      executeCheckout(user, authPendingAction);
    }
    setAuthPendingAction(null);
  }

  function executeCheckout(user, planType) {
    let basePrice = 1499;
    let planTitle = 'Botany Assistant Professor Entrance Test Series (35 Tests)';

    if (planType === 'unit_pass') {
      basePrice = settings?.unitWisePrice || 199;
      const unitObj = syllabus.find(u => u.unitId === selectedUnitForPass);
      const unitName = unitObj ? unitObj.title : selectedUnitForPass;
      planTitle = `Botany PSC Test Series - Unit Pass (${unitName})`;
    } else {
      basePrice = settings?.fullSeriesPrice || 1499;
    }

    const finalAmount = Math.max(1, basePrice - (planType === 'full_series' ? discountApplied : 0));

    initiateRazorpayPayment({
      planType,
      planTitle,
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
  const unitPrice = settings?.unitWisePrice || 199;

  // Filtered Schedule
  const filteredSchedule = schedule.filter(test => {
    // Type filter
    if (scheduleFilter === 'unit' && !test.testNumber.startsWith('T') && !test.title.toLowerCase().includes('unit')) return false;
    if (scheduleFilter === 'cluster' && !test.title.toLowerCase().includes('cluster')) return false;
    if (scheduleFilter === 'mock' && !test.title.toLowerCase().includes('grand mock') && !test.title.toLowerCase().includes('mock')) return false;
    if (scheduleFilter === 'special' && (test.title.toLowerCase().includes('unit') || test.title.toLowerCase().includes('cluster') || test.title.toLowerCase().includes('grand mock'))) return false;

    // Search filter
    if (!scheduleSearch.trim()) return true;
    const q = scheduleSearch.toLowerCase();
    return (
      test.title?.toLowerCase().includes(q) ||
      test.unitCovered?.toLowerCase().includes(q) ||
      test.testNumber?.toLowerCase().includes(q)
    );
  });

  // Filtered Syllabus
  const filteredSyllabus = syllabus.filter(u => {
    if (!syllabusSearch.trim()) return true;
    const q = syllabusSearch.toLowerCase();
    return (
      u.title?.toLowerCase().includes(q) ||
      u.shortTitle?.toLowerCase().includes(q) ||
      u.subunits?.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="botany-loading-screen">
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
          <a href="/" className="cbt-brand-back">
            <LogoSVG size={22} />
            <span className="cbt-brand-text">NexLifTech</span>
            <span className="cbt-brand-dot">.</span>
          </a>
          <span className="cbt-top-divider">/</span>
          <span className="cbt-topbar-title">Botany Assistant Professor CBT Suite</span>
        </div>

        <div className="cbt-topbar-right">
          {currentUser ? (
            <div className="cbt-user-actions-bar">
              {isFacultyAdmin && (
                <a 
                  href="/admin/dashboard?workspace=botany" 
                  className="btn btn-secondary btn-sm cbt-faculty-btn" 
                  title="Faculty Portal"
                >
                  <GraduationCap size={14} /> <span className="cbt-btn-text">Faculty Suite</span>
                </a>
              )}
              <div className="cbt-user-badge" title={currentUser.displayName || currentUser.email}>
                <div className="cbt-avatar-circle">
                  {(currentUser.displayName || currentUser.email || 'S')[0].toUpperCase()}
                </div>
                <span className="cbt-user-email-text">
                  {currentUser.displayName || currentUser.email}
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm cbt-logout-btn" 
                onClick={logout} 
                title="Sign Out"
              >
                <LogOut size={13} /> <span className="cbt-btn-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="cbt-guest-actions-bar">
              <button 
                type="button" 
                className="btn btn-primary btn-sm cbt-signin-btn"
                onClick={() => { setAuthPendingAction(null); setShowAuthModal(true); }}
              >
                <UserCheck size={14} /> <span>Student Sign In</span>
              </button>
              <a 
                href="/admin/login" 
                className="btn btn-secondary btn-sm cbt-admin-btn"
                title="Unified Portal Login"
              >
                <Lock size={13} /> <span>Admin</span>
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="botany-container">
        {enrollSuccessMessage && (
          <div className="botany-modal-alert success" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '10px' }}>
            <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                🎉 Congratulations! You are successfully enrolled.
              </strong>
              <span style={{ fontSize: '0.84rem' }}>{enrollSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* 1. HIGH-IMPACT TEST SERIES HERO SECTION */}
        <section className="botany-hero-test-card">
          <div className="hero-test-header-row">
            <div className="hero-exam-badge">
              <span className="exam-pulse-beacon" />
              <span>PSC ENTRANCE 2026 • OFFICIAL CBT TEST SERIES</span>
            </div>
            <div className="hero-curator-tag">
              <GraduationCap size={15} className="curator-icon" />
              <span><strong>Curated by:</strong> Dr. Aubid Ahmad (Assistant Professor)</span>
              <span className="tag-divider">•</span>
              <span className="platform-tag">NexLifTech Engine</span>
            </div>
          </div>

          <div className="hero-test-main-content">
            <h1 className="hero-test-title">
              Botany Assistant Professor <span className="text-gradient">Entrance Examination</span> Test Series
            </h1>
            <p className="hero-test-desc">
              High-stakes Computer-Based Testing (CBT) platform engineered for Botany PSC aspirants. Master the entire 10-unit syllabus with 35 scheduled tests, ~2,700 questions, negative marking calibration (-0.25), and comprehensive option-by-option scientific analysis.
            </p>

            <div className="hero-test-cta-bar">
              <button 
                type="button" 
                className="btn btn-primary hero-enroll-btn"
                onClick={scrollToPricing}
              >
                <Zap size={16} />
                <span>View Plans &amp; Enroll Now — ₹{finalPrice}</span>
                <ArrowRight size={15} />
              </button>
              <button 
                type="button" 
                className="btn btn-secondary hero-demo-btn"
                onClick={handleDemoCbtClick}
              >
                <Play size={14} className="accent-play-icon" />
                <span>Take Free Diagnostic Demo CBT (5 MCQs)</span>
              </button>
            </div>
          </div>

          {/* 4 Core Examination Metrics Bar */}
          <div className="hero-test-metrics-grid">
            <div className="test-metric-cell">
              <div className="metric-num">10</div>
              <div className="metric-lbl">PSC Units Covered</div>
            </div>
            <div className="metric-divider" />
            <div className="test-metric-cell">
              <div className="metric-num">35</div>
              <div className="metric-lbl">Scheduled Tests</div>
            </div>
            <div className="metric-divider" />
            <div className="test-metric-cell">
              <div className="metric-num">~2,700</div>
              <div className="metric-lbl">Target Questions</div>
            </div>
            <div className="metric-divider" />
            <div className="test-metric-cell">
              <div className="metric-num">100%</div>
              <div className="metric-lbl">Option Scientific Rationale</div>
            </div>
          </div>
        </section>

        {/* 2. PROMINENT & UN-HIDDEN PLANS & PRICING SECTION */}
        <section ref={pricingSectionRef} className="botany-pricing-showcase-section" id="pricing-plans">
          <div className="section-title-wrap text-center">
            <div className="sub-badge-pill">
              <Tag size={13} />
              <span>TRANSPARENT CANDIDATE ENROLLMENT PLANS</span>
            </div>
            <h2 className="section-heading">Choose Your Test Series Package</h2>
            <p className="section-subtext">
              Instant activation via secure Razorpay checkout. Immediate access to test calendar, PDF keys, and diagnostic CBT analysis.
            </p>
          </div>

          <div className="botany-pricing-cards-container">
            {/* Card 1: Complete 35-Test Series Master Pass (Highlighted) */}
            <div className="pricing-card-box featured-pass">
              <div className="featured-ribbon">
                <Star size={13} fill="#fff" />
                <span>MOST POPULAR • ALL-INCLUSIVE</span>
              </div>

              <div className="p-card-header">
                <span className="p-plan-badge">Complete 10-Unit PSC Prep</span>
                <h3 className="p-plan-title">Full 35-Test Series Pass</h3>
                <p className="p-plan-summary">
                  Complete preparation package: 10 Unit Tests, 5 Multi-Unit Clusters, Numericals, PYQs &amp; 9 Full-Length Grand Mocks.
                </p>
              </div>

              <div className="p-price-container">
                <div className="p-amount-row">
                  <span className="p-currency">₹</span>
                  <span className="p-value">{finalPrice}</span>
                  <span className="p-original">₹{originalPrice}</span>
                  <span className="p-discount-tag">40% OFF</span>
                </div>
                <span className="p-validity-note">Valid until PSC Examination 2026 • Unlimited Re-attempts</span>
              </div>

              {/* Coupon Applicator */}
              <div className="p-coupon-bar">
                <input 
                  type="text" 
                  className="p-coupon-input"
                  placeholder="Have coupon? (e.g. EARLYBIRD)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="button" className="p-coupon-btn" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMessage && (
                <div className={`p-coupon-msg ${discountApplied > 0 ? 'success' : 'error'}`}>
                  {couponMessage}
                </div>
              )}

              <ul className="p-features-checklist">
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>All 35 CBT Tests</strong> (~2,700 questions across 10 PSC units)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Option-by-Option Rationale</strong> (explains why correct &amp; why distractors fail)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>9 Full-Length Grand Mocks</strong> (calibrated to actual PSC difficulty)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Negative Marking Simulation</strong> (+1.00 / -0.25 penalty calibration)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Instant Razorpay Activation</strong> with email confirmation &amp; receipt</span>
                </li>
              </ul>

              <button 
                type="button" 
                className="btn btn-primary p-enroll-action-btn"
                onClick={() => handleEnrollClick('full_series')}
              >
                <span>Enroll in Full Test Series — ₹{finalPrice}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Card 2: Unit-Wise Flexi Pass */}
            <div className="pricing-card-box flexi-pass">
              <div className="p-card-header">
                <span className="p-plan-badge flexi">Targeted Practice</span>
                <h3 className="p-plan-title">Unit-Wise Individual Test</h3>
                <p className="p-plan-summary">
                  Target specific units (e.g. Cytology, Physiology, or Plant Pathology) with high-yield modular tests.
                </p>
              </div>

              <div className="p-price-container">
                <div className="p-amount-row">
                  <span className="p-currency">₹</span>
                  <span className="p-value">{unitPrice}</span>
                  <span className="p-period">/ per single unit test</span>
                </div>
                <span className="p-validity-note">Upgrade to Full Series anytime with 100% price adjustment credit</span>
              </div>

              {/* Unit Selector */}
              <div className="p-unit-select-box">
                <label className="p-select-label">Choose Target Unit:</label>
                <select 
                  className="p-unit-dropdown"
                  value={selectedUnitForPass}
                  onChange={(e) => setSelectedUnitForPass(e.target.value)}
                >
                  {syllabus.map(u => (
                    <option key={u.unitId} value={u.unitId}>
                      Unit {u.unitNumber}: {u.shortTitle || u.title}
                    </option>
                  ))}
                </select>
              </div>

              <ul className="p-features-checklist">
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>50 High-Yield MCQs</strong> for chosen single unit</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>60 Minutes</strong> authentic timed examination mode</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Full Option Analysis</strong> with scientific literature references</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Weak-Topic Diagnostic Score</strong> &amp; speed analysis</span>
                </li>
              </ul>

              <button 
                type="button" 
                className="btn btn-secondary p-enroll-action-btn"
                onClick={() => handleEnrollClick('unit_pass')}
              >
                <span>Enroll in Chosen Unit — ₹{unitPrice}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Card 3: Free Diagnostic Entrance CBT Demo */}
            <div className="pricing-card-box demo-pass">
              <div className="p-card-header">
                <span className="p-plan-badge free">100% Free Sample</span>
                <h3 className="p-plan-title">Diagnostic Demo CBT</h3>
                <p className="p-plan-summary">
                  Experience the actual test engine, live timer, negative marking, and option rationale firsthand with 0 payment.
                </p>
              </div>

              <div className="p-price-container">
                <div className="p-amount-row">
                  <span className="p-free-text">FREE</span>
                  <span className="p-period">/ No Credit Card Required</span>
                </div>
                <span className="p-validity-note">Instant 1-Click Launch • Real Simulation Engine</span>
              </div>

              <div className="p-demo-preview-pill">
                <span className="demo-pill-title">Includes 5 High-Yield Sample Questions:</span>
                <span className="demo-pill-topics">CaMV Pararetrovirus • Archaeal Lipids • Burgeff Heterokaryosis • Albugo • Rhynia</span>
              </div>

              <ul className="p-features-checklist">
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Authentic CBT Simulation</strong> with countdown timer</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Question Palette</strong> (Answered, Flagged, Unattempted)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="p-check-icon" />
                  <span><strong>Instant Results Report</strong> with full scientific rationale</span>
                </li>
              </ul>

              <button 
                type="button" 
                className="btn btn-secondary p-enroll-action-btn demo-btn"
                onClick={handleDemoCbtClick}
              >
                <Play size={15} />
                <span>Launch Free Demo CBT Test</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE LIVE CBT SIMULATOR PREVIEW BANNER */}
        <section className="botany-cbt-preview-banner">
          <div className="cbt-banner-left">
            <div className="cbt-banner-badge">
              <Clock size={14} />
              <span>BUILT FOR AUTHENTIC TEST TEMPERAMENT</span>
            </div>
            <h2>Experience the Computer-Based Testing Interface</h2>
            <p>
              Test anxiety and negative marking penalties cost candidates valuable marks. Our examination engine mimics the exact NTA/PSC user interface with live countdown timers, question jumping palette, review flags, and detailed post-test diagnostics.
            </p>
            <div className="cbt-feature-pills">
              <span>⏱️ Real-Time Countdown Timer</span>
              <span>🏷️ Flag &amp; Review Later</span>
              <span>📉 -0.25 Negative Marking Simulation</span>
              <span>🔬 Option-by-Option Breakdown</span>
            </div>
          </div>
          <div className="cbt-banner-right">
            <div className="cbt-mock-window">
              <div className="mock-window-topbar">
                <div className="mock-dots"><span /><span /><span /></div>
                <div className="mock-timer-display">⏱️ 00:09:45</div>
              </div>
              <div className="mock-window-content">
                <span className="mock-q-meta">Q. 1 of 5 • Microbiology &amp; Lower Plants</span>
                <p className="mock-q-text">
                  Which plant virus possesses a circular dsDNA genome with 3 site-specific discontinuities (pararetrovirus)?
                </p>
                <div className="mock-options-group">
                  <div className="mock-opt">A) Tobacco Mosaic Virus (TMV)</div>
                  <div className="mock-opt active">B) Cauliflower Mosaic Virus (CaMV) ✓</div>
                  <div className="mock-opt">C) Turnip Yellow Mosaic Virus (TYMV)</div>
                  <div className="mock-opt">D) Potato Virus X (PVX)</div>
                </div>
                <button type="button" className="mock-launch-btn" onClick={handleDemoCbtClick}>
                  <Play size={13} /> Try Full Simulation Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TABBED EXPLORER FOR DETAILED EXAMINATION CONTENT */}
        <section className="botany-deep-explorer-section">
          {/* Sticky Tab Navigation Bar */}
          <div className="botany-subnav-tabs">
            <button 
              className={`subnav-tab-btn ${explorerTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setExplorerTab('schedule')}
            >
              <Calendar size={16} />
              <span>35-Test Scheduled Calendar</span>
              <span className="tab-pill-count">{schedule.length || 35}</span>
            </button>

            <button 
              className={`subnav-tab-btn ${explorerTab === 'syllabus' ? 'active' : ''}`}
              onClick={() => setExplorerTab('syllabus')}
            >
              <BookOpen size={16} />
              <span>10-Unit Syllabus &amp; Blueprint</span>
              <span className="tab-pill-count">{syllabus.length || 10}</span>
            </button>

            <button 
              className={`subnav-tab-btn ${explorerTab === 'features' ? 'active' : ''}`}
              onClick={() => setExplorerTab('features')}
            >
              <Sparkles size={16} />
              <span>CBT Platform Features</span>
            </button>

            <button 
              className={`subnav-tab-btn ${explorerTab === 'faq' ? 'active' : ''}`}
              onClick={() => setExplorerTab('faq')}
            >
              <HelpCircle size={16} />
              <span>Candidate FAQs</span>
            </button>
          </div>

          {/* TAB CONTENT: 35-TEST CALENDAR */}
          {explorerTab === 'schedule' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Official 35-Test Calendar &amp; Schedule</h3>
                  <p>Comprehensive progression: 10 Unit Tests → 5 Multi-Unit Clusters → 11 PYQ/Specials → 9 Grand Mocks.</p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={scrollToPricing}>
                  <span>Enroll in All Tests</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Filter controls */}
              <div className="schedule-filter-controls">
                <div className="schedule-pill-filters">
                  <button 
                    type="button" 
                    className={`filter-pill-btn ${scheduleFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setScheduleFilter('all')}
                  >
                    All Tests ({schedule.length})
                  </button>
                  <button 
                    type="button" 
                    className={`filter-pill-btn ${scheduleFilter === 'unit' ? 'active' : ''}`}
                    onClick={() => setScheduleFilter('unit')}
                  >
                    10 Unit Tests
                  </button>
                  <button 
                    type="button" 
                    className={`filter-pill-btn ${scheduleFilter === 'cluster' ? 'active' : ''}`}
                    onClick={() => setScheduleFilter('cluster')}
                  >
                    5 Cluster Tests
                  </button>
                  <button 
                    type="button" 
                    className={`filter-pill-btn ${scheduleFilter === 'mock' ? 'active' : ''}`}
                    onClick={() => setScheduleFilter('mock')}
                  >
                    9 Grand Mocks
                  </button>
                  <button 
                    type="button" 
                    className={`filter-pill-btn ${scheduleFilter === 'special' ? 'active' : ''}`}
                    onClick={() => setScheduleFilter('special')}
                  >
                    PYQs &amp; Specials
                  </button>
                </div>

                <div className="schedule-search-box">
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search test by title or topic..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Tests Table */}
              <div className="schedule-table-wrapper">
                <table className="schedule-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Test #</th>
                      <th>Test Title &amp; Syllabus Coverage</th>
                      <th style={{ width: '110px' }}>Questions</th>
                      <th style={{ width: '100px' }}>Duration</th>
                      <th style={{ width: '130px' }}>Scheduled Date</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedule.map((t, idx) => (
                      <tr key={t.testId || idx}>
                        <td>
                          <span className="test-code-badge">{t.testNumber || `T-${idx + 1}`}</span>
                        </td>
                        <td>
                          <div className="table-test-info">
                            <span className="t-name">{t.title}</span>
                            <span className="t-coverage">{t.unitCovered}</span>
                          </div>
                        </td>
                        <td>
                          <span className="t-badge-mcq">{t.questionCount || 50} MCQs</span>
                        </td>
                        <td>
                          <span className="t-badge-time">{t.durationMinutes || 60} Mins</span>
                        </td>
                        <td>
                          <span className="t-date-text">{t.scheduledDate || 'Flexible'}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="t-access-tag">Included in Pass</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 10-UNIT SYLLABUS */}
          {explorerTab === 'syllabus' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Official 10-Unit PSC Entrance Syllabus</h3>
                  <p>Curated and cross-referenced with recent Assistant Professor PSC exams.</p>
                </div>
                <div className="syllabus-search-box">
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search topics (e.g. CaMV, Sporne, APG, Glycolysis, CRISPR)..."
                    value={syllabusSearch}
                    onChange={(e) => setSyllabusSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="syllabus-accordions-list">
                {filteredSyllabus.map(unit => {
                  const isOpen = !!activeUnitAccordion[unit.unitId];
                  return (
                    <div key={unit.unitId} className={`syllabus-unit-accordion ${isOpen ? 'open' : ''}`}>
                      <button 
                        type="button" 
                        className="unit-accordion-trigger"
                        onClick={() => setActiveUnitAccordion(prev => ({ ...prev, [unit.unitId]: !prev[unit.unitId] }))}
                      >
                        <div className="unit-trigger-left">
                          <span className="unit-number-pill">Unit {unit.unitNumber}</span>
                          <span className="unit-title-text">{unit.title}</span>
                        </div>
                        <div className="unit-trigger-right">
                          <span className="unit-q-weight">{unit.estimatedQuestions || 50} Target MCQs</span>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="unit-accordion-body">
                          <div className="subunits-grid">
                            {unit.subunits?.map((sub, sIdx) => (
                              <div key={sub.id || sIdx} className="subunit-topic-box">
                                <h4>{sub.title}</h4>
                                <p>{sub.description}</p>
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

          {/* TAB CONTENT: PLATFORM FEATURES */}
          {explorerTab === 'features' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Engineered Specifically for Competitive Examination Success</h3>
                  <p>How NexLifTech CBT Engine prepares you for PSC Assistant Professor examination.</p>
                </div>
              </div>

              <div className="features-showcase-grid">
                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Clock size={22} /></div>
                  <h4>Authentic PSC/NTA Examination Mode</h4>
                  <p>Countdown timer, question jumping palette with color-coded states (Answered, Marked for Review, Not Visited), building true exam-hall confidence.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><BookOpen size={22} /></div>
                  <h4>Option-by-Option Scientific Rationale</h4>
                  <p>Eliminate confusion with detailed rationales explaining why choice A is false, choice B is correct, and choices C &amp; D are misleading distractors.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Zap size={22} /></div>
                  <h4>Negative Marking Calibration (-0.25)</h4>
                  <p>Calibrated negative marking calculates your true percentile score, penalizing blind guesses and teaching strategic question skipping.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Award size={22} /></div>
                  <h4>Multi-Unit Clusters &amp; Grand Mocks</h4>
                  <p>Progressive testing: start with individual units, advance through 5 cross-unit clusters, and finish with 9 full-length PSC Grand Mocks.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: FAQS */}
          {explorerTab === 'faq' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Frequently Asked Questions</h3>
                  <p>Everything you need to know about enrollment, payment, and test series access.</p>
                </div>
              </div>

              <div className="faq-accordions-list">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={idx} className={`faq-item-box ${isOpen ? 'open' : ''}`}>
                      <button 
                        type="button" 
                        className="faq-trigger"
                        onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      >
                        <span className="faq-q-text">{item.q}</span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isOpen && (
                        <div className="faq-answer-body">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 5. BOTTOM ENROLLMENT REMINDER BAR */}
        <section className="botany-bottom-cta-banner">
          <div className="bottom-cta-inner">
            <div>
              <h3>Ready to Elevate Your Assistant Professor PSC Preparation?</h3>
              <p>Enroll in the Full 35-Test Series Pass today at 40% OFF with instant Razorpay activation.</p>
            </div>
            <div className="bottom-cta-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleDemoCbtClick}>
                <Play size={13} /> Try Free Demo
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={scrollToPricing}>
                <span>Enroll in Full Pass — ₹{finalPrice}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Student Authentication Modal */}
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
