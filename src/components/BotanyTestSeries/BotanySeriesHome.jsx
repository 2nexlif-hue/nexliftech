import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, Play, 
  ArrowRight, Tag, Sparkles, UserCheck, LogOut, ArrowLeft, Search, 
  GraduationCap, Lock, Clock, ShieldCheck, Award, HelpCircle, 
  ChevronDown, ChevronUp, Zap, Check, AlertCircle, FileText, X, Star, User, Printer
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getBotanySettings, 
  getBotanySyllabus, 
  getBotanySchedule,
  getAllUnitsQuestionStats,
  getTestQuestionStats,
  getUnitQuestions,
  getUserBotanySubscriptions
} from '../../utils/botanyFirestoreService';
import { initiateRazorpayPayment } from '../../utils/razorpayService';
import { printSubscriptionReceipt } from '../../utils/botanyEmailService';
import { BOTANY_SEED_QUESTION_BANKS } from '../../utils/botanySeedQuestionBanks';
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
    emailLower === '2nexlif@gmail.com' ||
    userProfile?.role === 'botany_admin' ||
    userProfile?.role === 'admin'
  );

  // Data states
  const [settings, setSettings] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [demoQuestions, setDemoQuestions] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('botany_bank_diagnostic_demo');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.questions?.length > 0) return parsed.questions;
        }
      }
    } catch (e) {}
    if (BOTANY_SEED_QUESTION_BANKS && BOTANY_SEED_QUESTION_BANKS['diagnostic_demo']?.questions?.length) {
      return BOTANY_SEED_QUESTION_BANKS['diagnostic_demo'].questions;
    }
    return DEMO_QUESTIONS;
  });
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

  // Modals & Active Test
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPendingAction, setAuthPendingAction] = useState(null); // 'full_series' | 'unit_pass'
  const [showCbtEngine, setShowCbtEngine] = useState(false);
  const [activeTestForCbt, setActiveTestForCbt] = useState(null);
  const [testLaunchLoading, setTestLaunchLoading] = useState(false);
  const [testNotification, setTestNotification] = useState('');
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('');
  const [latestSubscriptionRecord, setLatestSubscriptionRecord] = useState(null);

  // Active pricing plan tab for mobile view: 'full' | 'unit' | 'demo'
  const [activePricingTab, setActivePricingTab] = useState('full');

  // User active subscriptions
  const [userSubscriptions, setUserSubscriptions] = useState([]);

  const tabsNavRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedSettings, loadedSyllabus, loadedSchedule, loadedStats, loadedDemo] = await Promise.all([
          getBotanySettings(),
          getBotanySyllabus(),
          getBotanySchedule(),
          getAllUnitsQuestionStats(),
          getUnitQuestions('diagnostic_demo').catch(() => null)
        ]);
        setSettings(loadedSettings);
        setSyllabus(loadedSyllabus);
        setSchedule(loadedSchedule);
        setQuestionStats(loadedStats);
        if (loadedDemo?.questions?.length > 0) {
          setDemoQuestions(loadedDemo.questions);
        }
      } catch (err) {
        console.error('Failed to load Botany Series portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch subscriptions whenever currentUser changes
  useEffect(() => {
    async function fetchSubs() {
      if (currentUser?.uid) {
        try {
          const subs = await getUserBotanySubscriptions(currentUser.uid);
          setUserSubscriptions(subs);
        } catch (err) {
          console.warn('Could not fetch user subscriptions:', err);
        }
      } else {
        setUserSubscriptions([]);
      }
    }
    fetchSubs();
  }, [currentUser]);

  // Real-time synchronization listener across tabs & admin uploads
  useEffect(() => {
    function handleBankUpdate(e) {
      if (!e?.detail?.unitId || e.detail.unitId === 'diagnostic_demo') {
        if (e?.detail?.newActiveData?.questions?.length) {
          setDemoQuestions(e.detail.newActiveData.questions);
        }
      }
    }
    function handleStorage(e) {
      if (e.key === 'botany_bank_diagnostic_demo' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.questions?.length) setDemoQuestions(parsed.questions);
        } catch (err) {}
      }
    }
    window.addEventListener('botany_bank_updated', handleBankUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('botany_bank_updated', handleBankUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  function scrollToPricing(tab = 'full') {
    if (tab) setActivePricingTab(tab);
    setExplorerTab('pricing');
    setTimeout(() => {
      if (tabsNavRef.current) {
        tabsNavRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
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

  // Access validation: check if candidate has permission for a given test
  const hasFullAccess = Boolean(
    isFacultyAdmin ||
    userProfile?.hasActiveBotanySeries ||
    userSubscriptions.some(s => s.allowedUnits?.includes('all') || s.planType === 'full_series')
  );

  function hasTestAccess(test) {
    if (hasFullAccess) return true;
    // Test 1 (Diagnostic Entrance Demo) is ALWAYS 100% free for all candidates
    if (test.testNumber === 'T-1' || test.id === 'test_01' || test.category === 'Diagnostic Test') {
      return true;
    }
    // Check unit pass access
    const unitMatch = test.unitCovered?.match(/Unit\s*(\d+)/i);
    if (unitMatch) {
      const unitId = `unit_${unitMatch[1]}`;
      return userSubscriptions.some(s => s.allowedUnits?.includes(unitId));
    }
    return false;
  }

  async function handleLaunchTest(test) {
    const isDemo = test.testNumber === 'T-1' || test.id === 'test_01' || test.category === 'Diagnostic Test';

    if (isDemo) {
      // Diagnostic Demo - 30 MCQs instantly available without blocking signin
      try {
        const fresh = await getUnitQuestions('diagnostic_demo');
        if (fresh?.questions?.length > 0) setDemoQuestions(fresh.questions);
      } catch (e) {}

      setActiveTestForCbt({
        id: 'diagnostic_demo',
        testNumber: 'T-1',
        title: test.title || 'Diagnostic Entrance Assessment Demo',
        unitCovered: test.unitCovered || 'All 10 PSC Units',
        durationMinutes: test.durationMinutes || 60,
        questions: demoQuestions
      });
      setShowCbtEngine(true);
      return;
    }

    if (!hasTestAccess(test)) {
      handleUnlockTest(test);
      return;
    }

    // Enrolled candidate or admin: Load test questions
    setTestLaunchLoading(true);
    setTestNotification('');
    try {
      let qList = [];
      const testBank = await getUnitQuestions(test.id || test.testNumber).catch(() => null);
      if (testBank?.questions?.length > 0) {
        qList = testBank.questions;
      } else {
        const unitMatch = test.unitCovered?.match(/Unit\s*(\d+)/i);
        if (unitMatch) {
          const unitId = `unit_${unitMatch[1]}`;
          const unitBank = await getUnitQuestions(unitId).catch(() => null);
          if (unitBank?.questions?.length > 0) {
            qList = unitBank.questions;
          }
        }
      }

      if (qList.length > 0) {
        setActiveTestForCbt({
          id: test.id || test.testNumber,
          testNumber: test.testNumber,
          title: test.title,
          unitCovered: test.unitCovered,
          durationMinutes: test.durationMinutes || 60,
          questions: qList
        });
        setShowCbtEngine(true);
      } else {
        setTestNotification(`The verified question bank for "${test.title}" is currently being populated by faculty (Dr. Aubid Ahmad). Please practice with Unit 1 or the 30-MCQ Diagnostic Demo now!`);
        setTimeout(() => setTestNotification(''), 7000);
      }
    } catch (err) {
      console.error('Error launching test:', err);
      setTestNotification('Could not load test questions. Please check connection and try again.');
      setTimeout(() => setTestNotification(''), 5000);
    } finally {
      setTestLaunchLoading(false);
    }
  }

  function handleUnlockTest(test) {
    const unitMatch = test.unitCovered?.match(/Unit\s*(\d+)/i);
    if (unitMatch) {
      const uId = `unit_${unitMatch[1]}`;
      setSelectedUnitForPass(uId);
      scrollToPricing('unit');
    } else {
      scrollToPricing('full');
    }
  }

  async function handleDemoCbtClick() {
    // 1-Click Launch: Open Free Demo CBT immediately
    try {
      const fresh = await getUnitQuestions('diagnostic_demo');
      if (fresh?.questions?.length > 0) {
        setDemoQuestions(fresh.questions);
      }
    } catch (e) {}

    setActiveTestForCbt({
      id: 'diagnostic_demo',
      testNumber: 'T-1',
      title: 'Diagnostic Entrance Assessment Demo',
      unitCovered: `High-Yield Entrance Sample (${demoQuestions.length} MCQs)`,
      durationMinutes: Math.max(10, Math.round(demoQuestions.length * 1.5)),
      questions: demoQuestions
    });
    setShowCbtEngine(true);
  }

  function handleEnrollClick(planType = 'full_series') {
    if (!currentUser) {
      setAuthPendingAction(planType);
      setShowAuthModal(true);
      return;
    }
    executeCheckout(currentUser, planType);
  }

  function handleAuthSuccess(user) {
    if (authPendingAction === 'full_series' || authPendingAction === 'unit_pass') {
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
      unitId: planType === 'unit_pass' ? selectedUnitForPass : null,
      amountInINR: finalAmount,
      user,
      razorpayKeyId: settings?.razorpayKey,
      onSuccess: async (subRecord) => {
        setLatestSubscriptionRecord(subRecord);
        setEnrollSuccessMessage(`Enrollment confirmed! Subscription ID: ${subRecord.subscriptionId}. Your official access credentials have been activated.`);
        // Refresh subscriptions immediately
        if (user?.uid) {
          const subs = await getUserBotanySubscriptions(user.uid);
          setUserSubscriptions(subs);
        }
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
    if (scheduleFilter === 'unit') {
      const isUnit = test.category === 'Unit Test' || test.title?.toLowerCase().includes('unit ') || test.unitCovered?.toLowerCase().startsWith('unit');
      if (!isUnit) return false;
    }
    if (scheduleFilter === 'cluster') {
      const isCluster = test.category === 'Cluster Test' || test.title?.toLowerCase().includes('cluster');
      if (!isCluster) return false;
    }
    if (scheduleFilter === 'mock') {
      const isMock = test.category === 'Full Mock' || test.title?.toLowerCase().includes('mock');
      if (!isMock) return false;
    }
    if (scheduleFilter === 'special') {
      const isSpecial = test.category === 'Special Test' || test.title?.toLowerCase().includes('special') || test.title?.toLowerCase().includes('pyq') || test.title?.toLowerCase().includes('himalayan');
      if (!isSpecial) return false;
    }

    // Search filter
    if (!scheduleSearch.trim()) return true;
    const q = scheduleSearch.toLowerCase();
    return (
      test.title?.toLowerCase().includes(q) ||
      test.unitCovered?.toLowerCase().includes(q) ||
      test.testNumber?.toLowerCase().includes(q) ||
      test.category?.toLowerCase().includes(q)
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
        <div className="admin-spinner"></div>
        <p>Loading Botany Examination Suite...</p>
      </div>
    );
  }

  return (
    <div className="botany-portal-page">
      {/* Top Navbar */}
      <header className="cbt-topbar">
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
              {(latestSubscriptionRecord || userSubscriptions.length > 0) && (
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm cbt-receipt-btn" 
                  onClick={() => printSubscriptionReceipt(latestSubscriptionRecord || userSubscriptions[0])}
                  title="Print / Save Official Tax Invoice & Subscription Receipt"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Printer size={13} /> <span className="cbt-btn-text">My Receipt</span>
                </button>
              )}
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
        {(latestSubscriptionRecord || enrollSuccessMessage) && (
          <div className="botany-enrollment-success-card">
            <button 
              type="button" 
              className="enrollment-dismiss-btn"
              onClick={() => { setEnrollSuccessMessage(''); setLatestSubscriptionRecord(null); }}
              aria-label="Dismiss banner"
            >
              <X size={18} />
            </button>

            <div className="enrollment-layout">
              <div className="enrollment-icon-box">
                <CheckCircle2 size={24} />
              </div>

              <div className="enrollment-body">
                <div className="enrollment-header-row">
                  <h3 className="enrollment-title">
                    Payment Verified & Subscription Active
                  </h3>
                  <span className="enrollment-verified-tag">
                    Verified Candidate
                  </span>
                </div>

                <p className="enrollment-message">
                  {enrollSuccessMessage || 'Your candidate credentials are live. All scheduled computer-based tests, timed exams, and option analysis rationales are unlocked.'}
                </p>

                {/* Email Delivery Notice */}
                <div className="enrollment-email-notice">
                  <ShieldCheck size={16} className="enrollment-email-icon" />
                  <span>
                    <strong>Confirmation Email Sent:</strong> An authentic transactional receipt with access credentials was queued for delivery to your registered email from <code>admissions@nexliftech.space</code>. Please check your <em>Primary Inbox</em> or <em>Updates</em> tab.
                  </span>
                </div>

                {/* Action buttons */}
                <div className="enrollment-actions">
                  {(latestSubscriptionRecord || userSubscriptions[0]) && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => printSubscriptionReceipt(latestSubscriptionRecord || userSubscriptions[0])}
                    >
                      <Printer size={14} />
                      <span>Print / Download Tax Receipt (PDF)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setExplorerTab('schedule');
                      if (tabsNavRef.current) tabsNavRef.current.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>Go to Test Calendar</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. COMPACT ACADEMIC HERO HEADER */}
        <section className="botany-hero-compact">
          <div className="hero-compact-top">
            <div className="hero-academic-meta">
              <span className="academic-badge">PSC Entrance 2026</span>
              <span className="academic-curator">
                <GraduationCap size={14} className="curator-icon" />
                <span>Curated by: <strong>Dr. Aubid Ahmad</strong> (Assistant Professor)</span>
              </span>
              <span className="meta-sep">•</span>
              <span className="academic-engine">NexLifTech Engine</span>
            </div>

            <div className="hero-compact-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm hero-btn-demo"
                onClick={handleDemoCbtClick}
                title="Launch 1-Click Free Diagnostic Demo"
              >
                <Play size={12} className="accent-play-icon" />
                <span>Try Free Demo ({demoQuestions.length} MCQs)</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm hero-btn-enroll"
                onClick={() => scrollToPricing('full')}
                title="View All Enrollment Passes"
              >
                <span>Enroll in Series — ₹{finalPrice}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="hero-compact-body">
            <h1 className="hero-compact-title">
              Botany Assistant Professor Computer-Based Test Series
            </h1>
            <p className="hero-compact-subtitle">
              Standardized examination simulation calibrated to Botany PSC standards. Master all 10 units across {schedule.length || 35} scheduled tests with authentic -0.25 negative marking and comprehensive 4-option scientific literature rationales.
            </p>

            <div className="hero-compact-chips">
              <div className="hero-chip">
                <span className="chip-val">{schedule.length || 35}</span>
                <span className="chip-lbl">Scheduled Tests</span>
              </div>
              <span className="chip-dot">•</span>
              <div className="hero-chip">
                <span className="chip-val">10</span>
                <span className="chip-lbl">PSC Units</span>
              </div>
              <span className="chip-dot">•</span>
              <div className="hero-chip">
                <span className="chip-val">9</span>
                <span className="chip-lbl">Grand Mocks</span>
              </div>
              <span className="chip-dot">•</span>
              <div className="hero-chip">
                <span className="chip-val">{questionStats?.totalUploadedQuestions || 100}+</span>
                <span className="chip-lbl">MCQs Active</span>
              </div>
              <span className="chip-dot">•</span>
              <div className="hero-chip">
                <span className="chip-val">-0.25</span>
                <span className="chip-lbl">Penalty Calibration</span>
              </div>
              <span className="chip-dot">•</span>
              <div className="hero-chip">
                <span className="chip-val">100%</span>
                <span className="chip-lbl">Option Rationales</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. UNIFIED ACADEMIC EXPLORER (TEST SCHEDULE FIRST, PASSES & PRICING, SYLLABUS, BLUEPRINT & FAQS) */}
        <section className="botany-main-explorer" ref={tabsNavRef}>
          {/* Minimal Tab Bar */}
          <div className="botany-subnav-tabs" role="tablist" aria-label="Portal Navigation Tabs">
            <button 
              type="button" 
              role="tab"
              aria-selected={explorerTab === 'schedule'}
              className={`subnav-tab-btn ${explorerTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setExplorerTab('schedule')}
            >
              <Calendar size={15} />
              <span>Test Schedule</span>
              <span className="tab-pill-count">{schedule.length || 35}</span>
            </button>

            <button 
              type="button" 
              role="tab"
              aria-selected={explorerTab === 'pricing'}
              className={`subnav-tab-btn ${explorerTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setExplorerTab('pricing')}
            >
              <Tag size={15} />
              <span>Passes &amp; Pricing</span>
              <span className="tab-pill-count">₹{unitPrice} / ₹{finalPrice}</span>
            </button>

            <button 
              type="button" 
              role="tab"
              aria-selected={explorerTab === 'syllabus'}
              className={`subnav-tab-btn ${explorerTab === 'syllabus' ? 'active' : ''}`}
              onClick={() => setExplorerTab('syllabus')}
            >
              <BookOpen size={15} />
              <span>10-Unit Syllabus</span>
              <span className="tab-pill-count">{syllabus.length || 10}</span>
            </button>

            <button 
              type="button" 
              role="tab"
              aria-selected={explorerTab === 'blueprint'}
              className={`subnav-tab-btn ${explorerTab === 'blueprint' ? 'active' : ''}`}
              onClick={() => setExplorerTab('blueprint')}
            >
              <ShieldCheck size={15} />
              <span>Blueprint &amp; FAQs</span>
            </button>
          </div>

          {/* TAB 1: TEST SCHEDULE (DEFAULT FRONT AND CENTER) */}
          {explorerTab === 'schedule' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Official 35-Test Examination Calendar</h3>
                  <p>Structured progression: 10 Unit Tests (50 MCQs) → 5 Multi-Unit Clusters (60 MCQs) → 11 PYQ/Specials → 9 Grand Mocks (100 MCQs).</p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => scrollToPricing('full')}>
                  <span>Enroll in Series — ₹{finalPrice}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Minimal verification strip */}
              <div className="public-bank-stats-banner">
                <div className="public-stats-badge">
                  <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>
                    Verified Question Bank: <strong>100% 4-Option Scientific Rationale</strong> • Zero Key Bias
                  </span>
                </div>
                <div className="public-stats-breakdown">
                  <span className="stats-tag-item"><strong>{questionStats?.totalUploadedQuestions || 100}</strong> MCQs Loaded</span>
                  <span className="stats-dot">•</span>
                  <span className="stats-tag-item"><strong>10/10</strong> Units Analyzed</span>
                  <span className="stats-dot">•</span>
                  <span className="stats-tag-item">-0.25 Marking</span>
                </div>
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
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search test by title or topic..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                  />
                </div>
              </div>

              {testNotification && (
                <div className="botany-modal-alert error" style={{ marginBottom: '0.75rem', borderRadius: '8px' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{testNotification}</span>
                </div>
              )}

              {/* Schedule Table */}
              <div className="schedule-table-wrapper">
                <table className="schedule-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', whiteSpace: 'nowrap' }}>Test #</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Test Title &amp; Syllabus Coverage</th>
                      <th style={{ width: '140px', whiteSpace: 'nowrap' }}>Questions</th>
                      <th style={{ width: '80px', whiteSpace: 'nowrap' }}>Duration</th>
                      <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Schedule</th>
                      <th style={{ width: '115px', textAlign: 'right', whiteSpace: 'nowrap' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedule.map((t, idx) => {
                      const testBankStats = getTestQuestionStats(t, questionStats?.unitStats);
                      const isAccessible = hasTestAccess(t);
                      const isDemo = t.testNumber === 'T-1' || t.id === 'test_01' || t.category === 'Diagnostic Test';

                      return (
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
                            <div className="table-test-info">
                              <span className="t-badge-mcq">{t.questionCount || 50} MCQs</span>
                              {testBankStats?.uploadedCount > 0 && (
                                <span 
                                  className="t-live-bank-tag"
                                  title={`${testBankStats.uploadedCount} MCQs in bank with 100% 4-option scientific rationale`}
                                >
                                  ✓ {testBankStats.uploadedCount} Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="t-badge-time">{t.durationMinutes || 60} Mins</span>
                          </td>
                          <td>
                            <span className="t-date-text">{t.scheduledDate || 'Flexible'}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isAccessible ? (
                              <button
                                type="button"
                                className={`btn btn-sm cbt-table-action-btn ${isDemo ? 'demo' : 'start'}`}
                                onClick={() => handleLaunchTest(t)}
                                disabled={testLaunchLoading}
                                title={isDemo ? 'Launch Free Diagnostic Demo' : 'Launch Official CBT Simulation'}
                              >
                                <Play size={11} />
                                <span>{isDemo ? 'Free Demo' : 'Start CBT'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm cbt-table-action-btn unlock"
                                onClick={() => handleUnlockTest(t)}
                                title="Unlock Test Access"
                              >
                                <Lock size={11} />
                                <span>Unlock</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PASSES & PRICING */}
          {explorerTab === 'pricing' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Candidate Enrollment Passes &amp; Instant Activation</h3>
                  <p>Direct enrollment via Razorpay (UPI, Cards, NetBanking). Credentials and access activate immediately with receipt generation.</p>
                </div>
              </div>

              {/* Mobile Tabbed Switcher */}
              <div className="pricing-mobile-tab-bar" role="tablist" aria-label="Test series package options">
                <button 
                  type="button" 
                  role="tab"
                  aria-selected={activePricingTab === 'full'}
                  className={`pricing-mobile-tab-btn ${activePricingTab === 'full' ? 'active tab-featured' : ''}`}
                  onClick={() => setActivePricingTab('full')}
                >
                  <div className="tab-btn-content">
                    <div className="tab-title-line">
                      <Star size={13} className="tab-icon-star" fill={activePricingTab === 'full' ? '#10b981' : 'none'} />
                      <span>Full Pass</span>
                    </div>
                    <div className="tab-meta-badge">₹{finalPrice}</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  role="tab"
                  aria-selected={activePricingTab === 'unit'}
                  className={`pricing-mobile-tab-btn ${activePricingTab === 'unit' ? 'active tab-unit' : ''}`}
                  onClick={() => setActivePricingTab('unit')}
                >
                  <div className="tab-btn-content">
                    <div className="tab-title-line">
                      <BookOpen size={13} className="tab-icon-book" />
                      <span>Unit-Wise</span>
                    </div>
                    <div className="tab-meta-badge">₹{unitPrice}</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  role="tab"
                  aria-selected={activePricingTab === 'demo'}
                  className={`pricing-mobile-tab-btn ${activePricingTab === 'demo' ? 'active tab-demo' : ''}`}
                  onClick={() => setActivePricingTab('demo')}
                >
                  <div className="tab-btn-content">
                    <div className="tab-title-line">
                      <Play size={13} className="tab-icon-play" fill={activePricingTab === 'demo' ? '#a855f7' : 'none'} />
                      <span>Free Demo</span>
                    </div>
                    <div className="tab-meta-badge demo-badge">FREE</div>
                  </div>
                </button>
              </div>

              <div className="botany-pricing-cards-container">
                {/* Card 1: Complete 35-Test Series Master Pass */}
                <div className={`pricing-card-box featured-pass ${activePricingTab === 'full' ? 'active-mobile-plan' : ''}`}>
                  <div className="p-card-header">
                    <span className="p-plan-badge">All-Inclusive Pass</span>
                    <h3 className="p-plan-title">Full 35-Test Series Pass</h3>
                    <p className="p-plan-summary">
                      Complete preparation: 10 Unit Tests, 5 Clusters, PYQs &amp; 9 Full-Length Grand Mocks.
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-currency">₹</span>
                      <span className="p-value">{finalPrice}</span>
                      <span className="p-original">₹{originalPrice}</span>
                      <span className="p-discount-tag">40% OFF</span>
                    </div>
                    <span className="p-validity-note">Valid until PSC Exam 2026 • Unlimited Re-attempts</span>
                  </div>

                  {/* Coupon Applicator */}
                  <div className="p-coupon-bar">
                    <input 
                      type="text" 
                      className="p-coupon-input"
                      placeholder="Coupon code (e.g. EARLYBIRD)"
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
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>All 35 CBT Tests</strong> (~2,700 questions across 10 PSC units)</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Option-by-Option Rationale</strong> for every question</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>9 Full Grand Mocks</strong> calibrated to actual PSC difficulty</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Negative Marking</strong> (+1.00 / -0.25 penalty calibration)</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Instant Razorpay Activation</strong> with email receipt</span>
                    </li>
                  </ul>

                  <button 
                    type="button" 
                    className="btn btn-primary p-enroll-action-btn"
                    onClick={() => handleEnrollClick('full_series')}
                  >
                    <span>Enroll in Full Series — ₹{finalPrice}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Card 2: Unit-Wise Flexi Pass */}
                <div className={`pricing-card-box flexi-pass ${activePricingTab === 'unit' ? 'active-mobile-plan' : ''}`}>
                  <div className="p-card-header">
                    <span className="p-plan-badge flexi">Targeted Practice</span>
                    <h3 className="p-plan-title">Unit-Wise Individual Pass</h3>
                    <p className="p-plan-summary">
                      Practice a specific unit (e.g. Cytology, Physiology, or Plant Pathology).
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-currency">₹</span>
                      <span className="p-value">{unitPrice}</span>
                      <span className="p-period">/ per single unit</span>
                    </div>
                    <span className="p-validity-note">
                      Upgrade to Full Series anytime with price adjustment credit
                    </span>
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
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>50 High-Yield MCQs</strong> for selected unit</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>60 Minutes</strong> authentic timed examination mode</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Option Analysis</strong> with scientific literature references</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Weak-Topic Diagnostic</strong> &amp; speed analysis</span>
                    </li>
                  </ul>

                  <button 
                    type="button" 
                    className="btn btn-secondary p-enroll-action-btn"
                    onClick={() => handleEnrollClick('unit_pass')}
                  >
                    <span>Enroll in Unit Pass — ₹{unitPrice}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Card 3: Free Diagnostic CBT Demo */}
                <div className={`pricing-card-box demo-pass ${activePricingTab === 'demo' ? 'active-mobile-plan' : ''}`}>
                  <div className="p-card-header">
                    <span className="p-plan-badge free">100% Free Sample</span>
                    <h3 className="p-plan-title">Diagnostic Demo CBT</h3>
                    <p className="p-plan-summary">
                      Experience the exam engine, live timer, negative marking, and analysis firsthand.
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-free-text">FREE</span>
                      <span className="p-period">/ No Payment Required</span>
                    </div>
                    <span className="p-validity-note">
                      Instant 1-Click Launch • Authentic Simulation
                    </span>
                  </div>

                  <ul className="p-features-checklist">
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>{demoQuestions.length} High-Yield MCQs</strong> spanning PSC units</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Authentic CBT Mode</strong> with countdown timer</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Question Palette</strong> (Answered, Flagged, Unattempted)</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span><strong>Instant Results Report</strong> with complete rationale</span>
                    </li>
                  </ul>

                  <button 
                    type="button" 
                    className="btn btn-secondary p-enroll-action-btn demo-btn"
                    onClick={handleDemoCbtClick}
                  >
                    <Play size={14} />
                    <span>Launch Free Demo CBT</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 10-UNIT SYLLABUS */}
          {explorerTab === 'syllabus' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Official 10-Unit PSC Entrance Syllabus</h3>
                  <p>Compiled by Sheikh Gulfam (1 July 2023) • Curated by Dr. Aubid Ahmad, Assistant Professor (Botany).</p>
                </div>
                <div className="syllabus-search-box">
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search topics (e.g. CaMV, Sporne, APG, CRISPR)..."
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
                          <span className="unit-q-weight">{unit.estimatedQuestions || 50} MCQs</span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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

          {/* TAB 4: BLUEPRINT & FAQS */}
          {explorerTab === 'blueprint' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Examination Blueprint &amp; Candidate FAQs</h3>
                  <p>Standardized testing guidelines, negative marking rules, and enrollment details.</p>
                </div>
              </div>

              {/* Blueprint Feature Cards */}
              <div className="features-showcase-grid">
                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Clock size={20} /></div>
                  <h4>Authentic PSC CBT Engine</h4>
                  <p>Real-time countdown timer, question palette with status color codes, and flag-for-review navigation.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><BookOpen size={20} /></div>
                  <h4>Option-by-Option Rationales</h4>
                  <p>Explains why the correct choice succeeds and why each of the 3 distractors fails, with cited references.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Zap size={20} /></div>
                  <h4>-0.25 Negative Marking</h4>
                  <p>Exact PSC grading (+1.00 for correct, -0.25 penalty for incorrect, 0 for skipped) for true percentile calibration.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Award size={20} /></div>
                  <h4>Structured Progression</h4>
                  <p>10 modular Unit Tests → 5 Multi-Unit Clusters → 11 PYQs/Specials → 9 full-length Grand Mocks.</p>
                </div>
              </div>

              <h4 className="faq-section-heading">
                Frequently Asked Questions
              </h4>

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
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
          testData={activeTestForCbt || {
            title: 'Diagnostic Entrance Assessment Demo',
            unitCovered: `High-Yield Entrance Sample (${demoQuestions.length} MCQs)`,
            durationMinutes: Math.max(10, Math.round(demoQuestions.length * 1.5))
          }}
          questions={activeTestForCbt?.questions || demoQuestions}
          onClose={() => {
            setShowCbtEngine(false);
            setActiveTestForCbt(null);
          }}
          onUnlockNeeded={(test) => {
            setShowCbtEngine(false);
            setActiveTestForCbt(null);
            handleUnlockTest(test);
          }}
          userSubscriptions={userSubscriptions}
        />
      )}
    </div>
  );
}
