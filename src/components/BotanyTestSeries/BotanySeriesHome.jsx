import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, Calendar, CheckCircle2, Play, 
  ArrowRight, Tag, Sparkles, UserCheck, LogOut, ArrowLeft, Search, 
  GraduationCap, Lock, Clock, ShieldCheck, Award, HelpCircle, 
  ChevronDown, ChevronUp, Zap, Check, AlertCircle, FileText, X, Star, User, Printer, ClipboardList
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
import { searchSyllabusAdvanced, HighlightMatch } from '../../utils/botanySearch';
import StudentAuthModal from './StudentAuthModal';
import StudentExamEngine from './StudentExamEngine';
import StudentResults from './StudentResults';
import ThemeSwitcher from '../ThemeSwitcher';
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
    q: 'What is included in the full pass?',
    a: 'The full pass includes all 35 planned tests across 10 Botany units, including 9 full mock tests. New dates will appear in the calendar as they are confirmed.'
  },
  {
    q: 'Will I see answer explanations?',
    a: 'Yes. After each test, you can review the answers and explanations.'
  },
  {
    q: 'How are tests scored?',
    a: 'You get 1 mark for a correct answer. A wrong answer loses 0.25 marks. Skipped questions score 0.'
  },
  {
    q: 'Can I take the tests on mobile or tablet?',
    a: 'Yes. You can take tests on a phone, tablet, or computer.'
  },
  {
    q: 'How long will my test access remain valid?',
    a: 'You can review and retake tests until the 2026 J&K PSC Assistant Professor Botany exam.'
  },
  {
    q: 'When can I start after payment?',
    a: 'You can start using your pass as soon as payment is complete.'
  }
];

export default function BotanySeriesHome() {
  const { currentUser, userProfile, logout } = useAuth();

  const emailLower = currentUser?.email?.toLowerCase().trim() || '';
  const isFacultyAdmin = (
    emailLower === 'aubidmalik00@gmail.com' ||
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
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutError, setLogoutError] = useState('');

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
          const subs = await getUserBotanySubscriptions(currentUser.uid, currentUser.email);
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
        const nav = tabsNavRef.current.querySelector('.botany-subnav-tabs');
        const selectedTab = nav?.querySelector('[aria-selected="true"]');
        if (nav && selectedTab) {
          const navRect = nav.getBoundingClientRect();
          const tabRect = selectedTab.getBoundingClientRect();
          nav.scrollTo({
            left: nav.scrollLeft + (tabRect.left + tabRect.right - navRect.left - navRect.right) / 2,
            behavior: 'smooth'
          });
        }
      }
    }, 40);
  }

  async function confirmLogout() {
    try {
      await logout();
      setShowLogoutConfirm(false);
      setLogoutError('');
      setExplorerTab('schedule');
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    }
  }

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const availablePromos = settings?.promoCodes || [];
    const found = availablePromos.find(p => (p.code || '').trim().toUpperCase() === code);

    if (!found) {
      setDiscountApplied(0);
      setCouponMessage(`❌ Promo code "${code}" is invalid.`);
      return;
    }

    if (found.isActive === false) {
      setDiscountApplied(0);
      setCouponMessage(`❌ Promo code "${code}" is currently inactive.`);
      return;
    }

    if (found.validUntil) {
      const expiry = new Date(found.validUntil);
      expiry.setHours(23, 59, 59, 999);
      if (expiry < new Date()) {
        setDiscountApplied(0);
        setCouponMessage(`❌ Promo code "${code}" expired on ${found.validUntil}.`);
        return;
      }
    }

    const currentBase = settings?.fullSeriesPrice || 1499;
    if (found.minOrder && currentBase < Number(found.minOrder)) {
      setDiscountApplied(0);
      setCouponMessage(`❌ Minimum order value of ₹${found.minOrder} required for code "${code}".`);
      return;
    }

    let discount = 0;
    if (found.discountType === 'percentage' || found.type === 'percentage') {
      const pct = Math.min(100, Math.max(1, Number(found.discountValue || found.value || 10)));
      discount = Math.round((currentBase * pct) / 100);
    } else {
      discount = Math.min(currentBase - 1, Number(found.discountValue || found.value || 0));
    }

    if (discount <= 0) {
      setDiscountApplied(0);
      setCouponMessage('❌ Could not calculate valid discount.');
      return;
    }

    setDiscountApplied(discount);
    setCouponMessage(`🎉 Promo code "${found.code.toUpperCase()}" applied! ₹${discount} discount unlocked.`);
  }

  function removeCoupon() {
    setDiscountApplied(0);
    setCouponCode('');
    setCouponMessage('');
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
        setTestNotification(`Questions for "${test.title}" are not ready yet. Please try Unit 1 or the free demo.`);
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
      title: 'Free Botany Practice Test',
      unitCovered: `${demoQuestions.length} Botany questions`,
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
      appliedCoupon: discountApplied > 0 ? { code: couponCode, discount: discountApplied } : null,
      onSuccess: async (subRecord) => {
        setLatestSubscriptionRecord(subRecord);
        setEnrollSuccessMessage('Your pass is ready. You can start a test now.');
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
  const finalPrice = Math.max(1, basePrice - discountApplied);
  const unitPrice = settings?.unitWisePrice || 199;
  const testCount = schedule.filter(item => item.isTest !== false && item.questionCount !== 0).length || 35;
  const remainingTestCount = Math.max(0, 35 - testCount);
  const studyDayCount = schedule.length - testCount;

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

  // Advanced Fuzzy & Semantic Syllabus Search
  const { results: filteredSyllabus, matchingUnitIds, totalMatches: syllabusMatchCount } = useMemo(() => {
    return searchSyllabusAdvanced(syllabus, syllabusSearch);
  }, [syllabus, syllabusSearch]);

  // Auto-expand units when searching
  useEffect(() => {
    if (syllabusSearch.trim() && matchingUnitIds && matchingUnitIds.size > 0) {
      const openObj = {};
      matchingUnitIds.forEach(id => { openObj[id] = true; });
      setActiveUnitAccordion(openObj);
    }
  }, [syllabusSearch, matchingUnitIds]);


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
          <span className="cbt-topbar-title">Botany Test Series</span>
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
                  title="Download receipt"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Printer size={13} /> <span className="cbt-btn-text">My Receipt</span>
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-secondary btn-sm cbt-logout-btn" 
                onClick={() => { setLogoutError(''); setShowLogoutConfirm(true); }}
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
                <UserCheck size={14} />
                <span className="cbt-signin-label-full">Student Sign In</span>
                <span className="cbt-signin-label-short">Sign In</span>
              </button>
              <a 
                href="/admin/login" 
                className="btn btn-secondary btn-sm cbt-admin-btn"
                title="Admin sign in"
                aria-label="Admin sign in"
              >
                <Lock size={13} /> <span>Admin</span>
              </a>
            </div>
          )}
          <ThemeSwitcher inline />
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
                    Payment complete. Your pass is ready.
                  </h3>
                  <span className="enrollment-verified-tag">
                    Ready to start
                  </span>
                </div>

                <p className="enrollment-message">
                  {enrollSuccessMessage || 'Your tests are ready to take.'}
                </p>

                {/* Email Delivery Notice */}
                <div className="enrollment-email-notice">
                  <ShieldCheck size={16} className="enrollment-email-icon" />
                  <span>
                    Check your email for your receipt and sign-in details.
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
                      <span>Download receipt</span>
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
              <span className="academic-curator">
                <GraduationCap size={14} className="curator-icon" />
                <span>By <strong>Dr. Aubid Hussain Malik</strong></span>
              </span>
            </div>

            <div className="hero-compact-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm hero-btn-demo"
                onClick={handleDemoCbtClick}
                title="Launch 1-Click Free Diagnostic Demo"
              >
                <Play size={12} className="accent-play-icon" />
                <span>Try Free Demo ({demoQuestions.length} Questions)</span>
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
              Botany Assistant Professor Test Series
            </h1>
            <p className="hero-compact-subtitle">
              Prepare across 10 Botany units with {testCount} scheduled tests and 9 full mock tests.
            </p>

            <div className="hero-compact-chips">
              <div className="hero-chip">
                <span className="chip-val">{testCount}</span>
                <span className="chip-lbl">Scheduled Tests</span>
              </div>
              <div className="hero-chip">
                <span className="chip-val">10</span>
                <span className="chip-lbl">Botany Units</span>
              </div>
              <div className="hero-chip">
                <span className="chip-val">9</span>
                <span className="chip-lbl">Full Mock Tests</span>
              </div>
              <div className="hero-chip">
                <span className="chip-val">{questionStats?.totalUploadedQuestions || 100}+</span>
                <span className="chip-lbl">Questions Ready</span>
              </div>
              <div className="hero-chip">
                <span className="chip-val">-0.25</span>
                <span className="chip-lbl">Per Wrong Answer</span>
              </div>
              <div className="hero-chip">
                <span className="chip-val">100%</span>
                <span className="chip-lbl">Answers Explained</span>
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
              <span className="tab-pill-count">{testCount}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={explorerTab === 'results'}
              className={`subnav-tab-btn ${explorerTab === 'results' ? 'active' : ''}`}
              onClick={() => setExplorerTab('results')}
            >
              <ClipboardList size={15} />
              <span>My Results</span>
            </button>

            <button 
              type="button" 
              role="tab"
              aria-selected={explorerTab === 'pricing'}
              className={`subnav-tab-btn ${explorerTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setExplorerTab('pricing')}
            >
              <Tag size={15} />
              <span>Choose a Pass</span>
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
              <span>How It Works</span>
            </button>
          </div>

          {/* TAB 1: TEST SCHEDULE (DEFAULT FRONT AND CENTER) */}
          {explorerTab === 'schedule' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Botany Examination Calendar</h3>
                  <p>{testCount} tests have dates{remainingTestCount > 0 ? `; ${remainingTestCount} more ${remainingTestCount === 1 ? 'is' : 'are'} planned` : ''}{studyDayCount > 0 ? `. The calendar also includes ${studyDayCount} study days` : ''}.</p>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => scrollToPricing('full')}>
                  <span>Enroll in Series — ₹{finalPrice}</span>
                  <ArrowRight size={13} />
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
                    All Entries ({schedule.length})
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
                    Past Papers &amp; Specials
                  </button>
                </div>

                <div className="schedule-search-box">
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    aria-label="Search tests by title or topic"
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
                      <th style={{ width: '60px', whiteSpace: 'nowrap' }}>Entry</th>
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
                      const isStudyDay = t.isTest === false || t.questionCount === 0;
                      const entryNumber = schedule.indexOf(t) + 1;

                      return (
                        <tr key={t.testId || idx}>
                          <td data-label="Test">
                            <span className="test-code-badge">{isStudyDay ? `Day ${entryNumber}` : t.testNumber || `T-${entryNumber}`}</span>
                          </td>
                          <td data-label="Title and coverage">
                            <div className="table-test-info">
                              <span className="t-name">{t.title}</span>
                              <span className="t-coverage">{t.unitCovered}</span>
                            </div>
                          </td>
                          <td data-label="Questions">
                            <div className="table-test-info">
                              <span className="t-badge-mcq">{isStudyDay ? 'Study day' : `${t.questionCount || 50} questions`}</span>
                              {!isStudyDay && testBankStats?.uploadedCount > 0 && (
                                <span 
                                  className="t-live-bank-tag"
                                  title={`${testBankStats.uploadedCount} questions ready`}
                                >
                                  ✓ {testBankStats.uploadedCount} ready
                                </span>
                              )}
                            </div>
                          </td>
                          <td data-label="Duration">
                            <span className="t-badge-time">{isStudyDay ? 'Self-paced' : `${t.durationMinutes || 60} Mins`}</span>
                          </td>
                          <td data-label="Schedule">
                            <span className="t-date-text">{t.dayLabel || t.scheduledDate || 'Flexible'}</span>
                          </td>
                          <td data-label="Access" className="schedule-action-cell">
                            {isStudyDay ? (
                              <span className="t-study-day-tag">Study plan</span>
                            ) : isAccessible ? (
                              <button
                                type="button"
                                className={`btn btn-sm cbt-table-action-btn ${isDemo ? 'demo' : 'start'}`}
                                onClick={() => handleLaunchTest(t)}
                                disabled={testLaunchLoading}
                                title={isDemo ? 'Try the free demo' : 'Start this test'}
                              >
                                <Play size={11} />
                                <span>{isDemo ? 'Free Demo' : 'Start Test'}</span>
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
                {filteredSchedule.length === 0 && (
                  <div className="schedule-empty-state">
                    <Search size={20} />
                    <strong>No matching tests</strong>
                    <span>Try a different topic or select another test category.</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setScheduleSearch(''); setScheduleFilter('all'); }}>Clear filters</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {explorerTab === 'results' && (
            <StudentResults
              onStartDemo={handleDemoCbtClick}
              onSignIn={() => { setAuthPendingAction(null); setShowAuthModal(true); }}
              refreshKey={resultsRefreshKey}
            />
          )}

          {/* TAB 2: PASSES & PRICING */}
          {explorerTab === 'pricing' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>Choose Your Pass</h3>
                  <p>Get the full series, practice one unit, or try a free test.</p>
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

              {activePricingTab === 'full' && (
                <div className="pricing-mobile-quick-buy">
                  <div className="pricing-mobile-quick-buy-copy">
                    <strong>Full Series Pass</strong>
                    <span>₹{finalPrice} · 35 tests across 10 units</span>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => handleEnrollClick('full_series')}>
                    Buy Full Series <ArrowRight size={16} />
                  </button>
                </div>
              )}

              <div className="botany-pricing-cards-container">
                {/* Card 1: Complete 35-Test Series Master Pass */}
                <div className={`pricing-card-box featured-pass ${activePricingTab === 'full' ? 'active-mobile-plan' : ''}`}>
                  <div className="p-card-header">
                    <span className="p-plan-badge">Full Series</span>
                    <h3 className="p-plan-title">Full 35-Test Series Pass</h3>
                    <p className="p-plan-summary">
                      Practice every Botany unit in one pass.
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-currency">₹</span>
                      <span className="p-value">{finalPrice}</span>
                    </div>
                    <span className="p-validity-note">Access until the 2026 exam. Retake tests anytime.</span>
                  </div>

                  {/* Promo Code Applicator */}
                  {discountApplied > 0 ? (
                    <div className="p-coupon-applied-pill">
                      <span>🏷️ Code <strong>{couponCode}</strong> applied (₹{discountApplied} OFF)</span>
                      <button type="button" className="remove-coupon-btn" onClick={removeCoupon}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="p-coupon-bar">
                      <input 
                        type="text" 
                        className="p-coupon-input"
                        placeholder="Promo code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <button type="button" className="p-coupon-btn" onClick={applyCoupon}>
                        Apply
                      </button>
                    </div>
                  )}
                  {couponMessage && (
                    <div className={`p-coupon-msg ${discountApplied > 0 ? 'success' : 'error'}`}>
                      {couponMessage}
                    </div>
                  )}

                  <ul className="p-features-checklist">
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>Tests across all 10 Botany units</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>Answers and explanations after each test</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>9 full mock tests</span>
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
                    <span className="p-plan-badge flexi">One Unit</span>
                    <h3 className="p-plan-title">Single Unit Pass</h3>
                    <p className="p-plan-summary">
                      Choose one Botany unit to practice.
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-currency">₹</span>
                      <span className="p-value">{unitPrice}</span>
                      <span className="p-period">for one unit</span>
                    </div>
                    <span className="p-validity-note">
                      Upgrade later and use this payment toward the full pass.
                    </span>
                  </div>

                  {/* Unit Selector */}
                  <div className="p-unit-select-box">
                    <label className="p-select-label">Choose a unit:</label>
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
                      <span>50 questions from your chosen unit</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>60 minutes to complete the test</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>Answers and explanations</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>See your results and try again</span>
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
                    <span className="p-plan-badge free">Free Sample</span>
                    <h3 className="p-plan-title">Free Practice Test</h3>
                    <p className="p-plan-summary">
                      Try a short Botany test before you buy.
                    </p>
                  </div>

                  <div className="p-price-container">
                    <div className="p-amount-row">
                      <span className="p-free-text">FREE</span>
                    </div>
                  </div>

                  <ul className="p-features-checklist">
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>{demoQuestions.length} Botany questions</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>Timed test</span>
                    </li>
                    <li>
                      <CheckCircle2 size={15} className="p-check-icon" />
                      <span>Results and answer explanations</span>
                    </li>
                  </ul>

                  <button 
                    type="button" 
                    className="btn btn-secondary p-enroll-action-btn demo-btn"
                    onClick={handleDemoCbtClick}
                  >
                    <Play size={14} />
                    <span>Start Free Test</span>
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
                  <h3>Botany Syllabus: 10 Units</h3>
                  <p>See the topics covered in each unit.</p>
                </div>
                <div className="syllabus-header-actions">
                  <div className="syllabus-expand-controls">
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const allOpen = {};
                        filteredSyllabus.forEach(u => { allOpen[u.unitId] = true; });
                        setActiveUnitAccordion(allOpen);
                      }}
                    >
                      Expand All
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveUnitAccordion({})}
                    >
                      Collapse All
                    </button>
                  </div>
                  <div className="syllabus-search-box">
                    <Search size={14} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search topics (e.g. sphae, TMV, Alexopolous, Bryophyta, APG-IV, Operon, CRISPR, ANOVA)..."
                      value={syllabusSearch}
                      onChange={(e) => setSyllabusSearch(e.target.value)}
                    />
                    {syllabusSearch && (
                      <button 
                        type="button" 
                        onClick={() => setSyllabusSearch('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {syllabusSearch.trim() && (
                    <div className="syllabus-search-status-badge">
                      <Sparkles size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                      <span>Matching <strong>{filteredSyllabus.length} Unit{filteredSyllabus.length !== 1 ? 's' : ''}</strong> (Fuzzy &amp; Semantic search active)</span>
                      <button type="button" className="clear-search-btn" onClick={() => setSyllabusSearch('')}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="syllabus-accordions-list">
                {filteredSyllabus.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                      No syllabus topics found matching "{syllabusSearch}".
                    </p>
                    <p style={{ fontSize: '0.78rem' }}>
                      Try broad botanical terms like <em>Algae, Bryophyta, Sphaerocarpales, CRISPR, TMV, Operon, Photosynthesis</em>.
                    </p>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setSyllabusSearch('')}>
                      Reset Search
                    </button>
                  </div>
                ) : (
                  filteredSyllabus.map(unit => {
                    const isOpen = !!activeUnitAccordion[unit.unitId];
                    const subunitCount = unit.subunits?.length || 0;
                    return (
                      <div key={unit.unitId} className={`syllabus-unit-accordion ${isOpen ? 'open' : ''}`}>
                        <button 
                          type="button" 
                          className="unit-accordion-trigger"
                          onClick={() => setActiveUnitAccordion(prev => ({ ...prev, [unit.unitId]: !prev[unit.unitId] }))}
                        >
                          <div className="unit-trigger-left">
                            <span className="unit-number-pill">U{unit.unitNumber}</span>
                            <span className="unit-title-text">
                              <HighlightMatch text={unit.title} query={syllabusSearch} matchedTerms={unit.matchedTerms} />
                            </span>
                          </div>
                          <div className="unit-trigger-right">
                            {subunitCount > 0 && (
                              <span className="unit-subunit-count">{subunitCount} Subunits</span>
                            )}
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="unit-accordion-body">
                            <div className="subunits-grid">
                              {unit.subunits?.map((sub, sIdx) => (
                                <div key={sub.id || sIdx} className={`subunit-topic-box ${sub.isMatched ? 'is-matched' : ''}`}>
                                  <h4>
                                    <HighlightMatch text={sub.title} query={syllabusSearch} matchedTerms={sub.matchedTerms} />
                                  </h4>
                                  <p>
                                    <HighlightMatch text={sub.description} query={syllabusSearch} matchedTerms={sub.matchedTerms} />
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BLUEPRINT & FAQS */}
          {explorerTab === 'blueprint' && (
            <div className="explorer-content-card">
              <div className="content-card-header">
                <div>
                  <h3>How the Tests Work</h3>
                  <p>What to expect when you take a test.</p>
                </div>
              </div>

              {/* Blueprint Feature Cards */}
              <div className="features-showcase-grid">
                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Clock size={20} /></div>
                  <h4>Take a Timed Test</h4>
                  <p>See how much time is left and mark questions to review.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><BookOpen size={20} /></div>
                  <h4>Review Your Answers</h4>
                  <p>See the correct answers and clear explanations after the test.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Zap size={20} /></div>
                  <h4>Know Your Score</h4>
                  <p>Correct: +1 mark. Wrong: -0.25 marks. Skipped: 0.</p>
                </div>

                <div className="feature-highlight-card">
                  <div className="f-icon-box"><Award size={20} /></div>
                  <h4>Practice Step by Step</h4>
                  <p>Start with unit tests, then try mixed tests and full mock tests.</p>
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
            title: 'Free Botany Practice Test',
            unitCovered: `${demoQuestions.length} Botany questions`,
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
          onResultSaved={() => setResultsRefreshKey(key => key + 1)}
          onViewResults={() => {
            setShowCbtEngine(false);
            setActiveTestForCbt(null);
            setExplorerTab('results');
            setTimeout(() => tabsNavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
          }}
          userSubscriptions={userSubscriptions}
        />
      )}

      {showLogoutConfirm && (
        <div className="botany-modal-overlay">
          <div className="botany-modal-card" role="dialog" aria-modal="true" aria-labelledby="logout-title" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <LogOut size={32} className="confirm-dialog-icon" />
            <h3 id="logout-title">Sign out?</h3>
            <p>You can sign in again to view your saved results and tests.</p>
            {logoutError && <p role="alert" className="results-load-note">{logoutError}</p>}
            <div className="cbt-submit-confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Stay Signed In</button>
              <button type="button" className="btn btn-primary" onClick={confirmLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
