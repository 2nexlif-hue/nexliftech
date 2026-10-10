import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, FileSpreadsheet, Settings, Users,
  Download, Upload, RefreshCw, CheckCircle, AlertCircle,
  RotateCcw, Save, Sparkles, Layers, CheckCircle2,
  Tag, Trash2, Plus, X, UserPlus
} from 'lucide-react';
import { 
  getBotanySettings, 
  saveBotanySettings, 
  getBotanySyllabus, 
  getBotanySchedule, 
  saveBotanySchedule,
  syncBotanyDataToFirestore,
  getUnitQuestions,
  getUnitVersions,
  commitUnitQuestions,
  rollbackUnitToVersion,
  getAllUnitsQuestionStats,
  getTestQuestionStats,
  grantManualSubscription
} from '../../utils/botanyFirestoreService';
import { 
  downloadExcelTemplate, 
  parseExcelFile, 
  exportQuestionsToExcel 
} from '../../utils/botanyExcelEngine';
import { computeQuestionBankDiff } from '../../utils/botanyDiff';
import { BOTANY_AVAILABILITY_OPTIONS, getBotanyTestAvailability } from '../../utils/botanyAvailability';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import './AdminBotanyTestSeries.css';

export default function AdminBotanyTestSeries({ currentUser }) {
  // Navigation
  const [subTab, setSubTab] = useState('schedule'); // 'schedule' | 'settings' | 'subscribers'

  // Data states
  const [settings, setSettings] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const toastTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  // Excel Hub State
  const [excelBankMode, setExcelBankMode] = useState('tests'); // 'units' | 'demo' | 'tests'
  const [selectedUnitId, setSelectedUnitId] = useState('test_DT_F');
  const [unitActiveData, setUnitActiveData] = useState(null);
  const [unitVersions, setUnitVersions] = useState([]);
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Upload & Preview state
  const [uploadPreview, setUploadPreview] = useState(null); // { questions, validCount, invalidCount, fileName, detectedUnitId }
  const [batchUploadList, setBatchUploadList] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState({ current: 0, total: 0, unitTitle: '' });
  const activeBankRef = useRef(null);
  const bankFileInputRef = useRef(null);
  const bankUploadIdRef = useRef(null);
  const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);

  function inspectBank(bankId) {
    setSelectedUnitId(bankId);
    setExcelBankMode(bankId === 'diagnostic_demo' ? 'demo' : bankId.startsWith('test_') ? 'tests' : 'units');
    setIsBankEditorOpen(true);
  }

  function chooseBankFile(bankId) {
    bankUploadIdRef.current = bankId;
    bankFileInputRef.current?.click();
  }

  function handleBankFileChange(event) {
    const file = event.target.files?.[0];
    if (file && bankUploadIdRef.current) processFiles([file], bankUploadIdRef.current);
    event.target.value = '';
  }

  function handleDownloadBankTemplate(bankId) {
    try {
      if (bankId === 'diagnostic_demo') {
        downloadExcelTemplate(bankId, 'Diagnostic Demo Entrance Test', 30);
      } else if (bankId.startsWith('test_')) {
        const test = schedule.find(item => item.id === bankId);
        downloadExcelTemplate(bankId, test?.title || bankId, test?.questionCount || 50, test || {});
      } else {
        const unit = syllabus.find(item => item.unitId === bankId);
        const target = questionStats?.unitStats?.[bankId]?.targetCount || unit?.estimatedQuestions || 50;
        downloadExcelTemplate(bankId, unit?.title || bankId, target);
      }
    } catch (error) {
      showToast('error', error.message || 'Could not create the Excel template.');
    }
  }

  // Question Diff state
  const [diffTargetBank, setDiffTargetBank] = useState(null);
  const [diffFilterTab, setDiffFilterTab] = useState('all'); // 'all' | 'modified' | 'added' | 'deleted' | 'unchanged'

  // Promo Codes State
  const [newPromo, setNewPromo] = useState({ 
    code: '', 
    discountType: 'fixed', 
    discountValue: 300, 
    description: '', 
    validUntil: '', 
    minOrder: 0, 
    isActive: true 
  });
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // Manual Access & Subscriber Enrollment
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    email: '',
    name: '',
    planType: 'full_series',
    selectedUnit: 'unit_1',
    note: 'VIP Access granted by Admin'
  });
  const [enrolling, setEnrolling] = useState(false);

  async function handleGrantManualAccess(e) {
    e.preventDefault();
    const emailClean = (enrollForm.email || '').trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      showToast('error', 'Please enter a valid candidate or student email address.');
      return;
    }
    setEnrolling(true);
    try {
      const newSub = await grantManualSubscription({
        userEmail: emailClean,
        userName: enrollForm.name.trim() || emailClean.split('@')[0],
        planType: enrollForm.planType,
        allowedUnits: enrollForm.planType === 'full_series' ? ['all'] : [enrollForm.selectedUnit],
        note: enrollForm.note || 'Manually enrolled by Administrator',
        grantedBy: currentUser?.email || 'Super Admin'
      });
      setSubscribers(prev => [newSub, ...prev]);
      showToast('success', `Active subscription granted to ${emailClean}!`);
      setShowEnrollModal(false);
      setEnrollForm({
        email: '',
        name: '',
        planType: 'full_series',
        selectedUnit: 'unit_1',
        note: 'VIP Access granted by Admin'
      });
    } catch (err) {
      console.error('Error granting manual subscription:', err);
      showToast('error', err.message || 'Failed to grant access');
    } finally {
      setEnrolling(false);
    }
  }

  // Schedule UI
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});
  const [savingTestStatus, setSavingTestStatus] = useState('');

  function updateStatusDraft(test, patch) {
    setStatusDrafts(prev => ({
      ...prev,
      [test.id]: {
        status: test.availabilityStatus || 'auto',
        label: test.availabilityLabel || '',
        ...prev[test.id],
        ...patch
      }
    }));
  }

  async function saveTestStatus(test) {
    const draft = statusDrafts[test.id];
    if (!draft) return;
    const label = draft.label.trim().slice(0, 40);
    if (draft.status === 'custom' && !label) {
      showToast('error', 'Enter a custom label before saving.');
      return;
    }
    setSavingTestStatus(test.id);
    try {
      const updated = schedule.map(item => item.id === test.id
        ? { ...item, availabilityStatus: draft.status, availabilityLabel: draft.status === 'custom' ? label : '' }
        : item);
      await saveBotanySchedule(updated, currentUser?.email || 'admin');
      setSchedule(updated);
      setStatusDrafts(prev => {
        const next = { ...prev };
        delete next[test.id];
        return next;
      });
      showToast('success', `${test.code} public label updated.`);
    } catch (err) {
      console.error('Could not update test label:', err);
      showToast('error', 'Could not save this test label. Please try again.');
    } finally {
      setSavingTestStatus('');
    }
  }

  function showToast(type, message) {
    window.clearTimeout(toastTimerRef.current);
    setToast({ show: true, type, message });
    toastTimerRef.current = window.setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000);
  }

  // Refresh question bank statistics across all 10 units
  async function refreshStats(syllabusList = syllabus) {
    try {
      setLoadingStats(true);
      const stats = await getAllUnitsQuestionStats(syllabusList?.length ? syllabusList : undefined);
      setQuestionStats(stats);
      return stats;
    } catch (e) {
      console.warn('Could not compute question stats:', e);
      return null;
    } finally {
      setLoadingStats(false);
    }
  }

  // Initial load
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [loadedSettings, loadedSyllabus, loadedSchedule, loadedStats] = await Promise.all([
          getBotanySettings(),
          getBotanySyllabus(),
          getBotanySchedule(),
          getAllUnitsQuestionStats()
        ]);
        setSettings(loadedSettings);
        setSyllabus(loadedSyllabus);
        setSchedule(loadedSchedule);
        setQuestionStats(loadedStats);

        // Fetch subscribers
        try {
          const subsSnap = await getDocs(query(collection(db, 'subscriptions'), orderBy('activatedAt', 'desc')));
          const subsList = [];
          subsSnap.forEach(d => subsList.push({ id: d.id, ...d.data() }));
          setSubscribers(subsList);
        } catch (e) {
          console.warn('Subscriptions collection may be empty initially:', e);
        }
      } catch (err) {
        console.error('Failed to load Botany data:', err);
        showToast('error', 'Error loading Botany test series data.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Load Unit Question Bank & Versions when selectedUnitId changes
  useEffect(() => {
    async function loadUnitBank() {
      if (!selectedUnitId) return;
      setLoadingUnit(true);
      try {
        const [activeData, versions] = await Promise.all([
          getUnitQuestions(selectedUnitId),
          getUnitVersions(selectedUnitId)
        ]);
        setUnitActiveData(activeData);
        setUnitVersions(versions);
      } catch (err) {
        console.error(`Error loading questions for ${selectedUnitId}:`, err);
      } finally {
        setLoadingUnit(false);
      }
    }
    loadUnitBank();
  }, [selectedUnitId]);

  // Handle Sync / Seed master data to Firestore
  async function handleMasterSync() {
    if (!window.confirm('Sync & seed master 10-Unit syllabus, 50-Test schedule, and default pricing settings to Firebase?')) {
      return;
    }
    setSaving(true);
    try {
      await syncBotanyDataToFirestore(currentUser?.email || 'admin');
      const [loadedSettings, loadedSyllabus, loadedSchedule] = await Promise.all([
        getBotanySettings(),
        getBotanySyllabus(),
        getBotanySchedule()
      ]);
      setSettings(loadedSettings);
      setSyllabus(loadedSyllabus);
      setSchedule(loadedSchedule);
      showToast('success', 'Master Botany syllabus & 50-test schedule successfully synced to Firebase.');
    } catch (err) {
      console.error('Sync error:', err);
      showToast('error', 'Failed to sync data with Firebase.');
    } finally {
      setSaving(false);
    }
  }

  // Handle Settings Save
  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBotanySettings(settings, currentUser?.email || 'admin');
      showToast('success', 'Test series settings & pricing updated.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  }

  // Promo code management handlers
  async function handleAddPromoCode(e) {
    e.preventDefault();
    const cleanCode = (newPromo.code || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast('error', 'Promo code name cannot be empty.');
      return;
    }

    const currentPromos = settings?.promoCodes || [];
    if (currentPromos.some(p => (p.code || '').toUpperCase() === cleanCode)) {
      showToast('error', `Promo code "${cleanCode}" already exists.`);
      return;
    }

    const promoItem = {
      code: cleanCode,
      discountType: newPromo.discountType || 'fixed',
      discountValue: Number(newPromo.discountValue) || 100,
      description: newPromo.description || '',
      validUntil: newPromo.validUntil || '',
      minOrder: Number(newPromo.minOrder) || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const updatedPromos = [...currentPromos, promoItem];
    const updatedSettings = { ...settings, promoCodes: updatedPromos };
    setSettings(updatedSettings);

    try {
      await saveBotanySettings(updatedSettings, currentUser?.email || 'admin');
      showToast('success', `Promo code "${cleanCode}" created successfully.`);
      setNewPromo({ code: '', discountType: 'fixed', discountValue: 300, description: '', validUntil: '', minOrder: 0, isActive: true });
      setIsAddingPromo(false);
    } catch (err) {
      console.error('Error saving promo code:', err);
      showToast('error', 'Failed to save promo code.');
    }
  }

  async function handleTogglePromoActive(promoCode) {
    const currentPromos = settings?.promoCodes || [];
    const updatedPromos = currentPromos.map(p => {
      if ((p.code || '').toUpperCase() === promoCode.toUpperCase()) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });

    const updatedSettings = { ...settings, promoCodes: updatedPromos };
    setSettings(updatedSettings);

    try {
      await saveBotanySettings(updatedSettings, currentUser?.email || 'admin');
      showToast('success', `Promo code "${promoCode}" updated.`);
    } catch (err) {
      console.error('Error toggling promo code:', err);
      showToast('error', 'Failed to update promo code status.');
    }
  }

  async function handleDeletePromoCode(promoCode) {
    if (!window.confirm(`Delete promo code "${promoCode}"?`)) return;

    const currentPromos = settings?.promoCodes || [];
    const updatedPromos = currentPromos.filter(p => (p.code || '').toUpperCase() !== promoCode.toUpperCase());

    const updatedSettings = { ...settings, promoCodes: updatedPromos };
    setSettings(updatedSettings);

    try {
      await saveBotanySettings(updatedSettings, currentUser?.email || 'admin');
      showToast('success', `Promo code "${promoCode}" deleted.`);
    } catch (err) {
      console.error('Error deleting promo code:', err);
      showToast('error', 'Failed to delete promo code.');
    }
  }

  // Fetch active bank for diff whenever preview unit changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchDiffBank() {
      if (!uploadPreview) {
        setDiffTargetBank(null);
        return;
      }
      const targetUId = uploadPreview.detectedUnitId || selectedUnitId;
      if (targetUId === selectedUnitId && unitActiveData) {
        setDiffTargetBank(unitActiveData);
        return;
      }
      try {
        const bank = await getUnitQuestions(targetUId);
        if (!isCancelled) setDiffTargetBank(bank);
      } catch (e) {
        if (!isCancelled) setDiffTargetBank(null);
      }
    }
    fetchDiffBank();
    return () => { isCancelled = true; };
  }, [uploadPreview?.detectedUnitId, uploadPreview?.fileName, selectedUnitId, unitActiveData]);

  // Compute question bank diff
  const questionDiff = useMemo(() => {
    if (!uploadPreview || !uploadPreview.validQuestions) return null;
    return computeQuestionBankDiff(
      diffTargetBank?.questions || [],
      uploadPreview.validQuestions || [],
      diffTargetBank?.version || 1
    );
  }, [uploadPreview, diffTargetBank]);

  // When questionDiff changes, if there are modified questions, auto-focus to modified tab or all
  useEffect(() => {
    if (questionDiff?.modifiedCount > 0) {
      setDiffFilterTab('modified');
    } else {
      setDiffFilterTab('all');
    }
  }, [questionDiff?.modifiedCount, uploadPreview?.fileName]);

  // Unified Excel File Processing (Single or Multi-file up to all 10 units)
  async function processFiles(rawFiles, forcedUnitId = null) {
    if (!rawFiles || !rawFiles.length) return;

    // Filter to valid Excel files and exclude temporary lock files (~$...)
    const files = rawFiles.filter(f => {
      const name = f.name || '';
      if (name.startsWith('~$')) return false;
      return name.endsWith('.xlsx') || name.endsWith('.xls');
    });

    if (!files.length) {
      showToast('error', 'No valid Excel (.xlsx / .xls) files found. Please choose or drop Excel workbooks.');
      return;
    }

    setSaving(true);
    showToast('info', `Reading and analyzing ${files.length} Excel file${files.length > 1 ? 's' : ''}...`);

    try {
      const parsedList = await Promise.all(files.map(f => parseExcelFile(f)));

      if (forcedUnitId) {
        const detected = parsedList[0]?.detectedUnitId;
        if (detected && detected !== forcedUnitId) {
          throw new Error(`This workbook is identified as ${detected.replaceAll('_', ' ')}. Select its matching row, or rename the file before uploading here.`);
        }
        parsedList[0].detectedUnitId = forcedUnitId;
      }

      // Auto-assign unit if not detected based on current mode & selection
      parsedList.forEach((item) => {
        if (!item.detectedUnitId) {
          if (excelBankMode === 'demo') {
            item.detectedUnitId = 'diagnostic_demo';
          } else if (excelBankMode === 'tests') {
            item.detectedUnitId = selectedUnitId.startsWith('test_') ? selectedUnitId : 'test_DT_F';
          } else {
            item.detectedUnitId = selectedUnitId || 'unit_1';
          }
        }
      });

      if (parsedList.length === 1) {
        const single = parsedList[0];
        if (single.detectedUnitId) {
          setSelectedUnitId(single.detectedUnitId);
          if (single.detectedUnitId === 'diagnostic_demo') {
            setExcelBankMode('demo');
          } else if (single.detectedUnitId.startsWith('test_')) {
            setExcelBankMode('tests');
          } else {
            setExcelBankMode('units');
          }
        }
        setUploadPreview(single);
        setBatchUploadList([]);
        setShowPreviewModal(true);
        showToast('success', `Parsed "${single.fileName}": ${single.validCount} valid questions ready.`);
      } else {
        // Multi-file batch (e.g. all 10 unit files)
        parsedList.sort((a, b) => {
          if (a.detectedUnitId === 'diagnostic_demo') return -1;
          if (b.detectedUnitId === 'diagnostic_demo') return 1;
          const numA = parseInt((a.detectedUnitId || '').replace('unit_', ''), 10) || 0;
          const numB = parseInt((b.detectedUnitId || '').replace('unit_', ''), 10) || 0;
          return numA - numB;
        });
        setBatchUploadList(parsedList);
        setUploadPreview(parsedList[0]);
        if (parsedList[0].detectedUnitId) {
          setSelectedUnitId(parsedList[0].detectedUnitId);
          if (parsedList[0].detectedUnitId === 'diagnostic_demo') {
            setExcelBankMode('demo');
          } else if (parsedList[0].detectedUnitId.startsWith('test_')) {
            setExcelBankMode('tests');
          } else {
            setExcelBankMode('units');
          }
        }
        setShowPreviewModal(true);
        const totalValid = parsedList.reduce((acc, b) => acc + b.validCount, 0);
        showToast('success', `🎉 Parsed all ${parsedList.length} files successfully (${totalValid} questions across units ready for 1-click commit)!`);
      }
    } catch (err) {
      console.error('Excel parse error:', err);
      showToast('error', err.message || 'Failed to parse Excel file.');
    } finally {
      setSaving(false);
    }
  }

  // Commit Questions to Firestore (active preview unit)
  async function handleCommitQuestions() {
    if (!uploadPreview || !uploadPreview.validQuestions?.length) {
      showToast('error', 'No valid questions to commit.');
      return;
    }

    setCommitting(true);
    try {
      const targetUnitId = uploadPreview.detectedUnitId || selectedUnitId;
      const targetUnit = syllabus.find(u => u.unitId === targetUnitId);
      const targetTest = schedule.find(t => t.id === targetUnitId);
      const unitTitle = targetUnit 
        ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` 
        : (targetTest ? `${targetTest.code}: ${targetTest.title}` : targetUnitId === 'diagnostic_demo' ? 'Diagnostic Entrance Assessment Demo (30 MCQs)' : targetUnitId);

      const newRelease = await commitUnitQuestions({
        unitId: targetUnitId,
        unitTitle,
        questions: uploadPreview.validQuestions,
        fileName: uploadPreview.fileName,
        userEmail: currentUser?.email || 'admin'
      });

      if (targetUnitId === selectedUnitId) {
        setUnitActiveData(newRelease);
        const updatedVersions = await getUnitVersions(targetUnitId);
        setUnitVersions(updatedVersions);
      }

      if (batchUploadList.length > 1) {
        const remaining = batchUploadList.filter(b => b.fileName !== uploadPreview.fileName);
        setBatchUploadList(remaining);
        if (remaining.length > 0) {
          setUploadPreview(remaining[0]);
          if (remaining[0].detectedUnitId) setSelectedUnitId(remaining[0].detectedUnitId);
        } else {
          setShowPreviewModal(false);
          setUploadPreview(null);
        }
      } else {
        setShowPreviewModal(false);
        setUploadPreview(null);
      }

      showToast('success', `Committed ${newRelease.totalQuestions} questions for ${unitTitle} (v${newRelease.version}).`);
      await refreshStats(syllabus);
    } catch (err) {
      console.error('Commit error:', err);
      showToast('error', 'Failed to commit questions to database.');
    } finally {
      setCommitting(false);
    }
  }

  // Commit All Batch Units to Firestore at once
  async function handleCommitAllBatchUnits() {
    if (!batchUploadList.length) return;
    setCommitting(true);
    let committedCount = 0;
    let totalQuestionsCount = 0;
    try {
      const totalUnits = batchUploadList.length;
      for (let i = 0; i < batchUploadList.length; i++) {
        const batchItem = batchUploadList[i];
        if (!batchItem.validQuestions?.length) continue;

        const unitId = batchItem.detectedUnitId || `unit_${i + 1}`;
        const targetUnit = syllabus.find(u => u.unitId === unitId);
        const targetTest = schedule.find(t => t.id === unitId);
        const unitTitle = unitId === 'diagnostic_demo'
          ? 'Diagnostic Entrance Assessment Demo (30 MCQs)'
          : (targetTest ? `${targetTest.code}: ${targetTest.title}` : targetUnit ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` : unitId);

        setCommitProgress({ current: i + 1, total: totalUnits, unitTitle });

        await commitUnitQuestions({
          unitId,
          unitTitle,
          questions: batchItem.validQuestions,
          fileName: batchItem.fileName,
          userEmail: currentUser?.email || 'admin'
        });
        committedCount++;
        totalQuestionsCount += batchItem.validQuestions.length;
      }

      setShowPreviewModal(false);
      setUploadPreview(null);
      setBatchUploadList([]);

      // Refresh current active unit & stats
      const [activeData, versions] = await Promise.all([
        getUnitQuestions(selectedUnitId),
        getUnitVersions(selectedUnitId)
      ]);
      setUnitActiveData(activeData);
      setUnitVersions(versions);
      await refreshStats(syllabus);

      showToast('success', `🎉 Successfully committed all ${committedCount} Units (${totalQuestionsCount} questions) to Database!`);
    } catch (err) {
      console.error('Batch commit error:', err);
      showToast('error', 'Failed to commit all units to database.');
    } finally {
      setCommitting(false);
      setCommitProgress({ current: 0, total: 0, unitTitle: '' });
    }
  }

  // Rollback to specific version
  async function handleRollback(versionItem) {
    const confirmRollback = window.confirm(
      `Rollback ${selectedUnitId} to Version ${versionItem.versionNumber} (${versionItem.questionCount} questions)?\n\nYour current active questions will be safely archived into history.`
    );
    if (!confirmRollback) return;

    setSaving(true);
    try {
      const restored = await rollbackUnitToVersion({
        unitId: selectedUnitId,
        versionItem,
        userEmail: currentUser?.email || 'admin'
      });
      setUnitActiveData(restored);
      const updatedVersions = await getUnitVersions(selectedUnitId);
      setUnitVersions(updatedVersions);
      await refreshStats(syllabus);
      showToast('success', `Rolled back to Version ${versionItem.versionNumber} successfully.`);
    } catch (err) {
      console.error('Rollback error:', err);
      showToast('error', 'Failed to execute rollback.');
    } finally {
      setSaving(false);
    }
  }

  // Download active or historical version as .xlsx
  function handleDownloadQuestions(questions, title, version) {
    try {
      exportQuestionsToExcel(questions, title, version);
      showToast('success', 'Excel file generated and downloading.');
    } catch (err) {
      showToast('error', err.message);
    }
  }

  // Filter by the categories in the revised source calendar.
  const filteredSchedule = schedule.filter(t => {
    const matchesFilter = scheduleFilter === 'all' ||
      (scheduleFilter === 'mock' && t.category === 'Mock') ||
      (scheduleFilter === 'unit' && t.category === 'Subunit Test') ||
      (scheduleFilter === 'final' && ['Finale', 'Real Exam'].includes(t.category));
    if (!matchesFilter) return false;
    const q = scheduleSearch.trim().toLowerCase();
    return !q || [t.code, t.title, t.description, t.unitCovered, t.category]
      .some(value => value?.toLowerCase().includes(q));
  });
  if (loading) {
    return (
      <div className="inbox-loading" style={{ minHeight: '300px' }}>
        <div className="admin-spinner"></div>
        <p>Loading Botany Test Series data &amp; syllabus...</p>
      </div>
    );
  }

  return (
    <div className="botany-admin-suite">
      {toast.show && (
        <div className={`admin-toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      <input ref={bankFileInputRef} className="schedule-file-input" type="file" accept=".xlsx,.xls" aria-label="Choose question bank workbook" onChange={handleBankFileChange} />

      {/* Sub Navigation Bar */}
      <div className="botany-nav-tabs">
        <button 
          className={`botany-subtab-btn ${subTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setSubTab('schedule')}
        >
          <Calendar size={15} /> <span className="tab-label-full">Tests &amp; banks</span><span className="tab-label-mobile">Tests</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'settings' ? 'active' : ''}`}
          onClick={() => setSubTab('settings')}
        >
          <Settings size={15} /> <span>Settings</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setSubTab('subscribers')}
        >
          <Users size={15} /> <span className="tab-label-full">Subscribers ({subscribers.length})</span><span className="tab-label-mobile">Students ({subscribers.length})</span>
        </button>
      </div>

      {/* SUBTAB 3: TEST SCHEDULE */}
      {subTab === 'schedule' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <div>
              <h3>50-Test Subunit-Wise Calendar &amp; Schedule</h3>
              <p className="schedule-header-help" style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review syllabus scope, manage question banks, and set availability for each test.
              </p>
            </div>
            <div className="botany-card-actions schedule-header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => inspectBank('diagnostic_demo')}>
                <FileSpreadsheet size={14} /> Free demo bank
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleMasterSync} disabled={saving} title="Refresh the master syllabus and schedule in Firebase">
                <RefreshCw size={14} className={saving ? 'spin' : ''} /> Sync master
              </button>
              <input
                type="text"
                placeholder="Search tests or topics..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.82rem', width: '150px' }}
              />
              <select 
                value={scheduleFilter} 
                onChange={(e) => setScheduleFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
              >
                <option value="all">All 50 Tests</option>
                <option value="unit">Subunit Tests Only</option>
                <option value="final">Finale &amp; Real Exam</option>
                <option value="mock">Full Mocks Only</option>
              </select>
            </div>
          </div>

          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Test Title &amp; Scope</th>
                  <th>Category</th>
                  <th>Coverage</th>
                  <th>Questions &amp; Bank Status</th>
                  <th>Duration</th>
                  <th>Public label</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((t) => {
                  let badgeClass = 'badge-unit';
                  if (t.category === 'Mock') badgeClass = 'badge-mock';
                  else if (['Finale', 'Real Exam'].includes(t.category)) badgeClass = 'badge-cluster';
                  else if (t.category.includes('Review') || t.category.includes('Analysis')) badgeClass = 'badge-review';

                  const testStats = getTestQuestionStats(t, questionStats?.testBankStats);
                  const draft = statusDrafts[t.id] || { status: t.availabilityStatus || 'auto', label: t.availabilityLabel || '' };
                  const availability = getBotanyTestAvailability(
                    { ...t, availabilityStatus: draft.status, availabilityLabel: draft.label },
                    t.id === 'diagnostic_demo' ? (questionStats?.demoStats?.questionCount || 0) : testStats.uploadedCount
                  );
                  const statusChanged = draft.status !== (t.availabilityStatus || 'auto') ||
                    (draft.status === 'custom' && draft.label.trim() !== (t.availabilityLabel || ''));

                  return (
                    <tr key={t.id}>
                      <td data-label="Number" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.sequence}</td>
                      <td data-label="Code" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t.code}</td>
                      <td data-label="Test and syllabus" style={{ fontWeight: 600 }}>
                        {t.title}
                        {t.description && (
                          <details className="admin-test-scope">
                            <summary>View syllabus scope</summary>
                            <p>{t.description}</p>
                          </details>
                        )}
                      </td>
                      <td data-label="Category">
                        <span className={`schedule-badge ${badgeClass}`}>{t.category}</span>
                      </td>
                      <td data-label="Coverage" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.unitCovered}</td>
                      <td data-label="Question bank">
                        {t.questionCount > 0 ? (
                          <div className="schedule-q-cell">
                            <div className={`q-target-line ${testStats.statusType === 'partial' ? 'partial' : ''}`}>
                              <strong>{testStats.uploadedCount}</strong><span> / {t.questionCount} Q</span>
                            </div>
                            {testStats.hasBank && (
                              <div 
                                className={`schedule-bank-status ${testStats.statusType}`}
                                title={`Live bank coverage: ${testStats.uploadedCount} MCQs with ${testStats.analysisPct}% 4-option scientific rationale`}
                              >
                                <span className="bank-status-dot"></span>
                                <span className="bank-status-text">
                                  {testStats.uploadedCount > 0 ? `${testStats.analysisPct}% explained` : 'Pending upload'}
                                </span>
                              </div>
                            )}
                            <div className="schedule-bank-actions">
                              <button type="button" className="schedule-template-btn" onClick={() => handleDownloadBankTemplate(t.id)} title={`Download ${t.code} question bank template for ${t.questionCount} questions`} aria-label={`Download ${t.code} question bank template`}><Download size={14} /><span>Download</span></button>
                              <button type="button" className="schedule-template-btn" onClick={() => chooseBankFile(t.id)} disabled={saving} title={`Upload ${t.code} question bank`} aria-label={`Upload question bank for ${t.code}`}><Upload size={14} /><span>Upload</span></button>
                              <button type="button" className="schedule-template-btn" onClick={() => inspectBank(t.id)} title={`Inspect ${t.code} question bank`} aria-label={`Inspect question bank for ${t.code}`}><FileSpreadsheet size={14} /><span>Inspect</span></button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td data-label="Duration" style={{ color: 'var(--text-muted)' }}>
                        {t.durationMinutes > 0 ? `${t.durationMinutes} min` : 'Rest / Analysis'}
                      </td>
                      <td data-label="Public label">
                        <div className="test-status-editor">
                          <span className={`test-status-preview ${availability.tone}`}>{availability.label}</span>
                          <label className="sr-only" htmlFor={`test-status-${t.id}`}>Public status for {t.code}</label>
                          <select
                            id={`test-status-${t.id}`}
                            value={draft.status}
                            onChange={(event) => updateStatusDraft(t, { status: event.target.value })}
                            disabled={Boolean(savingTestStatus)}
                          >
                            {BOTANY_AVAILABILITY_OPTIONS.map(option => (
                              <option key={option.value} value={option.value} disabled={option.value === 'ready' && testStats.uploadedCount < t.questionCount}>{option.label}</option>
                            ))}
                          </select>
                          {draft.status === 'custom' && (
                            <input
                              type="text"
                              maxLength={40}
                              aria-label={`Custom public label for ${t.code}`}
                              placeholder="e.g. Opens next week"
                              value={draft.label}
                              onChange={(event) => updateStatusDraft(t, { label: event.target.value })}
                              disabled={Boolean(savingTestStatus)}
                            />
                          )}
                          {statusChanged && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => saveTestStatus(t)}
                              disabled={Boolean(savingTestStatus) || (draft.status === 'custom' && !draft.label.trim())}
                            >
                              <Save size={14} /> {savingTestStatus === t.id ? 'Saving…' : 'Save label'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected bank details and version history */}
      {isBankEditorOpen && (
        <div className="bank-editor-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsBankEditorOpen(false); }}>
          <div className="bank-editor-modal" role="dialog" aria-modal="true" aria-label="Question bank details" onKeyDown={(event) => { if (event.key === 'Escape') setIsBankEditorOpen(false); }}>
            <div className="excel-hub-grid">
            {/* Main Upload Canvas */}
            <div className="botany-card">
              <div className="botany-card-header">
                <div>
                  <h3>
                    {excelBankMode === 'units' && 'Unit bank'}
                    {excelBankMode === 'demo' && 'Free diagnostic bank'}
                    {excelBankMode === 'tests' && `${schedule.find(t => t.id === selectedUnitId)?.code || 'Test'} bank`}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {excelBankMode === 'units' && (syllabus.find(u => u.unitId === selectedUnitId)?.title || selectedUnitId)}
                    {excelBankMode === 'demo' && '30-question free entrance test'}
                    {excelBankMode === 'tests' && (schedule.find(t => t.id === selectedUnitId)?.title || selectedUnitId)}
                  </p>
                </div>
                <div className="botany-card-actions">
                  {excelBankMode === 'demo' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDownloadBankTemplate('diagnostic_demo')}><Download size={13} /> Template</button>}
                  {excelBankMode === 'demo' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => chooseBankFile('diagnostic_demo')} disabled={saving}><Upload size={13} /> Upload</button>}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsBankEditorOpen(false)} autoFocus>Close</button>
                </div>
              </div>

              {/* Currently Active Release Summary */}
              <div ref={activeBankRef} tabIndex={-1} className="active-bank-detail">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Active Database Questions: {
                      selectedUnitId === 'diagnostic_demo'
                        ? '🎯 Diagnostic Demo Entrance Test (Free Demo CBT)'
                        : (syllabus.find(u => u.unitId === selectedUnitId)
                            ? `Unit ${syllabus.find(u => u.unitId === selectedUnitId).unitNumber}: ${syllabus.find(u => u.unitId === selectedUnitId).title}`
                            : (schedule.find(t => t.id === selectedUnitId)?.title || selectedUnitId))
                    }
                  </h4>
                  {unitActiveData?.questions?.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadQuestions(unitActiveData.questions, selectedUnitId, unitActiveData.version || 1)}
                    >
                      <Download size={13} /> Export Active .xlsx
                    </button>
                  )}
                </div>

              {loadingUnit ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  Loading unit questions...
                </div>
              ) : unitActiveData?.questions?.length ? (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <span><strong>Active Version:</strong> v{unitActiveData.version || 1}</span>
                    <span><strong>Total Questions:</strong> {unitActiveData.totalQuestions || unitActiveData.questions.length}</span>
                    <span><strong>Updated:</strong> {new Date(unitActiveData.lastUpdated).toLocaleDateString()}</span>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.5rem' }}>
                    {unitActiveData.questions.slice(0, 5).map((q, i) => (
                      <div key={q.id || i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                        <strong style={{ color: 'var(--accent-primary)' }}>Q{i + 1}.</strong> {q.question}
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Ans: <strong>Option {q.correctOption}</strong> | {q[`option${q.correctOption}`]}
                        </div>
                      </div>
                    ))}
                    {unitActiveData.questions.length > 5 && (
                      <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ... and {unitActiveData.questions.length - 5} more questions in active release
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No questions in this bank yet. Download its template from the schedule or unit bank row, then upload the completed workbook.
                </div>
              )}
            </div>
          </div>

          {/* Historical Versions Sidebar (Earlier 3 Versions) */}
          <div className="botany-card">
            <div className="botany-card-header">
              <h3>Version History (Max 3)</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              The earlier 3 versions are stored automatically in Firebase. You can re-download or rollback anytime.
            </p>

            {unitVersions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                No prior archived versions for this unit yet.
              </div>
            ) : (
              <div>
                {unitVersions.map((v) => (
                  <div key={v.id} className="version-card">
                    <div className="version-card-top">
                      <span className="version-badge">Version {v.versionNumber}</span>
                      <span className="version-date">
                        {v.uploadedAt ? new Date(v.uploadedAt).toLocaleDateString() : 'Previous'}
                      </span>
                    </div>
                    <div className="version-meta">
                      <div><strong>{v.questionCount}</strong> questions</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {v.fileName}
                      </div>
                    </div>
                    <div className="version-actions">
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.74rem', padding: '0.3rem 0.5rem' }}
                        onClick={() => handleDownloadQuestions(v.questions, selectedUnitId, v.versionNumber)}
                      >
                        <Download size={12} /> Download .xlsx
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.3rem 0.5rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                        onClick={() => handleRollback(v)}
                      >
                        <RotateCcw size={12} /> Rollback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SETTINGS & PRICING */}
      {subTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSaveSettings} className="botany-card">
            <div className="botany-card-header">
              <h3>Test Series Settings</h3>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                <Save size={14} /> <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            <div className="settings-form-grid botany-settings-form">
              <label className="toggle-switch-row">
                <div>
                  <div className="toggle-switch-label">Prominent Placement</div>
                  <div className="toggle-switch-sub">Homepage spotlight and banner</div>
                </div>
                <input 
                  type="checkbox"
                  checked={!!settings?.isProminent}
                  onChange={(e) => setSettings({ ...settings, isProminent: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>

              <div className="admin-form-group">
                <label>Spotlight Until</label>
                <input 
                  type="date"
                  value={settings?.prominentUntil || ''}
                  onChange={(e) => setSettings({ ...settings, prominentUntil: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Series Price (₹)</label>
                <input 
                  type="number"
                  value={settings?.fullSeriesPrice || 1499}
                  onChange={(e) => setSettings({ ...settings, fullSeriesPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Original MRP (₹)</label>
                <input 
                  type="number"
                  value={settings?.originalPrice || 2499}
                  onChange={(e) => setSettings({ ...settings, originalPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Single Test Price (₹)</label>
                <input 
                  type="number"
                  value={settings?.unitWisePrice || 199}
                  onChange={(e) => setSettings({ ...settings, unitWisePrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Razorpay Key ID</label>
                <input 
                  type="text"
                  placeholder="rzp_live_TGUYt8AMIuHwLa"
                  value={settings?.razorpayKey || ''}
                  onChange={(e) => setSettings({ ...settings, razorpayKey: e.target.value })}
                />
                <span className="settings-field-note">Approved domain: nexliftech.space</span>
              </div>

              <div className="admin-form-group">
                <label>Receipt &amp; Support Email</label>
                <input 
                  type="email"
                  placeholder="admissions@nexliftech.space"
                  value={settings?.contactSupportEmail || 'admissions@nexliftech.space'}
                  onChange={(e) => setSettings({ ...settings, contactSupportEmail: e.target.value })}
                />
              </div>

              <div className="admin-form-group settings-banner-field">
                <label>Banner Highlight Message</label>
                <input 
                  type="text"
                  value={settings?.subtitle || ''}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                />
              </div>
            </div>
          </form>

          {/* Dedicated Promo Codes & Discount Coupons Manager */}
          <div className="botany-card">
            <div className="botany-card-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag size={17} style={{ color: 'var(--accent-primary)' }} />
                  <span>Discount &amp; Promo Codes Manager</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Create and manage student discount codes saved directly in database. No hardcoded codes.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAddingPromo(!isAddingPromo)}
              >
                {isAddingPromo ? <X size={14} /> : <Plus size={14} />}
                <span>{isAddingPromo ? 'Cancel' : 'Create Promo Code'}</span>
              </button>
            </div>

            {/* Create Promo Code Form Modal / Box */}
            {isAddingPromo && (
              <form onSubmit={handleAddPromoCode} className="promo-form-box">
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Create New Discount Promo Code
                </h4>
                <div className="promo-form-grid">
                  <div className="admin-form-group">
                    <label>Code (Uppercase) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BOTANY20, PSC2026"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Discount Type *</label>
                    <select
                      value={newPromo.discountType}
                      onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                    >
                      <option value="fixed">Flat Rupee (₹ OFF)</option>
                      <option value="percentage">Percentage (% OFF)</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Discount Value *</label>
                    <input 
                      type="number"
                      placeholder={newPromo.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 300'}
                      value={newPromo.discountValue}
                      onChange={(e) => setNewPromo({ ...newPromo, discountValue: Number(e.target.value) })}
                      required
                      min={1}
                      max={newPromo.discountType === 'percentage' ? 100 : 5000}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Min. Order Value (₹ INR)</label>
                    <input 
                      type="number"
                      placeholder="0 (no minimum)"
                      value={newPromo.minOrder || ''}
                      onChange={(e) => setNewPromo({ ...newPromo, minOrder: Number(e.target.value) })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Valid Until (Optional Expiry)</label>
                    <input 
                      type="date"
                      value={newPromo.validUntil || ''}
                      onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Description / Internal Note</label>
                    <input 
                      type="text"
                      placeholder="e.g. Early Aspirants Launch Discount (First 100 Students)"
                      value={newPromo.description || ''}
                      onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingPromo(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Save size={13} />
                    <span>Save Promo Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* Configured Promo Codes */}
            {(!settings?.promoCodes || settings.promoCodes.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '1.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px dashed var(--border-light)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No active promo codes created yet. Click <strong>"Create Promo Code"</strong> above to set up candidate discounts.
              </div>
            ) : (
              <div className="promo-cards-grid">
                {settings.promoCodes.map((p, pIdx) => {
                  const isExpired = p.validUntil && new Date(p.validUntil) < new Date();
                  return (
                    <div key={p.code || pIdx} className={`promo-card ${p.isActive !== false && !isExpired ? 'is-active' : ''}`}>
                      <div className="promo-card-top">
                        <span className="promo-code-pill">{p.code}</span>
                        <span className="promo-discount-badge">
                          {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                        </span>
                      </div>

                      {p.description && (
                        <div className="promo-card-desc">{p.description}</div>
                      )}

                      <div className="promo-card-meta">
                        {p.minOrder > 0 && <span>Min Order: ₹{p.minOrder}</span>}
                        {p.validUntil ? (
                          <span style={{ color: isExpired ? '#ef4444' : 'inherit' }}>
                            {isExpired ? '⚠️ Expired: ' : 'Expires: '}{p.validUntil}
                          </span>
                        ) : (
                          <span>No expiration date</span>
                        )}
                      </div>

                      <div className="promo-card-actions">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.74rem', color: p.isActive !== false ? 'var(--success)' : 'var(--text-muted)' }}>
                          <input 
                            type="checkbox"
                            checked={p.isActive !== false}
                            onChange={() => handleTogglePromoActive(p.code)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{p.isActive !== false ? 'Active' : 'Disabled'}</span>
                        </label>
                        <button 
                          type="button" 
                          onClick={() => handleDeletePromoCode(p.code)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                          title="Delete promo code"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 6: SUBSCRIBERS */}
      {subTab === 'subscribers' && (
        <div className="botany-card">
          <div className="botany-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3>Registered &amp; Enrolled Subscribers</h3>
              <span className="botany-header-badge">{subscribers.length} Active Subscriptions</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowEnrollModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}
            >
              <UserPlus size={15} />
              <span>Grant Manual Access / Enroll</span>
            </button>
          </div>

          {subscribers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>👥</div>
              <p style={{ margin: 0 }}>No active subscriptions recorded yet.</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem' }}>
                As students enroll via Razorpay or sign in, or when Super Admin clicks <strong>"Grant Manual Access / Enroll"</strong> above, active records will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Amount / Type</th>
                    <th>Payment ID / Grant</th>
                    <th>Enrolled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => {
                    const isManual = sub.razorpayPaymentId?.startsWith('MANUAL') || sub.amountPaid === 0 || sub.grantedBy;
                    return (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.userName || 'Student'}</td>
                        <td>
                          <code>{sub.userEmail}</code>
                        </td>
                        <td>
                          <span className="schedule-badge badge-unit">
                            {sub.planType === 'full_series' 
                              ? 'Full 50-Test Series'
                              : `Unit Pass (${sub.allowedUnits?.join(', ') || 'Unit 1'})`}
                          </span>
                        </td>
                        <td>
                          {isManual ? (
                            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.76rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              Free / Admin Grant
                            </span>
                          ) : (
                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{sub.amountPaid}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                          {isManual ? (
                            <span title={`Granted by ${sub.grantedBy || 'Super Admin'}: ${sub.note || ''}`}>
                              🏷️ {sub.note || 'Manual Access'}
                            </span>
                          ) : (
                            sub.razorpayPaymentId || 'Direct'
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {sub.activatedAt ? new Date(sub.activatedAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td>
                          <span className="schedule-badge badge-cluster">
                            {sub.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW & CONFIRMATION MODAL */}
      {showPreviewModal && uploadPreview && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Excel Upload Preview: {uploadPreview.fileName}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Target bank:
                  </span>
                  <select
                    value={uploadPreview.detectedUnitId || selectedUnitId}
                    onChange={(e) => {
                      const newUId = e.target.value;
                      setSelectedUnitId(newUId);
                      if (newUId === 'diagnostic_demo') { setExcelBankMode('demo'); }
                      else if (newUId.startsWith('test_')) { setExcelBankMode('tests'); }
                      else { setExcelBankMode('units'); }
                      setUploadPreview(prev => ({ ...prev, detectedUnitId: newUId }));
                      setBatchUploadList(prev => prev.map(item => item.fileName === uploadPreview.fileName ? { ...item, detectedUnitId: newUId } : item));
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  >
                    <optgroup label="Free Entrance Assessment">
                      <option value="diagnostic_demo">🎯 Diagnostic Demo Entrance Test (10-30 MCQs)</option>
                    </optgroup>
                    <optgroup label="Official Calendar Entries">
                      {schedule.filter(t => t.isTest).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.code}: {t.title} ({t.category})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowPreviewModal(false);
                  setBatchUploadList([]);
                }}
              >
                Close
              </button>
            </div>

            {/* If Batch Mode (Multiple units loaded) - Unit Navigation Tabs */}
            {batchUploadList.length > 1 && (
              <div style={{ padding: '0.65rem 1.25rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Layers size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ALL {batchUploadList.length} UNITS DETECTED: Click tabs to preview questions
                    </span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.55rem', borderRadius: '10px' }}>
                    Total: {batchUploadList.reduce((acc, b) => acc + b.validCount, 0)} Questions
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                  {batchUploadList.map((bItem, bIdx) => {
                    const uId = bItem.detectedUnitId || `unit_${bIdx + 1}`;
                    const targetU = syllabus.find(u => u.unitId === uId);
                    const label = uId === 'diagnostic_demo'
                      ? '🎯 Demo CBT'
                      : (targetU ? `Unit ${targetU.unitNumber}` : `Unit ${bIdx + 1}`);
                    const isActive = uploadPreview.fileName === bItem.fileName;
                    return (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => {
                          setUploadPreview(bItem);
                          if (bItem.detectedUnitId) {
                            setSelectedUnitId(bItem.detectedUnitId);
                            if (bItem.detectedUnitId === 'diagnostic_demo') { setExcelBankMode('demo'); }
                            else if (bItem.detectedUnitId.startsWith('test_')) { setExcelBankMode('tests'); }
                            else { setExcelBankMode('units'); }
                          }
                        }}
                        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {bItem.invalidCount > 0 ? <AlertCircle size={12} color="var(--danger)" /> : <CheckCircle2 size={12} color="var(--success)" />}
                        <span>{label} ({bItem.validCount} Qs)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="preview-modal-body">
              {/* Diff Version Transition & Upgrade Banner */}
              {questionDiff && (
                <div className="preview-version-upgrade-banner">
                  <div className="diff-version-info">
                    <Sparkles size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span>
                      {questionDiff.hasExistingBank
                        ? `Version Upgrade: Active v${questionDiff.existingVersion} (${questionDiff.totalExisting} MCQs) ➔ Target v${questionDiff.targetVersion} (${questionDiff.totalNew} MCQs)`
                        : `Initial Release: v1 (${questionDiff.totalNew} MCQs)`}
                    </span>
                  </div>
                  <div className="diff-stat-chips">
                    {questionDiff.addedCount > 0 && (
                      <span className="diff-chip added">+{questionDiff.addedCount} Added</span>
                    )}
                    {questionDiff.modifiedCount > 0 && (
                      <span className="diff-chip modified">~{questionDiff.modifiedCount} Modified</span>
                    )}
                    {questionDiff.deletedCount > 0 && (
                      <span className="diff-chip deleted">-{questionDiff.deletedCount} Deleted</span>
                    )}
                    <span className="diff-chip unchanged">={questionDiff.unchangedCount} Unchanged</span>
                  </div>
                </div>
              )}

              {/* Stat summary bar */}
              <div className="preview-stat-bar">
                <div className="preview-stat-item">
                  <span>Total Rows Detected:</span>
                  <strong>{uploadPreview.totalRows}</strong>
                </div>
                <div className="preview-stat-item valid">
                  <CheckCircle size={15} />
                  <span>Valid Questions:</span>
                  <strong>{uploadPreview.validCount}</strong>
                </div>
                {uploadPreview.invalidCount > 0 && (
                  <div className="preview-stat-item invalid">
                    <AlertCircle size={15} />
                    <span>Errors / Incomplete:</span>
                    <strong>{uploadPreview.invalidCount}</strong>
                  </div>
                )}
              </div>

              {/* Diff Filter Tabs */}
              {questionDiff && questionDiff.hasExistingBank && (
                <div className="diff-filter-tabs">
                  <button
                    type="button"
                    className={`diff-filter-btn ${diffFilterTab === 'all' ? 'active' : ''}`}
                    onClick={() => setDiffFilterTab('all')}
                  >
                    All Uploaded ({questionDiff.diffQuestions.length})
                  </button>
                  {questionDiff.modifiedCount > 0 && (
                    <button
                      type="button"
                      className={`diff-filter-btn tab-modified ${diffFilterTab === 'modified' ? 'active' : ''}`}
                      onClick={() => setDiffFilterTab('modified')}
                    >
                      ✏️ Modified ({questionDiff.modifiedCount})
                    </button>
                  )}
                  {questionDiff.addedCount > 0 && (
                    <button
                      type="button"
                      className={`diff-filter-btn tab-added ${diffFilterTab === 'added' ? 'active' : ''}`}
                      onClick={() => setDiffFilterTab('added')}
                    >
                      ➕ Added ({questionDiff.addedCount})
                    </button>
                  )}
                  {questionDiff.deletedCount > 0 && (
                    <button
                      type="button"
                      className={`diff-filter-btn tab-deleted ${diffFilterTab === 'deleted' ? 'active' : ''}`}
                      onClick={() => setDiffFilterTab('deleted')}
                    >
                      ➖ Deleted ({questionDiff.deletedCount})
                    </button>
                  )}
                  {questionDiff.unchangedCount > 0 && (
                    <button
                      type="button"
                      className={`diff-filter-btn ${diffFilterTab === 'unchanged' ? 'active' : ''}`}
                      onClick={() => setDiffFilterTab('unchanged')}
                    >
                      = Unchanged ({questionDiff.unchangedCount})
                    </button>
                  )}
                </div>
              )}

              {/* Questions list */}
              <div className="preview-questions-list">
                {diffFilterTab === 'deleted' ? (
                  questionDiff?.deletedQuestions?.map((dq, idx) => (
                    <div key={dq.id || idx} className="preview-q-card is-deleted">
                      <div className="preview-q-header">
                        <span className="diff-badge badge-deleted">➖ Removed / Deleted</span>
                        <span>Previous Slot: Q{dq.sNo || idx + 1} (in v{questionDiff.existingVersion})</span>
                      </div>
                      <div className="preview-q-text" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        <strong>Q{dq.sNo || idx + 1}.</strong> {dq.question}
                      </div>
                      <div className="preview-options-grid" style={{ opacity: 0.7 }}>
                        <div className={`preview-opt-item ${dq.correctOption === 'A' ? 'is-correct' : ''}`}>
                          <strong>A:</strong> <span>{dq.optionA}</span>
                        </div>
                        <div className={`preview-opt-item ${dq.correctOption === 'B' ? 'is-correct' : ''}`}>
                          <strong>B:</strong> <span>{dq.optionB}</span>
                        </div>
                        <div className={`preview-opt-item ${dq.correctOption === 'C' ? 'is-correct' : ''}`}>
                          <strong>C:</strong> <span>{dq.optionC}</span>
                        </div>
                        <div className={`preview-opt-item ${dq.correctOption === 'D' ? 'is-correct' : ''}`}>
                          <strong>D:</strong> <span>{dq.optionD}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#ef4444', fontStyle: 'italic', marginTop: '0.35rem' }}>
                        Notice: This question will be deleted from the active bank when committing this release. (It remains archived in Version {questionDiff.existingVersion} history).
                      </div>
                    </div>
                  ))
                ) : (
                  (questionDiff?.diffQuestions || uploadPreview.questions)
                    .filter(q => {
                      if (diffFilterTab === 'all') return true;
                      return q.diffStatus === diffFilterTab;
                    })
                    .map((q, idx) => {
                      const isModified = q.diffStatus === 'modified';
                      const isAdded = q.diffStatus === 'added';
                      const isUnchanged = q.diffStatus === 'unchanged';

                      return (
                        <div 
                          key={q.id || idx} 
                          className={`preview-q-card ${!q.isValid ? 'has-error' : ''} ${isModified ? 'is-modified' : ''} ${isAdded ? 'is-added' : ''}`}
                        >
                          <div className="preview-q-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>Row {q.rowNumber} (Excel)</span>
                              {isModified && (
                                <span className="diff-badge badge-modified">✏️ Modified / Updated</span>
                              )}
                              {isAdded && (
                                <span className="diff-badge badge-added">➕ New Question</span>
                              )}
                              {isUnchanged && (
                                <span className="diff-chip unchanged" style={{ padding: '0.1rem 0.35rem', fontSize: '0.68rem' }}>
                                  = Unchanged
                                </span>
                              )}
                            </div>
                            <span>Correct: <strong>Option {q.correctOption || 'None'}</strong></span>
                          </div>

                          <div className="preview-q-text">
                            <strong>Q{idx + 1}.</strong> {q.question || <em style={{ color: '#ef4444' }}>Empty question statement</em>}
                          </div>

                          {/* Field changes inspector */}
                          {isModified && q.diffChanges?.length > 0 && (
                            <div className="diff-changes-inspector">
                              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <AlertCircle size={13} />
                                <span>Changes detected from current active Version {questionDiff.existingVersion}:</span>
                              </div>
                              {q.diffChanges.map((change, cIdx) => (
                                <div key={cIdx} className="diff-change-item">
                                  <span className="diff-change-field">• {change.field}:</span>
                                  <div className="diff-change-row">
                                    <span className="diff-old-tag">Previous</span>
                                    <span className="diff-old-val">{change.oldVal || '(Empty)'}</span>
                                  </div>
                                  <div className="diff-change-row">
                                    <span className="diff-new-tag">New</span>
                                    <span className="diff-new-val">{change.newVal || '(Empty)'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="preview-options-grid" style={{ marginTop: isModified ? '0.6rem' : '0' }}>
                            <div className={`preview-opt-item ${q.correctOption === 'A' ? 'is-correct' : ''}`}>
                              <strong>A:</strong> <span>{q.optionA || '—'}</span>
                            </div>
                            <div className={`preview-opt-item ${q.correctOption === 'B' ? 'is-correct' : ''}`}>
                              <strong>B:</strong> <span>{q.optionB || '—'}</span>
                            </div>
                            <div className={`preview-opt-item ${q.correctOption === 'C' ? 'is-correct' : ''}`}>
                              <strong>C:</strong> <span>{q.optionC || '—'}</span>
                            </div>
                            <div className={`preview-opt-item ${q.correctOption === 'D' ? 'is-correct' : ''}`}>
                              <strong>D:</strong> <span>{q.optionD || '—'}</span>
                            </div>
                          </div>

                          {/* Option analyses preview */}
                          <div className="preview-analyses-box">
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'A' ? 'var(--success)' : 'var(--text-secondary)' }}>Analysis A:</strong> {q.analysisA || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'B' ? 'var(--success)' : 'var(--text-secondary)' }}>Analysis B:</strong> {q.analysisB || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'C' ? 'var(--success)' : 'var(--text-secondary)' }}>Analysis C:</strong> {q.analysisC || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'D' ? 'var(--success)' : 'var(--text-secondary)' }}>Analysis D:</strong> {q.analysisD || '—'}
                            </div>
                            {q.referenceNote && (
                              <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.4rem', borderTop: '1px dashed var(--border-light)', paddingTop: '0.4rem', fontSize: '0.8rem' }}>
                                <strong>💡 Context Note:</strong> {q.referenceNote}
                              </div>
                            )}
                          </div>

                          {q.errors?.length > 0 && (
                            <div className="preview-error-box">
                              <strong>Validation issues in this row:</strong>
                              <ul style={{ margin: '4px 0 0 1rem', padding: 0 }}>
                                {q.errors.map((err, eIdx) => <li key={eIdx}>{err}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="preview-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowPreviewModal(false);
                  setBatchUploadList([]);
                }}
                disabled={committing}
              >
                Cancel &amp; Close
              </button>

              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {batchUploadList.length > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCommitQuestions}
                    disabled={committing || uploadPreview.validCount === 0}
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 600 }}
                  >
                    <Save size={14} />
                    <span>Commit This Unit Only ({uploadPreview.validCount} Qs)</span>
                  </button>
                )}

                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={batchUploadList.length > 1 ? handleCommitAllBatchUnits : handleCommitQuestions}
                  disabled={committing || (batchUploadList.length > 1 ? batchUploadList.reduce((acc, b) => acc + b.validCount, 0) === 0 : uploadPreview.validCount === 0)}
                  style={batchUploadList.length > 1 ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' } : {}}
                >
                  {committing ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>
                    {committing 
                      ? (commitProgress.total > 1 ? `Publishing Unit ${commitProgress.current} of ${commitProgress.total}...` : 'Archiving & Publishing...') 
                      : batchUploadList.length > 1
                      ? `Confirm & Commit All ${batchUploadList.length} Units (${batchUploadList.reduce((acc, b) => acc + b.validCount, 0)} Qs) to DB`
                      : `Confirm & Commit ${uploadPreview.validCount} Questions to DB`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ENROLLMENT & ACCESS GRANT MODAL */}
      {showEnrollModal && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-content" style={{ maxWidth: '540px' }}>
            <div className="preview-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>Grant Test Series Access Manually</span>
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Super Admin tool to grant instant VIP or offline access to candidate or faculty accounts (e.g. <code>aubidmalik00@gmail.com</code>).
                </p>
              </div>
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => setShowEnrollModal(false)}
                disabled={enrolling}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGrantManualAccess}>
              <div className="preview-modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    User / Student Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    placeholder="e.g. aubidmalik00@gmail.com or aspirant@gmail.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Access binds directly to this email upon Google or password login.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Candidate / Faculty Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={enrollForm.name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                    placeholder="e.g. Dr. Aubid Hussain Malik or Candidate Name"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div className="admin-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Access Plan
                  </label>
                  <select
                    value={enrollForm.planType}
                    onChange={(e) => setEnrollForm({ ...enrollForm, planType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="full_series">🌟 Full 50-Test Series (All Units + Mocks + Final Exams)</option>
                    <option value="unit_pass">📦 Single Unit-Wise Pass</option>
                  </select>
                </div>

                {enrollForm.planType === 'unit_pass' && (
                  <div className="admin-form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Select Unit Covered
                    </label>
                    <select
                      value={enrollForm.selectedUnit}
                      onChange={(e) => setEnrollForm({ ...enrollForm, selectedUnit: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem'
                      }}
                    >
                      {syllabus.map(u => (
                        <option key={u.id} value={u.id}>{u.unitNumber}: {u.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="admin-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Administrative Remark / Note
                  </label>
                  <input
                    type="text"
                    value={enrollForm.note}
                    onChange={(e) => setEnrollForm({ ...enrollForm, note: e.target.value })}
                    placeholder="e.g. VIP Faculty Account, Offline Cash, Scholarship"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div className="preview-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-light)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEnrollModal(false)}
                  disabled={enrolling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={enrolling || !enrollForm.email}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {enrolling ? <span className="btn-spinner"></span> : <CheckCircle2 size={15} />}
                  <span>{enrolling ? 'Granting Access...' : 'Activate Subscription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
