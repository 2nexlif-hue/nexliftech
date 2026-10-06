import { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, Calendar, FileSpreadsheet, Settings, Users, 
  Download, Upload, RefreshCw, CheckCircle, AlertCircle, Clock, Eye, 
  RotateCcw, ChevronDown, ChevronUp, Save, ArrowRight, Sparkles, Layers, CheckCircle2 
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
  rollbackUnitToVersion
} from '../../utils/botanyFirestoreService';
import { 
  downloadExcelTemplate, 
  parseExcelFile, 
  parseExcelBuffer,
  exportQuestionsToExcel 
} from '../../utils/botanyExcelEngine';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Excel Hub State
  const [selectedUnitId, setSelectedUnitId] = useState('unit_1');
  const [unitActiveData, setUnitActiveData] = useState(null);
  const [unitVersions, setUnitVersions] = useState([]);
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Upload & Preview state
  const [uploadPreview, setUploadPreview] = useState(null); // { questions, validCount, invalidCount, fileName, detectedUnitId }
  const [batchUploadList, setBatchUploadList] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [committing, setCommitting] = useState(false);
  const fileInputRef = useRef(null);

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

  // Initial load
  useEffect(() => {
    async function loadAll() {
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

  // Handle Excel Upload (Single or Multi-file)
  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSaving(true);
    try {
      const parsedList = await Promise.all(files.map(f => parseExcelFile(f)));
      if (parsedList.length === 1) {
        const single = parsedList[0];
        if (single.detectedUnitId) {
          setSelectedUnitId(single.detectedUnitId);
        }
        setUploadPreview(single);
        setBatchUploadList([]);
        setShowPreviewModal(true);
      } else {
        // Multi-file batch (e.g. all 10 files)
        parsedList.sort((a, b) => {
          const numA = parseInt((a.detectedUnitId || '').replace('unit_', ''), 10) || 0;
          const numB = parseInt((b.detectedUnitId || '').replace('unit_', ''), 10) || 0;
          return numA - numB;
        });
        setBatchUploadList(parsedList);
        setUploadPreview(parsedList[0]);
        if (parsedList[0].detectedUnitId) {
          setSelectedUnitId(parsedList[0].detectedUnitId);
        }
        setShowPreviewModal(true);
        showToast('success', `Parsed ${parsedList.length} Excel files. You can preview and commit each unit.`);
      }
    } catch (err) {
      console.error('Excel parse error:', err);
      showToast('error', err.message || 'Failed to parse Excel file.');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      const unitTitle = targetUnit ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` : targetUnitId;

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
      for (const batchItem of batchUploadList) {
        const unitId = batchItem.detectedUnitId || selectedUnitId;
        const targetUnit = syllabus.find(u => u.unitId === unitId);
        const unitTitle = targetUnit ? `Unit ${targetUnit.unitNumber}: ${targetUnit.title}` : unitId;

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

      // Refresh current active unit
      const [activeData, versions] = await Promise.all([
        getUnitQuestions(selectedUnitId),
        getUnitVersions(selectedUnitId)
      ]);
      setUnitActiveData(activeData);
      setUnitVersions(versions);

      showToast('success', `🎉 Successfully committed all ${committedCount} Units (${totalQuestionsCount} questions) to Database!`);
    } catch (err) {
      console.error('Batch commit error:', err);
      showToast('error', 'Failed to commit all units to database.');
    } finally {
      setCommitting(false);
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

  // Filtered syllabus
  const filteredSyllabus = syllabus.filter(u => {
    if (!syllabusSearch.trim()) return true;
    const query = syllabusSearch.toLowerCase();
    return (
      u.title.toLowerCase().includes(query) ||
      u.subunits?.some(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query))
    );
  });

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
          <div className="botany-stat-pill">
            <span className="botany-stat-label">Syllabus Units</span>
            <span className="botany-stat-val">10</span>
          </div>
          <div className="botany-stat-pill">
            <span className="botany-stat-label">Total Tests</span>
            <span className="botany-stat-val">35</span>
          </div>
          <div className="botany-stat-pill">
            <span className="botany-stat-label">Target Questions</span>
            <span className="botany-stat-val">~2,700</span>
          </div>
          <div className="botany-stat-pill">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Excel Question Hub</h4>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Upload questions per unit, validate options, and auto-archive up to 3 versions in Firebase.
              </p>
              <button 
                type="button" 
                onClick={() => setSubTab('excel')} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                Go to Excel Hub <ArrowRight size={13} />
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
        </div>
      )}

      {/* SUBTAB 2: SYLLABUS REFERENCE */}
      {subTab === 'syllabus' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <div>
              <h3>Official Public Service Commission Syllabus (10 Units)</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Complete syllabus curated by Dr. Aubid Ahmad, Assistant Professor (Botany).
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
                      <span>Unit-{unit.unitNumber}: {unit.title}</span>
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
                          <div key={sub.id} className="subunit-card">
                            <div className="subunit-title">{sub.title}</div>
                            <p className="subunit-desc">{sub.description}</p>
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

          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date &amp; Day</th>
                  <th>Test Title</th>
                  <th>Category</th>
                  <th>Coverage</th>
                  <th>Questions</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((t, idx) => {
                  let badgeClass = 'badge-unit';
                  if (t.category.includes('Mock')) badgeClass = 'badge-mock';
                  else if (t.category.includes('Cluster')) badgeClass = 'badge-cluster';
                  else if (t.category.includes('Review') || t.category.includes('Analysis')) badgeClass = 'badge-review';

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
                      <td style={{ fontWeight: 700 }}>
                        {t.questionCount > 0 ? `${t.questionCount} Q` : '—'}
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
        <div className="excel-hub-grid">
          {/* Main Upload Canvas */}
          <div className="botany-card">
            <div className="botany-card-header">
              <div>
                <h3>Upload Question Bank (.xlsx)</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload questions for the selected unit with question, 4 options, correct answer, and individual option analyses.
                </p>
              </div>
              <div className="botany-card-actions">
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const unit = syllabus.find(u => u.unitId === selectedUnitId);
                    downloadExcelTemplate(selectedUnitId, unit ? unit.title : selectedUnitId);
                  }}
                >
                  <Download size={14} /> <span>Download Template .xlsx</span>
                </button>
              </div>
            </div>

            {/* Unit Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Select Unit to Manage:
              </label>
              <select 
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              >
                {syllabus.map(u => (
                  <option key={u.unitId} value={u.unitId}>
                    Unit {u.unitNumber}: {u.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Drop Zone */}
            <div 
              className="excel-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".xlsx, .xls" 
                multiple
                style={{ display: 'none' }} 
              />
              <div className="excel-drop-icon">
                <Upload size={24} />
              </div>
              <div className="excel-drop-title">
                Click to browse or drop Excel file(s) (.xlsx)
              </div>
              <div className="excel-drop-desc">
                Supports single or multi-file upload for all 10 units (S.No, Question, Options A-D, Correct Answer (Key), Analysis - Options A-D, Context Note).
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="btn btn-primary btn-sm">
                  <Upload size={14} /> <span>Choose .xlsx File(s)</span>
                </span>
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
              </div>
            </div>

            {/* Currently Active Release Summary */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Active Database Questions ({selectedUnitId})
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
      )}

      {/* SUBTAB 5: SETTINGS & PRICING */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="botany-card">
          <div className="botany-card-header">
            <div>
              <h3>Test Series Visibility, Pricing &amp; Razorpay</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure homepage spotlight, countdown expiry, pricing tiers, and coupons.
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
              <label>Razorpay Key ID</label>
              <input 
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxxxx or rzp_test_xxxxxxx"
                value={settings?.razorpayKey || ''}
                onChange={(e) => setSettings({ ...settings, razorpayKey: e.target.value })}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Leave empty in local development to run in simulation checkout mode.
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
      )}

      {/* SUBTAB 6: SUBSCRIBERS */}
      {subTab === 'subscribers' && (
        <div className="botany-card">
          <div className="botany-card-header">
            <h3>Registered &amp; Enrolled Subscribers</h3>
            <span className="botany-header-badge">{subscribers.length} Active Subscriptions</span>
          </div>

          {subscribers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No subscriptions recorded yet. As students enroll via Razorpay or Google sign-in, their access tokens will show here in real-time.
            </div>
          ) : (
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Razorpay ID</th>
                    <th>Enrolled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600 }}>{sub.userName || 'Student'}</td>
                      <td>{sub.userEmail}</td>
                      <td>
                        <span className="schedule-badge badge-unit">
                          {sub.planType === 'full_series' ? 'Full 35-Test Series' : 'Unit Pack'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{sub.amountPaid}</td>
                      <td style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                        {sub.razorpayPaymentId || 'Direct / Free'}
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
                  ))}
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
                      setUploadPreview(prev => ({ ...prev, detectedUnitId: newUId }));
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  >
                    {syllabus.map(u => (
                      <option key={u.unitId} value={u.unitId}>
                        Unit {u.unitNumber}: {u.title}
                      </option>
                    ))}
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
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    PREPARED UNITS ({batchUploadList.length} files detected): Click to switch &amp; preview any unit
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                    Total: {batchUploadList.reduce((acc, b) => acc + b.validCount, 0)} Questions
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                  {batchUploadList.map((bItem, bIdx) => {
                    const uId = bItem.detectedUnitId || `unit_${bIdx + 1}`;
                    const targetU = syllabus.find(u => u.unitId === uId);
                    const label = targetU ? `Unit ${targetU.unitNumber}` : `Unit ${bIdx + 1}`;
                    const isActive = uploadPreview.fileName === bItem.fileName;
                    return (
                      <button
                        key={bIdx}
                        type="button"
                        onClick={() => {
                          setUploadPreview(bItem);
                          if (bItem.detectedUnitId) setSelectedUnitId(bItem.detectedUnitId);
                        }}
                        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
                      >
                        {label} ({bItem.validCount} Qs)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="preview-modal-body">
              {/* Stat summary */}
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

              {/* Questions list */}
              <div className="preview-questions-list">
                {uploadPreview.questions.map((q, idx) => (
                  <div key={q.id || idx} className={`preview-q-card ${!q.isValid ? 'has-error' : ''}`}>
                    <div className="preview-q-header">
                      <span>Row {q.rowNumber} (Excel)</span>
                      <span>Correct: <strong>Option {q.correctOption || 'None'}</strong></span>
                    </div>

                    <div className="preview-q-text">
                      <strong>Q{idx + 1}.</strong> {q.question || <em style={{ color: '#ef4444' }}>Empty question statement</em>}
                    </div>

                    <div className="preview-options-grid">
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
                ))}
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
                  disabled={committing || uploadPreview.validCount === 0}
                  style={batchUploadList.length > 1 ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' } : {}}
                >
                  {committing ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>
                    {committing 
                      ? 'Archiving & Publishing...' 
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
    </div>
  );
}
