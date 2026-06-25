import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import {
  ArrowLeft, Save, LogOut, Upload, Image, User, FileText,
  Award, CheckCircle, AlertCircle, Eye,
  Mail, MailOpen, Trash2, Calendar, DollarSign, Globe, Inbox
} from 'lucide-react';
import './Admin.css';

const ABOUT_DOC_ID = 'about_developer';

const DEFAULT_DATA = {
  name: 'Sheikh Gulfam',
  title: 'Founder & Lead Developer',
  quote: '"Great software, like nature, requires a strong foundation, adaptability, and continuous growth."',
  storyParagraphs: [
    'Founded by Sheikh Gulfam, NexLifTech is built on a unique foundation of scientific rigor and engineering excellence.',
    'Starting as a Lecturer in Botany with national level exams like NET-JRF CSIR and others, Sheikh\'s journey shifted during his PhD research at CSIR IIIM Jammu. A deep interest in automating workflows evolved into a passion for software development, leading to the creation of robust web applications, ERPs, and automation tools.',
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

const DEFAULT_PRICING = [
  {
    name: "Starter",
    tabName: "Starter",
    description: "Perfect for personal brands and small local businesses.",
    price: "₹14,999",
    features: [
      "Single-page responsive website",
      "Modern design (Vite + React)",
      "Basic SEO setup",
      "Contact form integration",
      "1 Revision cycle",
      "1 month free support"
    ],
    isPopular: false
  },
  {
    name: "Professional",
    tabName: "Pro",
    description: "Ideal for growing businesses needing a comprehensive online presence.",
    price: "₹34,999",
    features: [
      "Multi-page website (up to 7 pages)",
      "CMS integration for easy updates",
      "Advanced SEO & Analytics",
      "Security headers & hardening",
      "3 Revision cycles",
      "3 months free support"
    ],
    isPopular: true
  },
  {
    name: "Enterprise ERP",
    tabName: "Enterprise",
    description: "Custom web applications and portals for schools or large organizations.",
    price: "Custom",
    features: [
      "Full-stack Web Application",
      "Database & User Authentication",
      "Custom dashboards & reporting",
      "Payment gateway integration",
      "Unlimited revisions during dev",
      "1 year priority support"
    ],
    isPopular: false
  }
];

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

  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'messages'
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

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

  // Fetch contact form messages in real-time
  useEffect(() => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setLoadingMessages(false);
    }, (err) => {
      console.error('Error loading messages:', err);
      showToast('error', 'Failed to load contact messages.');
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const [pricingPlans, setPricingPlans] = useState(DEFAULT_PRICING);
  const [loadingPricing, setLoadingPricing] = useState(true);

  // Fetch pricing data from Firestore
  useEffect(() => {
    async function fetchPricing() {
      try {
        const docRef = doc(db, 'siteContent', 'pricing_plans');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().plans) {
          setPricingPlans(docSnap.data().plans);
        }
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
      } finally {
        setLoadingPricing(false);
      }
    }
    fetchPricing();
  }, []);

  function handlePlanFieldChange(planIndex, field, value) {
    setPricingPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = { ...updated[planIndex], [field]: value };
      return updated;
    });
  }

  function handlePlanFeatureChange(planIndex, featureIndex, value) {
    setPricingPlans(prev => {
      const updated = [...prev];
      const updatedFeatures = [...updated[planIndex].features];
      updatedFeatures[featureIndex] = value;
      updated[planIndex] = { ...updated[planIndex], features: updatedFeatures };
      return updated;
    });
  }

  function addPlanFeature(planIndex) {
    setPricingPlans(prev => {
      const updated = [...prev];
      updated[planIndex] = {
        ...updated[planIndex],
        features: [...updated[planIndex].features, '']
      };
      return updated;
    });
  }

  function removePlanFeature(planIndex, featureIndex) {
    setPricingPlans(prev => {
      const updated = [...prev];
      const updatedFeatures = updated[planIndex].features.filter((_, i) => i !== featureIndex);
      updated[planIndex] = { ...updated[planIndex], features: updatedFeatures };
      return updated;
    });
  }

  async function handleSavePricing() {
    setSaving(true);
    try {
      const docRef = doc(db, 'siteContent', 'pricing_plans');
      await setDoc(docRef, {
        plans: pricingPlans,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });
      showToast('success', 'Pricing plans saved successfully!');
    } catch (err) {
      console.error('Error saving pricing:', err);
      showToast('error', 'Failed to save pricing.');
    } finally {
      setSaving(false);
    }
  }

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

  async function toggleReadStatus(msgId, currentStatus) {
    try {
      const msgRef = doc(db, 'contactMessages', msgId);
      await updateDoc(msgRef, {
        status: currentStatus === 'unread' ? 'read' : 'unread'
      });
      showToast('success', `Marked message as ${currentStatus === 'unread' ? 'read' : 'unread'}`);
    } catch (err) {
      console.error('Error toggling read status:', err);
      showToast('error', 'Failed to update message status.');
    }
  }

  async function deleteMessage(msgId) {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'contactMessages', msgId));
      showToast('success', 'Message deleted successfully.');
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('error', 'Failed to delete message.');
    }
  }

  function formatProjectType(type) {
    const mapping = {
      'landing-page': 'Landing Page',
      'business-site': 'Business Website',
      'school-website': 'School Website',
      'ecommerce': 'E-Commerce',
      'web-app': 'Web Application',
      'other': 'Other'
    };
    return mapping[type] || type;
  }

  function formatBudget(budget) {
    const mapping = {
      '<20k': 'Less than ₹20,000',
      '20k-50k': '₹20,000 - ₹50,000',
      '50k-100k': '₹50,000 - ₹1,00,000',
      '>100k': 'More than ₹1,00,000'
    };
    return mapping[budget] || budget;
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

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
        <div className="dashboard-header-wrapper">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p className="dashboard-subtitle">Manage site content and view incoming customer messages.</p>
          </div>
          
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <User size={16} /> Edit Content
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              <DollarSign size={16} /> Edit Pricing
            </button>
            <button 
              className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              <Mail size={16} /> Messages Inbox
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'content' ? (
          <>
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
                      <Award size={14} /> Credential {index + 1}
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
                <h2><CheckCircle size={20} /> Stats</h2>
                {formData.stats.map((stat, index) => (
                  <div key={index} className="admin-form-group stat-editor-row">
                    <div className="stat-input-col">
                      <label>Label</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                      />
                    </div>
                    <div className="stat-input-col size-sm">
                      <label>Value</label>
                      <input
                        type="number"
                        value={stat.value}
                        onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                      />
                    </div>
                    <div className="stat-input-col size-xs">
                      <label>Suffix</label>
                      <input
                        type="text"
                        value={stat.suffix}
                        onChange={(e) => handleStatChange(index, 'suffix', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="save-bar">
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
          </>
        ) : activeTab === 'pricing' ? (
          <div className="pricing-editor-section">
            <div className="pricing-editor-header">
              <h2><DollarSign size={20} /> Manage Pricing Plans</h2>
              <p className="pricing-editor-subtitle">Modify plan names, prices, descriptions, and features.</p>
            </div>
            
            {loadingPricing ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading pricing data...</p>
              </div>
            ) : (
              <>
                <div className="pricing-editor-grid">
                  {pricingPlans.map((plan, planIdx) => (
                    <div key={planIdx} className="dashboard-card glass-panel pricing-editor-card">
                      <div className="pricing-card-title-row">
                        <h3>{plan.name}</h3>
                        {plan.isPopular && <span className="popular-badge-pill">Popular</span>}
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Plan Name</label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) => handlePlanFieldChange(planIdx, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Tab Label (Mobile)</label>
                        <input
                          type="text"
                          value={plan.tabName}
                          onChange={(e) => handlePlanFieldChange(planIdx, 'tabName', e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Price Text</label>
                        <input
                          type="text"
                          value={plan.price}
                          onChange={(e) => handlePlanFieldChange(planIdx, 'price', e.target.value)}
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Description</label>
                        <textarea
                          value={plan.description}
                          onChange={(e) => handlePlanFieldChange(planIdx, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      
                      <div className="admin-form-group features-editor-group">
                        <label>Features Checklist</label>
                        {plan.features.map((feature, featIdx) => (
                          <div key={featIdx} className="feature-input-row">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => handlePlanFeatureChange(planIdx, featIdx, e.target.value)}
                            />
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => removePlanFeature(planIdx, featIdx)}
                              aria-label="Remove feature"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button 
                          className="btn btn-secondary btn-sm add-feature-btn" 
                          onClick={() => addPlanFeature(planIdx)}
                        >
                          + Add Feature Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="save-bar">
                  <button
                    className="btn btn-primary btn-lg save-btn"
                    onClick={handleSavePricing}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving Pricing Plans...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Save Pricing Plans
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="inbox-container">
            <div className="inbox-header">
              <h2><Inbox size={20} /> Contact Messages Inbox</h2>
              {messages.length > 0 && (
                <span className="inbox-meta">
                  {messages.length} message{messages.length !== 1 ? 's' : ''} total ({unreadCount} unread)
                </span>
              )}
            </div>

            {loadingMessages ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="inbox-empty glass-panel">
                <Mail size={48} className="empty-icon" />
                <h3>Your Inbox is Empty</h3>
                <p>When visitors submit the contact form on your site, their messages will appear here in real-time.</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-card glass-panel ${msg.status === 'unread' ? 'unread' : 'read'}`}
                  >
                    <div className="message-card-header">
                      <div className="sender-info">
                        <div className="sender-name-row">
                          <h3>{msg.name}</h3>
                          {msg.status === 'unread' && <span className="unread-dot-badge">New</span>}
                        </div>
                        <a href={`mailto:${msg.email}`} className="sender-email">{msg.email}</a>
                      </div>
                      <div className="message-meta">
                        <span className="meta-item"><Calendar size={14} /> {formatDate(msg.createdAt)}</span>
                        <span className="meta-item project-badge"><Globe size={14} /> {formatProjectType(msg.projectType)}</span>
                        <span className="meta-item budget-badge"><DollarSign size={14} /> {formatBudget(msg.budget)}</span>
                        {msg.mobile && <span className="meta-item" style={{color:'#06eeff'}}>📱 {msg.mobile}</span>}
                        {(msg.tehsil || msg.district) && (
                          <span className="meta-item" style={{color:'#a855f7'}}>
                            📍 {[msg.tehsil, msg.district].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="message-body">
                      <p>{msg.message}</p>
                    </div>
                    
                    <div className="message-actions">
                      <button 
                        className={`btn btn-secondary btn-sm read-toggle-btn ${msg.status === 'unread' ? 'action-read' : 'action-unread'}`}
                        onClick={() => toggleReadStatus(msg.id, msg.status)}
                      >
                        {msg.status === 'unread' ? <MailOpen size={14} /> : <Mail size={14} />}
                        {msg.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm delete-btn"
                        onClick={() => deleteMessage(msg.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
