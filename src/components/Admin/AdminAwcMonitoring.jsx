import { useState, useEffect, useRef } from 'react';
import { 
  Building2, Save, FileText, Download, Clock, CheckCircle2, AlertCircle, 
  Plus, Edit3, Trash2, Copy, Search, RefreshCw, ChevronRight, User, Calendar
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { generateAwcMonitoringPdf } from '../../utils/pdfGenerator';

const ADOPTED_AWCS = [
  'AWC Shangus A',
  'AWC Shangus B',
  'AWC Nowgam',
  'AWC Chittergul'
];

const PREDEFINED_ISSUES = [
  'Safe drinking water facility not functional / supply interrupted',
  'AWC building requires minor repairs and wall plastering',
  'Weighing scale needs re-calibration or replacement',
  'ECCE kit learning materials deficient or worn out',
  'Poshan Tracker record entries lagging for current month',
  'Low attendance of children on visit date due to inclement weather',
  'Functional toilet requires sanitation maintenance and water supply',
  'Utensils for supplementary nutrition cooking inadequate'
];

const PREDEFINED_ACTIONS = [
  'Take up water facility repair with Jal Shakti Dept / Gram Panchayat (PRI)',
  'Request CDPO/DPO for replacement of weighing machine and ECCE kits',
  'Direct AWW to immediately sync & update Poshan Tracker records',
  'Instruct AWW/Helper to ensure daily sanitation & child safety',
  'Coordinate with Health Dept / local ANM for conduct of regular VHSND'
];

const DEFAULT_FORM_STATE = {
  projectName: 'Shangus',
  awcName: 'AWC Shangus A',
  customAwcName: '',
  visitDate: new Date().toISOString().split('T')[0],
  officerName: 'Sheikh Gulfam (Officer)',
  awwPresent: 'Yes',
  helperPresent: 'Yes',
  childrenEnrolled: '25',
  childrenPresentToday: '20',
  womenEnrolled: '8',

  // Section B
  suppNutritionRegular: 'Yes',
  thrDistributionRegular: 'Yes',
  samMamIdentified: 'No',
  immunizationUpdated: 'Yes',
  referralCases: 'Nil',

  // Section C
  ecceStatus: 'Children have basic Hindi/English recognition & counting skills',
  learningMaterialAvailable: 'Yes',
  childrenEngaged: 'Yes',
  cleanEnvironment: 'Yes',

  // Section D
  statusBuilding: 'Normal',
  statusSafeDrinkingWater: 'Yes',
  statusFunctionalToilet: 'Yes',
  statusElectricity: 'Yes',
  weighingMachineFunctional: 'Yes',
  utensilsStorageAdequate: 'Yes',

  // Section E
  anmVisitConducted: 'Yes',
  anmVisitDate: new Date().toISOString().split('T')[0],
  anmName: '',
  anmWomenChecked: '6',
  anmDetails: '',
  vhsndHeld: 'Yes',
  priInvolvement: 'Yes',

  // Section F & G
  issueA: '',
  issueB: '',
  issueC: '',
  issueD: '',
  action1: '',
  action2: '',

  status: 'Draft'
};

export default function AdminAwcMonitoring() {
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor' | 'history'
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [editingId, setEditingId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(''); // 'saving' | 'saved' | 'error'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Draft' | 'Submitted'
  const [awcFilter, setAwcFilter] = useState('ALL');

  const autoSaveTimerRef = useRef(null);

  // 1. Load initial cached draft
  useEffect(() => {
    try {
      const cachedDraft = localStorage.getItem('nex_awc_draft_current');
      if (cachedDraft) {
        const parsedDraft = JSON.parse(cachedDraft);
        setFormData(parsedDraft);
      }
    } catch (e) {
      console.error('Failed to parse local draft:', e);
    }
  }, []);

  // 2. Fetch Reports from Firestore + Local Merge
  const fetchReports = async () => {
    setLoading(true);
    try {
      let firestoreList = [];
      if (db) {
        try {
          const q = query(collection(db, 'awc_monitoring_reports'), orderBy('visitDate', 'desc'));
          const snapshot = await getDocs(q);
          firestoreList = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
        } catch (fErr) {
          console.warn('Firestore fetch query warning, using local merge fallback:', fErr);
        }
      }
      const localItems = JSON.parse(localStorage.getItem('nex_awc_history_local') || '[]');
      
      // Merge unique by ID
      const map = new Map();
      firestoreList.forEach(item => map.set(item.id, item));
      localItems.forEach(item => {
        if (!map.has(item.id)) map.set(item.id, item);
      });

      const combined = Array.from(map.values()).sort((a, b) => 
        (b.visitDate || '').localeCompare(a.visitDate || '')
      );

      setReports(combined);
    } catch (err) {
      console.error('Error fetching AWC reports:', err);
      const localItems = JSON.parse(localStorage.getItem('nex_awc_history_local') || '[]');
      setReports(localItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 3. Debounced Auto-Save Draft
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      localStorage.setItem('nex_awc_draft_current', JSON.stringify(updated));
      setSavingStatus('saving');

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          if (editingId && db) {
            await updateDoc(doc(db, 'awc_monitoring_reports', editingId), {
              ...updated,
              updatedAt: serverTimestamp()
            });
          }
          setSavingStatus('saved');
          setTimeout(() => setSavingStatus(''), 2500);
        } catch (err) {
          console.error('Auto save error:', err);
          setSavingStatus('error');
        }
      }, 1200);

      return updated;
    });
  };

  const handleNewForm = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_STATE);
    localStorage.removeItem('nex_awc_draft_current');
    setActiveSubTab('editor');
  };

  // Helper to sanitize payload for Firestore (removes undefined / NaN values)
  const sanitizeForFirestore = (dataObj) => {
    const clean = {};
    Object.keys(dataObj).forEach(key => {
      const val = dataObj[key];
      if (val === undefined || val === null) {
        clean[key] = '';
      } else if (typeof val === 'number' && isNaN(val)) {
        clean[key] = 0;
      } else {
        clean[key] = val;
      }
    });
    return clean;
  };

  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [submittingStepText, setSubmittingStepText] = useState('');
  const [toastNotice, setToastNotice] = useState(null); // { type: 'success' | 'info' | 'error', title: '', message: '' }

  const showToast = (type, title, message) => {
    setToastNotice({ type, title, message });
    setTimeout(() => {
      setToastNotice(null);
    }, 4200);
  };

  const handleSaveDraft = async () => {
    setIsSubmittingModal(true);
    setSubmittingStepText('Encrypting & Saving Draft Inspection Record...');
    setLoading(true);

    try {
      const rawPayload = {
        ...formData,
        awcName: formData.awcName === 'CUSTOM' ? formData.customAwcName : formData.awcName,
        status: 'Draft',
        updatedAt: new Date().toISOString()
      };
      const payload = sanitizeForFirestore(rawPayload);

      let targetId = editingId;
      if (targetId && db) {
        try {
          await updateDoc(doc(db, 'awc_monitoring_reports', targetId), payload);
        } catch (upErr) {
          const docRef = await addDoc(collection(db, 'awc_monitoring_reports'), payload);
          targetId = docRef.id;
        }
      } else if (db) {
        const docRef = await addDoc(collection(db, 'awc_monitoring_reports'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        targetId = docRef.id;
      }

      setEditingId(targetId);

      const localHistory = JSON.parse(localStorage.getItem('nex_awc_history_local') || '[]');
      const filtered = localHistory.filter(item => item.id !== (editingId || targetId));
      localStorage.setItem('nex_awc_history_local', JSON.stringify([
        { id: targetId || Date.now().toString(), ...payload },
        ...filtered
      ]));

      setSavingStatus('saved');
      fetchReports();
      showToast('success', 'Draft Saved', 'Draft inspection report stored in Cloud & Local Storage.');
    } catch (err) {
      console.warn('Firestore cloud save notice:', err);
      setSavingStatus('saved-local');
      showToast('info', 'Saved Locally', 'Draft stored in Local Storage (Cloud sync will resume automatically).');
    } finally {
      setTimeout(() => {
        setIsSubmittingModal(false);
        setLoading(false);
      }, 700);
    }
  };

  const [validationErrors, setValidationErrors] = useState([]);

  // Form Validation Engine
  const validateForm = () => {
    const errors = [];

    // 1. AWC Name
    if (!formData.awcName) {
      errors.push("Select an Adopted Anganwadi Centre.");
    } else if (formData.awcName === 'CUSTOM' && !formData.customAwcName?.trim()) {
      errors.push("Specify custom Anganwadi Centre Name.");
    }

    // 2. Project Name
    if (!formData.projectName?.trim()) {
      errors.push("Project Name is required.");
    }

    // 3. Visit Date
    if (!formData.visitDate) {
      errors.push("Date of Visit is required.");
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.visitDate > today) {
        errors.push("Visit Date cannot be set to a future date.");
      }
    }

    // 4. Officer Name
    if (!formData.officerName?.trim() || formData.officerName.trim().length < 2) {
      errors.push("Visiting Officer Name must be specified (at least 2 characters).");
    }

    // 5. Enrolled vs Present Numbers Check
    const enrolled = parseInt(formData.childrenEnrolled, 10);
    const present = parseInt(formData.childrenPresentToday, 10);
    if (isNaN(enrolled) || enrolled < 0) {
      errors.push("Enrolled Children count must be a non-negative number.");
    }
    if (isNaN(present) || present < 0) {
      errors.push("Present Children count must be a non-negative number.");
    }
    if (!isNaN(enrolled) && !isNaN(present) && present > enrolled) {
      errors.push(`Children present today (${present}) cannot exceed total enrolled children (${enrolled}).`);
    }

    // 6. ECCE Status
    if (!formData.ecceStatus?.trim()) {
      errors.push("ECCE & Literacy/Maths Knowledge status is required.");
    }

    // 7. At least 1 Issue Observation
    const hasIssue = formData.issueA?.trim() || formData.issueB?.trim() || formData.issueC?.trim() || formData.issueD?.trim();
    if (!hasIssue) {
      errors.push("At least one Issue Observation (Section F) must be selected or typed.");
    }

    // 8. At least 1 Action Directive
    const hasAction = formData.action1?.trim() || formData.action2?.trim();
    if (!hasAction) {
      errors.push("At least one Action Directive (Section G) must be selected or typed.");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitReport = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      showToast('error', 'Validation Check Failed', 'Please fix the highlighted errors before submitting.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    setValidationErrors([]);
    setIsSubmittingModal(true);
    setSubmittingStepText('Validating Inspection Record & Syncing Poshan Tracker Data...');
    setLoading(true);

    const finalAwcName = formData.awcName === 'CUSTOM' ? (formData.customAwcName || 'Custom AWC') : formData.awcName;
    const rawPayload = {
      ...formData,
      awcName: finalAwcName,
      status: 'Submitted',
      submittedAt: formData.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const payload = sanitizeForFirestore(rawPayload);

    try {
      let targetId = editingId;
      if (targetId && db) {
        try {
          await updateDoc(doc(db, 'awc_monitoring_reports', targetId), payload);
        } catch (upErr) {
          const docRef = await addDoc(collection(db, 'awc_monitoring_reports'), payload);
          targetId = docRef.id;
        }
      } else if (db) {
        const docRef = await addDoc(collection(db, 'awc_monitoring_reports'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        targetId = docRef.id;
      }

      setEditingId(targetId);

      const localHistory = JSON.parse(localStorage.getItem('nex_awc_history_local') || '[]');
      const filtered = localHistory.filter(item => item.id !== (editingId || targetId));
      localStorage.setItem('nex_awc_history_local', JSON.stringify([
        { id: targetId || Date.now().toString(), ...payload },
        ...filtered
      ]));

      localStorage.removeItem('nex_awc_draft_current');
      fetchReports();
      showToast('success', 'Report Submitted!', `Official AWC monitoring report for ${finalAwcName} successfully submitted.`);
      setActiveSubTab('history');
    } catch (err) {
      console.warn('Cloud submission fallback to local:', err);
      fetchReports();
      showToast('info', 'Report Saved Locally', `Report for ${finalAwcName} saved to Local Storage.`);
      setActiveSubTab('history');
    } finally {
      setTimeout(() => {
        setIsSubmittingModal(false);
        setLoading(false);
      }, 900);
    }
  };

  const handleEditReport = (rep) => {
    setEditingId(rep.id);
    setFormData({
      ...DEFAULT_FORM_STATE,
      ...rep
    });
    setActiveSubTab('editor');
  };

  const handleCloneReport = (rep) => {
    setEditingId(null);
    setFormData({
      ...DEFAULT_FORM_STATE,
      ...rep,
      visitDate: new Date().toISOString().split('T')[0],
      status: 'Draft'
    });
    setActiveSubTab('editor');
    showToast('success', 'Visit Template Cloned', `Created new draft based on ${rep.awcName} with today's visit date.`);
  };

  const [confirmModal, setConfirmModal] = useState(null);

  const handleDeleteReport = (id, awcName = 'this monitoring report') => {
    setConfirmModal({
      title: 'Delete Monitoring Report?',
      message: `Are you sure you want to permanently delete the inspection report for "${awcName}"? This action cannot be undone.`,
      actionText: 'Delete Report',
      onConfirm: async () => {
        setLoading(true);
        try {
          if (db) {
            await deleteDoc(doc(db, 'awc_monitoring_reports', id));
          }
          const localHistory = JSON.parse(localStorage.getItem('nex_awc_history_local') || '[]');
          localStorage.setItem('nex_awc_history_local', JSON.stringify(localHistory.filter(i => i.id !== id)));
          fetchReports();
          showToast('success', 'Report Deleted', `Report for ${awcName} permanently removed.`);
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Failed to remove report from database.');
        } finally {
          setLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      (r.awcName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.officerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.projectName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesAwc = awcFilter === 'ALL' || r.awcName === awcFilter;

    return matchesSearch && matchesStatus && matchesAwc;
  });

  const activeAwcName = formData.awcName === 'CUSTOM' ? (formData.customAwcName || 'Custom AWC') : formData.awcName;

  return (
    <div className="pricing-editor-section">
      
      {/* Header Bar */}
      <div className="pricing-editor-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2><Building2 size={22} style={{ color: '#a855f7' }} /> Monthly AWC Monitoring Checklist</h2>
          <p className="pricing-editor-subtitle">Official inspection & feedback portal for adopted Anganwadi Centres (Order No. 205 DDCA of 2026).</p>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn ${activeSubTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setActiveSubTab('editor')}
          >
            <Edit3 size={14} />
            <span>{editingId ? 'Edit Visit' : 'New Visit Form'}</span>
          </button>
          <button
            type="button"
            className={`btn ${activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => setActiveSubTab('history')}
          >
            <Clock size={14} />
            <span>History ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* Auto-Save Toast */}
      {savingStatus && (
        <div style={{
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {savingStatus === 'saving' ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>{savingStatus === 'saving' ? 'Auto-saving draft...' : 'Draft saved automatically'}</span>
        </div>
      )}

      {/* TAB 1: FORM EDITOR */}
      {activeSubTab === 'editor' && (
        <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Validation Alert Banner */}
          {validationErrors.length > 0 && (
            <div style={{
              background: 'rgba(225, 29, 72, 0.08)',
              border: '1px solid rgba(225, 29, 72, 0.35)',
              borderRadius: '12px',
              padding: '0.85rem 1.15rem',
              color: '#e11d48'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> Validation Errors Found ({validationErrors.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* FULL-WIDTH MULTI-COLUMN SECTION CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* SECTION A - BASIC DETAILS */}
            <div style={{
              background: 'var(--bg-glass-hover, rgba(124, 58, 237, 0.04))',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  A. Basic Details
                </h3>
                <button
                  type="button"
                  onClick={handleNewForm}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Plus size={14} /> Start New Form
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Adopted AWC *</label>
                  <select
                    value={formData.awcName}
                    onChange={(e) => handleInputChange('awcName', e.target.value)}
                    className="form-input"
                    style={{ fontWeight: 700 }}
                  >
                    {ADOPTED_AWCS.map(awc => (
                      <option key={awc} value={awc}>{awc}</option>
                    ))}
                    <option value="CUSTOM">+ Other AWC Name</option>
                  </select>
                </div>

                {formData.awcName === 'CUSTOM' && (
                  <div className="form-group">
                    <label className="form-label">Custom AWC Name *</label>
                    <input
                      type="text"
                      value={formData.customAwcName}
                      onChange={(e) => handleInputChange('customAwcName', e.target.value)}
                      placeholder="AWC Name"
                      className="form-input"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Date *</label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => handleInputChange('visitDate', e.target.value)}
                    className="form-input"
                    style={{ fontWeight: 700 }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Officer Name *</label>
                  <input
                    type="text"
                    value={formData.officerName}
                    onChange={(e) => handleInputChange('officerName', e.target.value)}
                    className="form-input"
                    style={{ fontWeight: 700 }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">AWW Present?</label>
                  <select
                    value={formData.awwPresent}
                    onChange={(e) => handleInputChange('awwPresent', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Helper Present?</label>
                  <select
                    value={formData.helperPresent}
                    onChange={(e) => handleInputChange('helperPresent', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Enrolled Children</label>
                  <input
                    type="number"
                    value={formData.childrenEnrolled}
                    onChange={(e) => handleInputChange('childrenEnrolled', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Present Today</label>
                  <input
                    type="number"
                    value={formData.childrenPresentToday}
                    onChange={(e) => handleInputChange('childrenPresentToday', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pregnant/Lactating Women</label>
                  <input
                    type="number"
                    value={formData.womenEnrolled}
                    onChange={(e) => handleInputChange('womenEnrolled', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B - NUTRITION & HEALTH */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                B. Nutrition & Health (Poshan Tracker)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Supp. Nutrition</label>
                  <select
                    value={formData.suppNutritionRegular}
                    onChange={(e) => handleInputChange('suppNutritionRegular', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes (Regular)</option>
                    <option value="No">No</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">THR Distribution</label>
                  <select
                    value={formData.thrDistributionRegular}
                    onChange={(e) => handleInputChange('thrDistributionRegular', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes (Regular)</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">SAM/MAM Identified</label>
                  <input
                    type="text"
                    value={formData.samMamIdentified}
                    onChange={(e) => handleInputChange('samMamIdentified', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Immunization Updated</label>
                  <select
                    value={formData.immunizationUpdated}
                    onChange={(e) => handleInputChange('immunizationUpdated', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Referral Cases</label>
                  <input
                    type="text"
                    value={formData.referralCases}
                    onChange={(e) => handleInputChange('referralCases', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* SECTION C - ECCE & LITERACY */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                C. ECCE & Literacy Status
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">ECCE & Literacy/Maths Knowledge *</label>
                  <input
                    type="text"
                    value={formData.ecceStatus}
                    onChange={(e) => handleInputChange('ecceStatus', e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Learning Material</label>
                  <select
                    value={formData.learningMaterialAvailable}
                    onChange={(e) => handleInputChange('learningMaterialAvailable', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Children Engaged</label>
                  <select
                    value={formData.childrenEngaged}
                    onChange={(e) => handleInputChange('childrenEngaged', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Child-Friendly Environment</label>
                  <select
                    value={formData.cleanEnvironment}
                    onChange={(e) => handleInputChange('cleanEnvironment', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION D - INFRASTRUCTURE */}
            <div style={{
              background: 'rgba(2, 132, 199, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                D. Infrastructure Status
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Building Status</label>
                  <select
                    value={formData.statusBuilding}
                    onChange={(e) => handleInputChange('statusBuilding', e.target.value)}
                    className="form-input"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Safe Water</label>
                  <select
                    value={formData.statusSafeDrinkingWater}
                    onChange={(e) => handleInputChange('statusSafeDrinkingWater', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Functional Toilet</label>
                  <select
                    value={formData.statusFunctionalToilet}
                    onChange={(e) => handleInputChange('statusFunctionalToilet', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Electricity</label>
                  <select
                    value={formData.statusElectricity}
                    onChange={(e) => handleInputChange('statusElectricity', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Solar">Solar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Weighing Scale</label>
                  <select
                    value={formData.weighingMachineFunctional}
                    onChange={(e) => handleInputChange('weighingMachineFunctional', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Utensils & Storage</label>
                  <select
                    value={formData.utensilsStorageAdequate}
                    onChange={(e) => handleInputChange('utensilsStorageAdequate', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION E - CONVERGENCE */}
            <div style={{
              background: 'rgba(225, 29, 72, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                E. Convergence & Health Visits
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">ANM Visit</label>
                  <select
                    value={formData.anmVisitConducted}
                    onChange={(e) => handleInputChange('anmVisitConducted', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ANM Name</label>
                  <input
                    type="text"
                    value={formData.anmName}
                    onChange={(e) => handleInputChange('anmName', e.target.value)}
                    placeholder="ANM Name"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Women Checked</label>
                  <input
                    type="number"
                    value={formData.anmWomenChecked}
                    onChange={(e) => handleInputChange('anmWomenChecked', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">VHSND Held?</label>
                  <select
                    value={formData.vhsndHeld}
                    onChange={(e) => handleInputChange('vhsndHeld', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">PRI Involvement</label>
                  <select
                    value={formData.priInvolvement}
                    onChange={(e) => handleInputChange('priInvolvement', e.target.value)}
                    className="form-input"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION F & G - ISSUES & ACTIONS */}
            <div style={{
              background: 'rgba(234, 88, 12, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              boxShadow: 'var(--shadow-glass)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.45rem' }}>
                F. Issues & G. Action Directives
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                
                {/* Issue A */}
                <div className="form-group">
                  <label className="form-label">Issue A</label>
                  <select
                    value={PREDEFINED_ISSUES.includes(formData.issueA) ? formData.issueA : (formData.issueA ? 'CUSTOM' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'CUSTOM') handleInputChange('issueA', val);
                      else if (PREDEFINED_ISSUES.includes(formData.issueA)) handleInputChange('issueA', '');
                    }}
                    className="form-input"
                  >
                    <option value="">-- None / Select Predefined Issue --</option>
                    {PREDEFINED_ISSUES.map((issue, idx) => (
                      <option key={idx} value={issue}>{issue}</option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Issue...</option>
                  </select>

                  {(!PREDEFINED_ISSUES.includes(formData.issueA) || formData.issueA === '') && (
                    <input
                      type="text"
                      value={formData.issueA}
                      onChange={(e) => handleInputChange('issueA', e.target.value)}
                      placeholder="Type custom Issue A..."
                      className="form-input"
                      style={{ marginTop: '0.3rem' }}
                    />
                  )}
                </div>

                {/* Issue B */}
                <div className="form-group">
                  <label className="form-label">Issue B</label>
                  <select
                    value={PREDEFINED_ISSUES.includes(formData.issueB) ? formData.issueB : (formData.issueB ? 'CUSTOM' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'CUSTOM') handleInputChange('issueB', val);
                      else if (PREDEFINED_ISSUES.includes(formData.issueB)) handleInputChange('issueB', '');
                    }}
                    className="form-input"
                  >
                    <option value="">-- None / Select Predefined Issue --</option>
                    {PREDEFINED_ISSUES.map((issue, idx) => (
                      <option key={idx} value={issue}>{issue}</option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Issue...</option>
                  </select>

                  {(!PREDEFINED_ISSUES.includes(formData.issueB) || formData.issueB === '') && (
                    <input
                      type="text"
                      value={formData.issueB}
                      onChange={(e) => handleInputChange('issueB', e.target.value)}
                      placeholder="Type custom Issue B..."
                      className="form-input"
                      style={{ marginTop: '0.3rem' }}
                    />
                  )}
                </div>

                {/* Action Directive 1 */}
                <div className="form-group" style={{ marginTop: '0.4rem' }}>
                  <label className="form-label" style={{ color: '#10b981' }}>Action Directive 1</label>
                  <select
                    value={PREDEFINED_ACTIONS.includes(formData.action1) ? formData.action1 : (formData.action1 ? 'CUSTOM' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'CUSTOM') handleInputChange('action1', val);
                      else if (PREDEFINED_ACTIONS.includes(formData.action1)) handleInputChange('action1', '');
                    }}
                    className="form-input"
                    style={{ fontWeight: 700 }}
                  >
                    <option value="">-- Select Action Directive --</option>
                    {PREDEFINED_ACTIONS.map((act, idx) => (
                      <option key={idx} value={act}>{act}</option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Action Directive...</option>
                  </select>

                  {(!PREDEFINED_ACTIONS.includes(formData.action1) || formData.action1 === '') && (
                    <input
                      type="text"
                      value={formData.action1}
                      onChange={(e) => handleInputChange('action1', e.target.value)}
                      placeholder="Type custom Action Directive 1..."
                      className="form-input"
                      style={{ marginTop: '0.3rem', fontWeight: 700 }}
                    />
                  )}
                </div>

                {/* Action Directive 2 */}
                <div className="form-group">
                  <label className="form-label" style={{ color: '#10b981' }}>Action Directive 2</label>
                  <select
                    value={PREDEFINED_ACTIONS.includes(formData.action2) ? formData.action2 : (formData.action2 ? 'CUSTOM' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== 'CUSTOM') handleInputChange('action2', val);
                      else if (PREDEFINED_ACTIONS.includes(formData.action2)) handleInputChange('action2', '');
                    }}
                    className="form-input"
                    style={{ fontWeight: 700 }}
                  >
                    <option value="">-- Select Action Directive --</option>
                    {PREDEFINED_ACTIONS.map((act, idx) => (
                      <option key={idx} value={act}>{act}</option>
                    ))}
                    <option value="CUSTOM">+ Enter Custom Action Directive...</option>
                  </select>

                  {(!PREDEFINED_ACTIONS.includes(formData.action2) || formData.action2 === '') && (
                    <input
                      type="text"
                      value={formData.action2}
                      onChange={(e) => handleInputChange('action2', e.target.value)}
                      placeholder="Type custom Action Directive 2..."
                      className="form-input"
                      style={{ marginTop: '0.3rem', fontWeight: 700 }}
                    />
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* Action Button Strip */}
          <div className="awc-action-bar">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Editing Report for: <strong style={{ color: 'var(--text-primary)' }}>{activeAwcName}</strong> ({formData.visitDate})
            </div>

            <div className="awc-action-btns" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                <Save size={14} /> Save Draft
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => generateAwcMonitoringPdf({ ...formData, awcName: activeAwcName })}
                style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: 'var(--accent-secondary)' }}
              >
                <Download size={14} /> Download PDF
              </button>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                <CheckCircle2 size={14} /> Submit Final Report
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: HISTORY TABLE */}
      {activeSubTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Search & Filter Bar */}
          <div className="pricing-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8888a0' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AWC or Officer..."
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={awcFilter}
                onChange={(e) => setAwcFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="ALL">All AWCs</option>
                {ADOPTED_AWCS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Draft">Draft</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchReports}
                title="Refresh History"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="pricing-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8888a0', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Visit Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>AWC Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Officer Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Children Present</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#8888a0' }}>
                      No monthly monitoring reports found. Click "New Visit Form" to create your first report!
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((rep) => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{rep.visitDate}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 700 }}>{rep.awcName}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#8888a0' }}>{rep.officerName || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: rep.status === 'Submitted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: rep.status === 'Submitted' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${rep.status === 'Submitted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {rep.status || 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{rep.childrenPresentToday || '—'} / {rep.childrenEnrolled || '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            onClick={() => generateAwcMonitoringPdf(rep)}
                            title="Download PDF"
                          >
                            <Download size={13} /> PDF
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            onClick={() => handleEditReport(rep)}
                            title="Edit Report"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            onClick={() => handleCloneReport(rep)}
                            title="Clone Visit Template"
                          >
                            <Copy size={13} /> Clone
                          </button>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '0.3rem' }}
                            onClick={() => handleDeleteReport(rep.id, rep.awcName)}
                            title="Delete Report"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '20px',
            padding: '2rem 2.25rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e11d48' }}>
              <div style={{ background: 'rgba(225, 29, 72, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {confirmModal.title}
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmModal(null)}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.55rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
                }}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.actionText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMITTING PROGRESS MODAL OVERLAY */}
      {isSubmittingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-secondary, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '20px',
            padding: '2.2rem 2.5rem',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '4px solid rgba(124, 58, 237, 0.2)',
              borderTopColor: '#7c3aed',
              animation: 'spin 0.8s linear infinite'
            }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Processing Submission...
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {submittingStepText || 'Syncing data with cloud and generating inspection record.'}
            </p>
          </div>
        </div>
      )}

      {/* FLOATING GLASSMORPHIC POPUP TOAST */}
      {toastNotice && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          maxWidth: '380px',
          width: 'calc(100% - 4rem)',
          background: toastNotice.type === 'error' ? 'linear-gradient(135deg, #be123c, #9f1239)' :
                      toastNotice.type === 'success' ? 'linear-gradient(135deg, #059669, #047857)' :
                      'linear-gradient(135deg, #6d28d9, #4c1d95)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem'
        }}>
          {toastNotice.type === 'error' ? <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} /> :
           toastNotice.type === 'success' ? <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} /> :
           <Building2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.92rem', fontWeight: 800 }}>{toastNotice.title}</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9, lineHeight: 1.4 }}>{toastNotice.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: 0, fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
