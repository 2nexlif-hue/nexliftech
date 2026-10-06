import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GraduationCap, BookOpen, Calendar, FileSpreadsheet, Settings, Users, 
  Download, Upload, RefreshCw, CheckCircle, AlertCircle, Clock, Eye, 
  RotateCcw, ChevronDown, ChevronUp, Save, ArrowRight, Sparkles, Layers, CheckCircle2,
  Tag, Trash2, Plus, Edit3, X, UserPlus
} from 'lucide-react';
import { 
  getBotanySettings, 
  saveBotanySettings, 
  getBotanySyllabus, 
  getBotanySchedule, 
  syncBotanyDataToFirestore,
  getUnitQuestions,
  getUnitVersions,
  commitUnitQuestions,
  rollbackUnitToVersion,
  getAllUnitsQuestionStats,
  getTestQuestionStats,
  commitAllSeedBanksToFirestore,
  grantManualSubscription
} from '../../utils/botanyFirestoreService';
import QuestionBankStatsMatrix from './QuestionBankStatsMatrix';
import { 
  downloadExcelTemplate, 
  parseExcelFile, 
  parseExcelBuffer, 
  exportQuestionsToExcel 
} from '../../utils/botanyExcelEngine';
import { computeQuestionBankDiff } from '../../utils/botanyDiff';
import { searchSyllabusAdvanced, HighlightMatch } from '../../utils/botanySearch';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import './AdminBotanyTestSeries.css';

export default function AdminBotanyTestSeries({ currentUser }) {
  // Navigation
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'syllabus' | 'schedule' | 'excel' | 'settings' | 'subscribers'

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

  // Excel Hub State
  const [excelBankMode, setExcelBankMode] = useState('units'); // 'units' | 'demo' | 'tests'
  const [selectedUnitId, setSelectedUnitId] = useState('unit_1');
  const [unitActiveData, setUnitActiveData] = useState(null);
  const [unitVersions, setUnitVersions] = useState([]);
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Upload & Preview state
  const [uploadPreview, setUploadPreview] = useState(null); // { questions, validCount, invalidCount, fileName, detectedUnitId }
  const [batchUploadList, setBatchUploadList] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState({ current: 0, total: 0, unitTitle: '' });
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

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

  // Syllabus UI
  const [expandedUnits, setExpandedUnits] = useState({ unit_1: true });
  const [syllabusSearch, setSyllabusSearch] = useState('');

  // Schedule UI
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [scheduleSearch, setScheduleSearch] = useState('');

  function showToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000);
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
    if (!window.confirm('Sync & seed master 10-Unit syllabus, 35-Test schedule, and default pricing settings to Firebase?')) {
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
      showToast('success', 'Master Botany syllabus & 35-test schedule successfully synced to Firebase.');
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
  async function processFiles(rawFiles) {
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

      // Auto-assign unit if not detected based on current mode & selection
      parsedList.forEach((item) => {
        if (!item.detectedUnitId) {
          if (excelBankMode === 'demo') {
            item.detectedUnitId = 'diagnostic_demo';
          } else if (excelBankMode === 'tests') {
            item.detectedUnitId = selectedUnitId.startsWith('test_') ? selectedUnitId : 'test_01';
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) processFiles(files);
  }

  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  }

  // Load all 10 prepared sample unit files from docs/
  async function handleLoadDocsSampleFiles() {
    setSaving(true);
    showToast('info', 'Loading 10 sample files prepared in docs/ ...');
    try {
      const parsedList = [];
      for (let i = 1; i <= 10; i++) {
        const padded = i < 10 ? `0${i}` : `${i}`;
        const fileName = `Botany_Unit_${padded}_MCQ_Question_Bank.xlsx`;
        const res = await fetch(`/sample_question_banks/${fileName}`);
        if (!res.ok) throw new Error(`Could not load ${fileName}`);
        const buf = await res.arrayBuffer();
        const parsed = parseExcelBuffer(buf, fileName);
        parsedList.push(parsed);
      }
      setBatchUploadList(parsedList);
      setUploadPreview(parsedList[0]);
      if (parsedList[0].detectedUnitId) {
        setSelectedUnitId(parsedList[0].detectedUnitId);
      }
      setShowPreviewModal(true);
      showToast('success', 'All 10 sample unit question banks loaded with 100 questions ready for preview!');
    } catch (err) {
      console.error('Error loading sample files:', err);
      showToast('error', err.message || 'Could not load sample files.');
    } finally {
      setSaving(false);
    }
  }

  // Load prepared 30-MCQ Entrance Demo file from docs/
  async function handleLoadEntranceDemoFile() {
    setSaving(true);
    showToast('info', 'Loading 30-MCQ Entrance Demo prepared in docs/ ...');
    try {
      const fileName = 'Botany_Entrance_30_MCQ_Mixed.xlsx';
      const res = await fetch(`/sample_question_banks/${fileName}`);
      if (!res.ok) throw new Error(`Could not load ${fileName}`);
      const buf = await res.arrayBuffer();
      const parsed = parseExcelBuffer(buf, fileName);
      setBatchUploadList([]);
      setUploadPreview(parsed);
      setSelectedUnitId('diagnostic_demo');
      setShowPreviewModal(true);
      showToast('success', 'Loaded 30-MCQ Entrance Demo ready for preview!');
    } catch (err) {
      console.error('Error loading demo file:', err);
      showToast('error', err.message || 'Could not load demo file.');
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
      const unitTitle = targetUnit 
        ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` 
        : (targetUnitId === 'diagnostic_demo' ? 'Diagnostic Entrance Assessment Demo (30 MCQs)' : targetUnitId);

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
        const unitTitle = unitId === 'diagnostic_demo'
          ? 'Diagnostic Entrance Assessment Demo (30 MCQs)'
          : (targetUnit ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` : unitId);

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

  // 1-Click Sync all 10 verified unit seed banks (100 MCQs) into Firestore
  async function handleCommitAllSeedBanks() {
    if (!window.confirm('Sync and commit all 10 verified unit question banks (100 MCQs with 100% 4-option rationale) to Firebase Firestore?')) {
      return;
    }
    setSaving(true);
    try {
      await commitAllSeedBanksToFirestore(currentUser?.email || 'admin');
      await refreshStats(syllabus);
      const activeData = await getUnitQuestions(selectedUnitId);
      const versions = await getUnitVersions(selectedUnitId);
      setUnitActiveData(activeData);
      setUnitVersions(versions);
      showToast('success', '🚀 All 10 unit question banks (100 MCQs) successfully synced to Firebase!');
    } catch (err) {
      console.error('Error committing all seed banks:', err);
      showToast('error', err.message || 'Failed to sync seed banks to Firebase.');
    } finally {
      setSaving(false);
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

  // Toggle unit accordion
  function toggleUnit(unitId) {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  }

  // Advanced Fuzzy & Semantic Syllabus Search in Admin
  const { results: filteredSyllabus, matchingUnitIds: adminMatchingUnits } = useMemo(() => {
    return searchSyllabusAdvanced(syllabus, syllabusSearch);
  }, [syllabus, syllabusSearch]);

  // Auto-expand matched units in admin syllabus
  useEffect(() => {
    if (syllabusSearch.trim() && adminMatchingUnits && adminMatchingUnits.size > 0) {
      const openObj = {};
      adminMatchingUnits.forEach(id => { openObj[id] = true; });
      setExpandedUnits(openObj);
    }
  }, [syllabusSearch, adminMatchingUnits]);

  // Filtered schedule
  const filteredSchedule = schedule.filter(t => {
    const matchesFilter = scheduleFilter === 'all' || 
      (scheduleFilter === 'mock' && t.category.includes('Mock')) ||
      (scheduleFilter === 'unit' && t.category.includes('Unit')) ||
      (scheduleFilter === 'cluster' && t.category.includes('Cluster'));
    
    if (!matchesFilter) return false;
    if (!scheduleSearch.trim()) return true;
    const q = scheduleSearch.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.dayLabel.toLowerCase().includes(q) || t.unitCovered.toLowerCase().includes(q);
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
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Suite Header */}
      <div className="botany-admin-header">
        <div className="botany-header-title-area">
          <h2>
            <GraduationCap className="accent-icon" size={24} />
            <span>Botany Assistant Professor Examination Suite</span>
            <span className="botany-header-badge">PSC Entrance 2026</span>
          </h2>
          <p className="botany-header-subtitle">
            Curated by Dr. Aubid Ahmad, Assistant Professor (Botany). Managed, hosted, and deployed via NexLifTech.
          </p>
        </div>

        <div className="botany-header-stats">
          <div className="botany-stat-pill" title="10 Official PSC Curriculum Units">
            <span className="botany-stat-label">Syllabus Units</span>
            <span className="botany-stat-val">{syllabus.length || 10}</span>
          </div>
          <div className="botany-stat-pill" title="Actual Questions Uploaded & Available across 10-Unit banks & Demo CBT">
            <span className="botany-stat-label">Bank MCQs Available</span>
            <span className="botany-stat-val" style={{ color: 'var(--accent-primary)' }}>
              {questionStats ? (questionStats.totalUploadedQuestions + (questionStats.demoStats?.questionCount || 0)) : 130}
            </span>
          </div>
          <div className="botany-stat-pill" title="Units with Question Banks Loaded into System">
            <span className="botany-stat-label">Units Loaded</span>
            <span className="botany-stat-val" style={{ color: '#10b981' }}>
              {questionStats ? `${questionStats.unitsLoadedCount}/10` : '10/10'}
            </span>
          </div>
          <div className="botany-stat-pill" title="Free Diagnostic Demo Entrance Assessment Questions Live">
            <span className="botany-stat-label">Demo CBT Live</span>
            <span className="botany-stat-val" style={{ color: '#10b981' }}>
              {questionStats?.demoStats ? `${questionStats.demoStats.questionCount} Qs` : '30 Qs'}
            </span>
          </div>
          <div className="botany-stat-pill" title="Complete 35-Test Series Target across Diagnostic, Units, Clusters and Mocks">
            <span className="botany-stat-label">Series Target</span>
            <span className="botany-stat-val">35 Tests (~2,700 Qs)</span>
          </div>
          <div className="botany-stat-pill" title="Registered & Enrolled Students">
            <span className="botany-stat-label">Enrolled Students</span>
            <span className="botany-stat-val">{subscribers.length}</span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="botany-nav-tabs">
        <button 
          className={`botany-subtab-btn ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          <Eye size={15} /> <span>Overview &amp; Launch</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'syllabus' ? 'active' : ''}`}
          onClick={() => setSubTab('syllabus')}
        >
          <BookOpen size={15} /> <span>10-Unit Syllabus</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setSubTab('schedule')}
        >
          <Calendar size={15} /> <span>35-Test Schedule</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'excel' ? 'active' : ''}`}
          onClick={() => setSubTab('excel')}
        >
          <FileSpreadsheet size={15} /> <span>Excel Question Bank &amp; Versioning</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'settings' ? 'active' : ''}`}
          onClick={() => setSubTab('settings')}
        >
          <Settings size={15} /> <span>Pricing &amp; Prominence</span>
        </button>
        <button 
          className={`botany-subtab-btn ${subTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setSubTab('subscribers')}
        >
          <Users size={15} /> <span>Subscribers ({subscribers.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW */}
      {subTab === 'overview' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <h3>Examination Structure &amp; Rapid Controls</h3>
            <div className="botany-card-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleMasterSync}
                disabled={saving}
                title="Initialize or reset Firestore documents with default syllabus and test schedule"
              >
                <RefreshCw size={14} className={saving ? 'spin' : ''} />
                <span>Sync Master Data to Firebase</span>
              </button>
              <a 
                href="/botany-test-series" 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary btn-sm"
              >
                <Eye size={14} /> <span>Open Student Portal View</span>
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="subunit-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={18} style={{ color: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Prominent on Website</h4>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Status: {settings?.isProminent ? <strong style={{ color: '#10b981' }}>Active Banner &amp; Spotlight</strong> : <span style={{ color: 'var(--text-muted)' }}>Inactive</span>}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active Until: {settings?.prominentUntil || 'Not configured'}
              </p>
            </div>

            <div className="subunit-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={18} style={{ color: 'var(--accent-primary)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Excel Question Hub</h4>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(124, 58, 237, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
                  {questionStats ? `${(questionStats.totalUploadedQuestions || 0) + (questionStats.demoStats?.questionCount || 0)} MCQs Live` : '130 MCQs Ready'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0 0 0.75rem 0', fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>10 Units Syllabus Banks:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{questionStats?.totalUploadedQuestions ?? 100} / 500 Qs ({questionStats?.unitsLoadedCount ?? 10}/10 Units)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Free Entrance Demo CBT:</span>
                  <strong style={{ color: '#10b981' }}>{questionStats?.demoStats?.questionCount ?? 30} MCQs Live</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>4-Option Rationale:</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{questionStats?.overallAnalysisPct ?? 100}% Complete</strong>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSubTab('excel')} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', width: '100%', justifyContent: 'center' }}
              >
                Go to Excel Hub &amp; Upload <ArrowRight size={13} />
              </button>
            </div>

            <div className="subunit-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={18} style={{ color: '#f59e0b' }} />
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Calendar Progression</h4>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Diagnostic (10 Oct) → 10 Unit Tests → 5 Clusters → J&amp;K Special → 9 Full Mocks (13 Nov).
              </p>
              <button 
                type="button" 
                onClick={() => setSubTab('schedule')} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                Inspect Schedule <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <QuestionBankStatsMatrix 
              questionStats={questionStats}
              mode="banner"
              committing={saving}
              onCommitAllSeed={handleCommitAllSeedBanks}
              onSelectUnit={(unitId) => {
                setSelectedUnitId(unitId);
                setSubTab('excel');
              }}
            />
          </div>
        </div>
      )}

      {/* SUBTAB 2: SYLLABUS REFERENCE */}
      {subTab === 'syllabus' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <div>
              <h3>Official Public Service Commission Syllabus (10 Units)</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Compiled by Sheikh Gulfam (1 July 2023) • Curated by Dr. Aubid Ahmad, Assistant Professor (Botany).
              </p>
            </div>
            <div className="botany-card-actions">
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const allExpanded = {};
                  syllabus.forEach(u => allExpanded[u.unitId] = true);
                  setExpandedUnits(allExpanded);
                }}
              >
                Expand All
              </button>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setExpandedUnits({})}
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="syllabus-search-bar">
            <input 
              type="text" 
              className="syllabus-search-input"
              placeholder="Search topics (e.g., TMV, Alexopolous, Bryophyta, APG-IV, Operon, CRISPR, ANOVA)..."
              value={syllabusSearch}
              onChange={(e) => setSyllabusSearch(e.target.value)}
            />
          </div>

          <div className="syllabus-units-list">
            {filteredSyllabus.map((unit) => {
              const isOpen = !!expandedUnits[unit.unitId];
              return (
                <div key={unit.unitId} className="syllabus-unit-item">
                  <button 
                    type="button" 
                    className="syllabus-unit-trigger"
                    onClick={() => toggleUnit(unit.unitId)}
                  >
                    <div className="syllabus-unit-trigger-left">
                      <span className="unit-number-badge">U{unit.unitNumber}</span>
                      <span>
                        Unit-{unit.unitNumber}: <HighlightMatch text={unit.title} query={syllabusSearch} matchedTerms={unit.matchedTerms} />
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {unit.subunits?.length || 0} Subunits
                      </span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="syllabus-unit-body">
                      <div className="subunits-grid">
                        {unit.subunits?.map((sub) => (
                          <div key={sub.id} className={`subunit-card ${sub.isMatched ? 'is-matched' : ''}`}>
                            <div className="subunit-title">
                              <HighlightMatch text={sub.title} query={syllabusSearch} matchedTerms={sub.matchedTerms} />
                            </div>
                            <p className="subunit-desc">
                              <HighlightMatch text={sub.description} query={syllabusSearch} matchedTerms={sub.matchedTerms} />
                            </p>
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

      {/* SUBTAB 3: TEST SCHEDULE */}
      {subTab === 'schedule' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <div>
              <h3>35-Test Subunit-Wise Calendar &amp; Schedule</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Detailed timetable from Diagnostic test to Mock 9 Grand Finale.
              </p>
            </div>
            <div className="botany-card-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search tests..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.82rem', width: '150px' }}
              />
              <select 
                value={scheduleFilter} 
                onChange={(e) => setScheduleFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
              >
                <option value="all">All Tests &amp; Days</option>
                <option value="unit">Unit Tests Only</option>
                <option value="cluster">Cluster Tests Only</option>
                <option value="mock">Full Mocks Only</option>
              </select>
            </div>
          </div>

          {/* QUESTION BANK READINESS & STATISTICAL AUDIT BANNER */}
          <QuestionBankStatsMatrix 
            questionStats={questionStats}
            mode="banner"
            committing={saving}
            onCommitAllSeed={handleCommitAllSeedBanks}
            onSelectUnit={(unitId) => {
              setSelectedUnitId(unitId);
              setSubTab('excel');
            }}
          />

          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date &amp; Day</th>
                  <th>Test Title</th>
                  <th>Category</th>
                  <th>Coverage</th>
                  <th>Questions &amp; Bank Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((t, idx) => {
                  let badgeClass = 'badge-unit';
                  if (t.category.includes('Mock')) badgeClass = 'badge-mock';
                  else if (t.category.includes('Cluster')) badgeClass = 'badge-cluster';
                  else if (t.category.includes('Review') || t.category.includes('Analysis')) badgeClass = 'badge-review';

                  const testStats = getTestQuestionStats(t, questionStats?.unitStats);

                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t.dayLabel}</td>
                      <td style={{ fontWeight: 600 }}>
                        {t.title}
                        {t.description && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 400 }}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`schedule-badge ${badgeClass}`}>{t.category}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.unitCovered}</td>
                      <td>
                        {t.questionCount > 0 ? (
                          <div className="schedule-q-cell">
                            <div className="q-target-line">{t.questionCount} Q Target</div>
                            {testStats.hasBank && (
                              <div 
                                className={`schedule-bank-status ${testStats.statusType}`}
                                title={`Live bank coverage: ${testStats.uploadedCount} MCQs with ${testStats.analysisPct}% 4-option scientific rationale`}
                              >
                                <span className="bank-status-dot"></span>
                                <span className="bank-status-text">{testStats.statusLabel}</span>
                                {testStats.analysisPct > 0 && (
                                  <span className="bank-status-badge">100% Explained</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {t.durationMinutes > 0 ? `${t.durationMinutes} min` : 'Rest / Analysis'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: EXCEL QUESTION BANK & VERSIONING */}
      {subTab === 'excel' && (
        <div className="excel-hub-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Detailed 10-Unit Statistical Matrix & Quality Audit */}
          <QuestionBankStatsMatrix 
            questionStats={questionStats}
            mode="full"
            committing={saving}
            onCommitAllSeed={handleCommitAllSeedBanks}
            onSelectUnit={(unitId) => {
              if (unitId === 'diagnostic_demo') {
                setExcelBankMode('demo');
              } else if (unitId.startsWith('test_')) {
                setExcelBankMode('tests');
              } else {
                setExcelBankMode('units');
              }
              setSelectedUnitId(unitId);
            }}
          />

          {/* Segmented Bank Mode Switcher */}
          <div className="bank-mode-pills-bar">
            <button
              type="button"
              className={`bank-mode-pill ${excelBankMode === 'units' ? 'active' : ''}`}
              onClick={() => {
                setExcelBankMode('units');
                if (selectedUnitId === 'diagnostic_demo' || selectedUnitId.startsWith('test_')) {
                  setSelectedUnitId('unit_1');
                }
              }}
            >
              <BookOpen size={16} />
              <span>📚 10-Unit Syllabus Question Banks</span>
              <span className="mode-pill-badge highlight">
                {questionStats ? `${questionStats.unitsLoadedCount}/10 Units` : 'Units 1–10'}
              </span>
            </button>

            <button
              type="button"
              className={`bank-mode-pill ${excelBankMode === 'demo' ? 'active' : ''}`}
              onClick={() => {
                setExcelBankMode('demo');
                setSelectedUnitId('diagnostic_demo');
              }}
            >
              <Sparkles size={16} />
              <span>🎯 Free Diagnostic Demo CBT</span>
              <span className="mode-pill-badge">
                {unitActiveData && selectedUnitId === 'diagnostic_demo'
                  ? `${unitActiveData.questions?.length || 30} MCQs Live`
                  : questionStats?.demoStats ? `${questionStats.demoStats.questionCount} MCQs Live` : '10–30 MCQs'}
              </span>
            </button>

            <button
              type="button"
              className={`bank-mode-pill ${excelBankMode === 'tests' ? 'active' : ''}`}
              onClick={() => {
                setExcelBankMode('tests');
                if (!selectedUnitId.startsWith('test_')) {
                  setSelectedUnitId('test_01');
                }
              }}
            >
              <Calendar size={16} />
              <span>📅 Official 35 Scheduled Tests</span>
              <span className="mode-pill-badge">35 Tests</span>
            </button>
          </div>

          <div className="excel-hub-grid">
            {/* Main Upload Canvas */}
            <div className="botany-card">
              <div className="botany-card-header">
                <div>
                  <h3>
                    {excelBankMode === 'units' && 'Upload 10 Units Question Bank (.xlsx)'}
                    {excelBankMode === 'demo' && 'Upload Free Diagnostic Demo CBT (.xlsx)'}
                    {excelBankMode === 'tests' && 'Upload Scheduled Test Question Bank (.xlsx)'}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {excelBankMode === 'units' && 'Upload curriculum questions for Units 1 to 10 with 4 options, answer key, 4-option scientific rationale, and context notes.'}
                    {excelBankMode === 'demo' && 'Upload 10 to 30 mixed-curriculum MCQs for the Free Entrance Assessment CBT. Includes 4-distractor scientific rationales and context notes.'}
                    {excelBankMode === 'tests' && 'Upload question bank for the selected scheduled test (T01 Diagnostic, Unit Tests T02-T21, Clusters T22-T26, or Full Mocks T27-T35).'}
                  </p>
                </div>
                <div className="botany-card-actions">
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (excelBankMode === 'demo' || selectedUnitId === 'diagnostic_demo') {
                        downloadExcelTemplate('diagnostic_demo', 'Diagnostic Demo Entrance Test (10-30 MCQs)');
                      } else if (excelBankMode === 'tests' || selectedUnitId.startsWith('test_')) {
                        const t = schedule.find(item => item.id === selectedUnitId);
                        downloadExcelTemplate(selectedUnitId, t ? t.title : selectedUnitId);
                      } else {
                        const unit = syllabus.find(u => u.unitId === selectedUnitId);
                        downloadExcelTemplate(selectedUnitId, unit ? unit.title : selectedUnitId);
                      }
                    }}
                  >
                    <Download size={14} /> 
                    <span>
                      {excelBankMode === 'demo' ? 'Download Demo Template .xlsx' : 'Download Template .xlsx'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mode-Specific Selectors & Quick Bars */}
              {excelBankMode === 'units' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Quick Select Unit to Inspect / Manage:
                    </label>
                    <span style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      Tip: Multi-select all 10 unit files at once below for batch import
                    </span>
                  </div>
                  {/* 10-Unit Quick Chips Row */}
                  <div className="units-quick-selector">
                    {syllabus.map(u => {
                      const qCount = questionStats?.unitStats?.[u.unitId]?.questionCount || 0;
                      const isSel = selectedUnitId === u.unitId;
                      return (
                        <button
                          key={u.unitId}
                          type="button"
                          className={`unit-chip-btn ${isSel ? 'active' : ''}`}
                          onClick={() => setSelectedUnitId(u.unitId)}
                        >
                          <span>Unit {u.unitNumber}</span>
                          <span className="chip-count">{qCount} Qs</span>
                        </button>
                      );
                    })}
                  </div>
                  <select 
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                  >
                    {syllabus.map(u => {
                      const count = questionStats?.unitStats?.[u.unitId]?.questionCount || 0;
                      return (
                        <option key={u.unitId} value={u.unitId}>
                          Unit {u.unitNumber}: {u.title} ({count} Qs active in DB)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {excelBankMode === 'demo' && (
                <div className="demo-status-banner">
                  <div className="demo-status-item">
                    <span className="demo-status-label">Demo Test Target</span>
                    <span className="demo-status-val">10 to 30 MCQs (Free CBT)</span>
                  </div>
                  <div className="demo-status-item">
                    <span className="demo-status-label">Active in Database</span>
                    <span className="demo-status-val" style={{ color: '#10b981' }}>
                      {unitActiveData && selectedUnitId === 'diagnostic_demo'
                        ? unitActiveData.questions?.length
                        : questionStats?.demoStats?.questionCount || 30} Questions Live
                    </span>
                  </div>
                  <div className="demo-status-item">
                    <span className="demo-status-label">Rationale Quality</span>
                    <span className="demo-status-val" style={{ color: 'var(--accent-primary)' }}>100% 4-Distractor Rationale</span>
                  </div>
                  <div className="demo-status-item">
                    <span className="demo-status-label">Candidate Access</span>
                    <span className="demo-status-val" style={{ color: '#10b981' }}>🟢 Instant Free Access</span>
                  </div>
                </div>
              )}

              {excelBankMode === 'tests' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Select Scheduled Test to Manage:
                  </label>
                  <select 
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                  >
                    {schedule.filter(t => t.isTest).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.id.replace('test_', 'T')}: {t.title} ({t.category} — {t.questionCount} Qs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mode-Tailored Drop Zone */}
              <div 
                className={`excel-drop-zone ${isDragging ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".xlsx, .xls" 
                  multiple={excelBankMode === 'units'}
                  style={{ display: 'none' }} 
                />
                <div className="excel-drop-icon">
                  <Upload size={24} />
                </div>
                <div className="excel-drop-title">
                  {isDragging 
                    ? '📥 Release to Upload Selected File(s)' 
                    : (excelBankMode === 'units' 
                        ? 'Click to Browse or Drag & Drop 10-Unit Excel File(s)' 
                        : (excelBankMode === 'demo' 
                            ? 'Click to Browse or Drag & Drop Demo Test File (.xlsx)' 
                            : 'Click to Browse or Drag & Drop Scheduled Test File (.xlsx)'))}
                </div>
                <div className="excel-drop-desc">
                  {excelBankMode === 'units' && (
                    'Supports uploading all 10 Unit files simultaneously (e.g. Unit_01 to Unit_10), or any individual unit. Drag & drop or select all 10 files using Ctrl+A in the file picker.'
                  )}
                  {excelBankMode === 'demo' && (
                    'Upload 10 to 30 mixed-curriculum MCQs for the Free Diagnostic Entrance CBT (e.g. Botany_Entrance_30_MCQ_Mixed.xlsx). Questions will update live on the candidate entrance test.'
                  )}
                  {excelBankMode === 'tests' && (
                    'Upload question bank for the selected scheduled test (e.g. Test_01_Diagnostic.xlsx). Files will be parsed and verified against test requirements.'
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span className="btn btn-primary btn-sm">
                    <Upload size={14} /> 
                    <span>
                      {excelBankMode === 'units' && 'Choose Unit .xlsx File(s) (Multi-Select Enabled)'}
                      {excelBankMode === 'demo' && 'Choose Demo .xlsx File'}
                      {excelBankMode === 'tests' && 'Choose Test .xlsx File'}
                    </span>
                  </span>
                  {excelBankMode === 'demo' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadEntranceDemoFile();
                      }}
                      style={{ borderColor: 'rgba(124, 58, 237, 0.4)', background: 'rgba(124, 58, 237, 0.12)', color: 'var(--accent-primary)', fontWeight: 700 }}
                    >
                      <Sparkles size={14} /> <span>⚡ Load 30-MCQ Demo from docs/</span>
                    </button>
                  )}
                  {excelBankMode === 'units' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadDocsSampleFiles();
                      }}
                      style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}
                    >
                      <Sparkles size={14} /> <span>⚡ Load &amp; Preview All 10 Units from docs/</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Currently Active Release Summary */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
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
                  No questions uploaded for this unit yet. Download the template above, fill in your questions, and upload.
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
      )}

      {/* SUBTAB 5: SETTINGS & PRICING */}
      {subTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSaveSettings} className="botany-card">
            <div className="botany-card-header">
              <div>
                <h3>Test Series Visibility, Pricing &amp; Razorpay</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Configure homepage spotlight, countdown expiry, pricing tiers, and Razorpay payment gateway credentials.
                </p>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                <Save size={14} /> <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            <div className="settings-form-grid">
              <div className="toggle-switch-row">
                <div>
                  <div className="toggle-switch-label">Prominent Placement</div>
                  <div className="toggle-switch-sub">Display spotlight card and top notification banner on site</div>
                </div>
                <input 
                  type="checkbox"
                  checked={!!settings?.isProminent}
                  onChange={(e) => setSettings({ ...settings, isProminent: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div className="admin-form-group">
                <label>Prominent Spotlight Until (Date)</label>
                <input 
                  type="date"
                  value={settings?.prominentUntil || ''}
                  onChange={(e) => setSettings({ ...settings, prominentUntil: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Full Series Offer Price (₹ INR)</label>
                <input 
                  type="number"
                  value={settings?.fullSeriesPrice || 1499}
                  onChange={(e) => setSettings({ ...settings, fullSeriesPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Original MRP (₹ INR - for strikethrough)</label>
                <input 
                  type="number"
                  value={settings?.originalPrice || 2499}
                  onChange={(e) => setSettings({ ...settings, originalPrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Unit-Wise Single Test Price (₹ INR)</label>
                <input 
                  type="number"
                  value={settings?.unitWisePrice || 199}
                  onChange={(e) => setSettings({ ...settings, unitWisePrice: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Razorpay Key ID (Live / Test)</label>
                <input 
                  type="text"
                  placeholder="rzp_live_TGUYt8AMIuHwLa"
                  value={settings?.razorpayKey || ''}
                  onChange={(e) => setSettings({ ...settings, razorpayKey: e.target.value })}
                />
                <span style={{ fontSize: '0.74rem', color: '#10b981' }}>
                  ✓ Approved Domain: <strong>https://nexliftech.space/</strong> (Live Key: <code>rzp_live_TGUYt8AMIuHwLa</code>)
                </span>
              </div>

              <div className="admin-form-group">
                <label>Confirmation Email Dispatcher / Support Desk</label>
                <input 
                  type="email"
                  placeholder="admissions@nexliftech.space"
                  value={settings?.contactSupportEmail || 'admissions@nexliftech.space'}
                  onChange={(e) => setSettings({ ...settings, contactSupportEmail: e.target.value })}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Official email address on tax receipts and transactional confirmation mailings.
                </span>
              </div>

              <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.74rem', color: p.isActive !== false ? '#10b981' : 'var(--text-muted)' }}>
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
                              ? 'Full 35-Test Series' 
                              : `Unit Pass (${sub.allowedUnits?.join(', ') || 'Unit 1'})`}
                          </span>
                        </td>
                        <td>
                          {isManual ? (
                            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.76rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              Free / Admin Grant
                            </span>
                          ) : (
                            <span style={{ fontWeight: 700, color: '#10b981' }}>₹{sub.amountPaid}</span>
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
                    Target Unit:
                  </span>
                  <select
                    value={uploadPreview.detectedUnitId || selectedUnitId}
                    onChange={(e) => {
                      const newUId = e.target.value;
                      setSelectedUnitId(newUId);
                      if (newUId === 'diagnostic_demo') setExcelBankMode('demo');
                      else if (newUId.startsWith('test_')) setExcelBankMode('tests');
                      else setExcelBankMode('units');
                      setUploadPreview(prev => ({ ...prev, detectedUnitId: newUId }));
                      setBatchUploadList(prev => prev.map(item => item.fileName === uploadPreview.fileName ? { ...item, detectedUnitId: newUId } : item));
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  >
                    <optgroup label="Free Entrance Assessment">
                      <option value="diagnostic_demo">🎯 Diagnostic Demo Entrance Test (10-30 MCQs)</option>
                    </optgroup>
                    <optgroup label="PSC Curriculum Units (Units 1 to 10)">
                      {syllabus.map(u => (
                        <option key={u.unitId} value={u.unitId}>
                          Unit {u.unitNumber}: {u.title}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Official 35 Scheduled Tests">
                      {schedule.filter(t => t.isTest).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.id.replace('test_', 'T')}: {t.title} ({t.category})
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
                  <span style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.55rem', borderRadius: '10px' }}>
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
                            if (bItem.detectedUnitId === 'diagnostic_demo') setExcelBankMode('demo');
                            else if (bItem.detectedUnitId.startsWith('test_')) setExcelBankMode('tests');
                            else setExcelBankMode('units');
                          }
                        }}
                        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {bItem.invalidCount > 0 ? <AlertCircle size={12} color="#ef4444" /> : <CheckCircle2 size={12} color="#10b981" />}
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
                              <strong style={{ color: q.correctOption === 'A' ? '#10b981' : 'var(--text-secondary)' }}>Analysis A:</strong> {q.analysisA || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'B' ? '#10b981' : 'var(--text-secondary)' }}>Analysis B:</strong> {q.analysisB || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'C' ? '#10b981' : 'var(--text-secondary)' }}>Analysis C:</strong> {q.analysisC || '—'}
                            </div>
                            <div style={{ marginBottom: '0.2rem' }}>
                              <strong style={{ color: q.correctOption === 'D' ? '#10b981' : 'var(--text-secondary)' }}>Analysis D:</strong> {q.analysisD || '—'}
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
                    placeholder="e.g. Dr. Aubid Ahmad or Candidate Name"
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
                    <option value="full_series">🌟 Full 35-Test Series (All Units + Mocks + Special)</option>
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
