import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import {
  ArrowLeft, Save, LogOut, Upload, Image, User, FileText,
  Award, BookOpen, GraduationCap, Briefcase, CheckCircle, AlertCircle, Eye
} from 'lucide-react';
import './Admin.css';

const ABOUT_DOC_ID = 'about_developer';

const DEFAULT_DATA = {
  name: 'Sheikh Gulfam',
  title: 'Founder & Lead Developer',
  quote: '"Great software, like nature, requires a strong foundation, adaptability, and continuous growth."',
  storyParagraphs: [
    'Founded by Sheikh Gulfam, NexLifTech is built on a unique foundation of scientific rigor and engineering excellence.',
    'Starting as a Lecturer in Botany with prestigious national credentials (NET-JRF CSIR, JKSET, GATE Life Sciences, ICAR NET), Sheikh\'s journey shifted during his PhD research at CSIR IIIM Jammu. A deep interest in automating workflows evolved into a passion for software development, leading to the creation of robust web applications, ERPs, and automation tools.',
    'Today, NexLifTech brings that same analytical, research-driven approach to solving business problems through technology. We don\'t just write code; we architect solutions that are secure, high-performing, and built to scale.'
  ],
  credentials: [
    { icon: 'award', label: 'CSIR NET-JRF Qualified' },
    { icon: 'book', label: 'CSIR IIIM Research Alumni' },
    { icon: 'graduation', label: 'GATE Life Sciences' },
    { icon: 'briefcase', label: 'Lecturer since 2017' }
  ],
  stats: [
    { label: 'Projects Completed', value: 45, suffix: '+' },
    { label: 'Happy Clients', value: 30, suffix: '+' },
    { label: 'Years Experience', value: 7, suffix: '+' },
    { label: 'Tech Stack Mastery', value: 12, suffix: '' }
  ],
  photoURL: '',
  showPhoto: true
};

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(DEFAULT_DATA);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Fetch existing data from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'siteContent', ABOUT_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({ ...DEFAULT_DATA, ...data });
          if (data.photoURL) {
            setPhotoPreview(data.photoURL);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        showToast('error', 'Failed to load existing data.');
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  function showToast(type, message) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000);
  }

  function handleFieldChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleStoryChange(index, value) {
    setFormData(prev => {
      const updated = [...prev.storyParagraphs];
      updated[index] = value;
      return { ...prev, storyParagraphs: updated };
    });
  }

  function addStoryParagraph() {
    setFormData(prev => ({
      ...prev,
      storyParagraphs: [...prev.storyParagraphs, '']
    }));
  }

  function removeStoryParagraph(index) {
    if (formData.storyParagraphs.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      storyParagraphs: prev.storyParagraphs.filter((_, i) => i !== index)
    }));
  }

  function handleCredentialChange(index, value) {
    setFormData(prev => {
      const updated = [...prev.credentials];
      updated[index] = { ...updated[index], label: value };
      return { ...prev, credentials: updated };
    });
  }

  function handleStatChange(index, field, value) {
    setFormData(prev => {
      const updated = [...prev.stats];
      updated[index] = { ...updated[index], [field]: field === 'value' ? Number(value) : value };
      return { ...prev, stats: updated };
    });
  }

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be under 5MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      let photoURL = formData.photoURL;

      // Upload photo if a new one was selected
      if (photoFile) {
        const storageRef = ref(storage, `developer/${Date.now()}_${photoFile.name}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      const dataToSave = {
        ...formData,
        photoURL,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      };

      const docRef = doc(db, 'siteContent', ABOUT_DOC_ID);
      await setDoc(docRef, dataToSave, { merge: true });

      setFormData(prev => ({ ...prev, photoURL }));
      setPhotoFile(null);
      showToast('success', 'Content saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      showToast('error', 'Failed to save. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  const credentialIcons = {
    award: <Award size={16} />,
    book: <BookOpen size={16} />,
    graduation: <GraduationCap size={16} />,
    briefcase: <Briefcase size={16} />
  };

  if (loadingData) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-bg-effects">
        <div className="admin-glow admin-glow-1"></div>
        <div className="admin-glow admin-glow-2"></div>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Top bar */}
      <div className="dashboard-topbar">
        <a href="/" className="admin-back-link">
          <ArrowLeft size={18} /> Back to Site
        </a>
        <div className="topbar-right">
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <Eye size={16} /> Preview Site
          </a>
          <span className="admin-email">{currentUser?.email}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Content Dashboard</h1>
          <p className="dashboard-subtitle">Manage the "About the Developer" section and site content.</p>
        </div>

        <div className="dashboard-grid">
          {/* Photo upload card */}
          <div className="dashboard-card glass-panel">
            <h2><Image size={20} /> Developer Photo</h2>
            <div className="photo-upload-area">
              {photoPreview ? (
                <div className="photo-preview-wrapper">
                  <img src={photoPreview} alt="Developer" className="photo-preview" />
                </div>
              ) : (
                <div className="photo-placeholder" onClick={() => fileInputRef.current?.click()}>
                  <User size={48} />
                  <p>Click to upload photo</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden-input"
              />
              <div className="photo-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.showPhoto}
                    onChange={(e) => handleFieldChange('showPhoto', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  Show photo on site
                </label>
              </div>
            </div>
          </div>

          {/* Basic info card */}
          <div className="dashboard-card glass-panel">
            <h2><User size={20} /> Basic Information</h2>
            <div className="admin-form-group">
              <label>Developer Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Title / Role</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Quote</label>
              <textarea
                value={formData.quote}
                onChange={(e) => handleFieldChange('quote', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Story paragraphs card */}
          <div className="dashboard-card glass-panel full-width">
            <h2><FileText size={20} /> About Story</h2>
            {formData.storyParagraphs.map((para, index) => (
              <div key={index} className="admin-form-group story-group">
                <label>Paragraph {index + 1}</label>
                <div className="story-input-row">
                  <textarea
                    value={para}
                    onChange={(e) => handleStoryChange(index, e.target.value)}
                    rows={3}
                  />
                  {formData.storyParagraphs.length > 1 && (
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => removeStoryParagraph(index)}
                      aria-label="Remove paragraph"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={addStoryParagraph}>
              + Add Paragraph
            </button>
          </div>

          {/* Credentials card */}
          <div className="dashboard-card glass-panel">
            <h2><Award size={20} /> Credentials</h2>
            {formData.credentials.map((cred, index) => (
              <div key={index} className="admin-form-group">
                <label className="credential-label">
                  {credentialIcons[cred.icon]} Credential {index + 1}
                </label>
                <input
                  type="text"
                  value={cred.label}
                  onChange={(e) => handleCredentialChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Stats card */}
          <div className="dashboard-card glass-panel">
            <h2>📊 Statistics</h2>
            {formData.stats.map((stat, index) => (
              <div key={index} className="stat-edit-row">
                <div className="admin-form-group stat-label-group">
                  <label>Label</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                  />
                </div>
                <div className="admin-form-group stat-value-group">
                  <label>Value</label>
                  <input
                    type="number"
                    value={stat.value}
                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                  />
                </div>
                <div className="admin-form-group stat-suffix-group">
                  <label>Suffix</label>
                  <input
                    type="text"
                    value={stat.suffix}
                    onChange={(e) => handleStatChange(index, 'suffix', e.target.value)}
                    placeholder="e.g. +"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="dashboard-actions">
          <button
            className="btn btn-primary btn-lg save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="btn-spinner"></span>
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={20} /> Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
