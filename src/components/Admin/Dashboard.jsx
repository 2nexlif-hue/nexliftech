import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  ArrowLeft, Save, LogOut, Upload, Image, User, FileText,
  Award, BookOpen, GraduationCap, Briefcase, CheckCircle, AlertCircle, Eye,
  Mail, MailOpen, Trash2, Calendar, DollarSign, Globe, Inbox
} from 'lucide-react';
import './Admin.css';

const ABOUT_DOC_ID = 'about_developer';

const DEFAULT_HERO = {
  badge: 'Next LIfe Technologies',
  title: 'We Build Digital Experiences That [Drive Growth]',
  subtitle: 'State-of-the-art websites and web applications built with modern engineering, unparalleled performance, and robust security for schools, businesses, and personal brands.',
  ctaText1: 'Start Your Project',
  ctaLink1: '#contact',
  ctaText2: 'View Our Work',
  ctaLink2: '#portfolio',
  trustText: 'Trusted technology stack:',
  techBadges: ['React', 'Vite', 'Firebase', 'Next.js']
};

const DEFAULT_SERVICES = [
  {
    title: "Custom Web Development",
    description: "Fast, modern single-page applications and websites built using React, Next.js, and modern tech stacks.",
    icon: "💻",
    color: "rgba(139, 92, 246, 0.15)"
  },
  {
    title: "E-Commerce Solutions",
    description: "Secure, high-converting online stores tailored to your business needs with seamless payment integration.",
    icon: "🛒",
    color: "rgba(99, 102, 241, 0.15)"
  },
  {
    title: "Web Applications",
    description: "Complex SaaS platforms, admin dashboards, and internal tools engineered for scale and usability.",
    icon: "🖥️",
    color: "rgba(6, 182, 212, 0.15)"
  },
  {
    title: "Performance Optimization",
    description: "We tune your existing sites to hit 100/100 Lighthouse scores, ensuring blazing fast load times and better SEO.",
    icon: "🚀",
    color: "rgba(16, 185, 129, 0.15)"
  },
  {
    title: "Security Hardening",
    description: "Protect your users and data with OWASP-compliant architecture, security headers, and modern auth flows.",
    icon: "🛡️",
    color: "rgba(168, 85, 247, 0.15)"
  },
  {
    title: "Maintenance & Support",
    description: "Ongoing technical support, automated backups, and dependency updates so you can focus on your business.",
    icon: "🔧",
    color: "rgba(244, 114, 182, 0.15)"
  }
];

const DEFAULT_PROJECTS = [
  {
    title: 'Govt HSS Shangus ERP',
    category: 'Education & Portals',
    description: 'A comprehensive Admission and Examination Portal for Government Higher Secondary School Shangus. Features include bulk roll number assignment, reporting utilities, and a centralized admin dashboard.',
    tech: ['React', 'Firebase', 'Tailwind', 'Node.js'],
    liveLink: 'https://hssshangus.netlify.app/',
    image: '/erp-preview.png'
  },
  {
    title: 'Visit Alpines',
    category: 'Travel & Tourism',
    description: 'A premium booking and travel itinerary web application for Alpine tours, showcasing gorgeous destinations, guided tours, and bookings.',
    tech: ['React', 'Vite', 'CSS', 'Framer Motion'],
    liveLink: 'https://visitalpines.com/',
    image: '/alpine-preview.png'
  },
  {
    title: 'WalletVibe',
    category: 'Finance & Tools',
    description: 'An online personal finance tool designed to simplify money management—featuring expenditure tracking, lend/borrow record management, bank statements, and financial reporting.',
    tech: ['React', 'Firebase', 'Tailwind', 'Node.js'],
    liveLink: 'https://walletvibe.netlify.app/',
    image: '/walletvibe-preview.svg'
  },
  {
    title: 'Automated Educational & Reporting Suite',
    category: 'Workflow Automation',
    description: 'Custom Python, Selenium & Apps Script tools to auto-fetch, import & update UDISE+ student profiles, download JKBOSE 10th–12th bulk results, handle RR & exam form submissions, generate QR codes, perform system cleanup, and compile custom lists & reports.',
    tech: ['Python', 'Selenium', 'Apps Script', 'VBA', 'Automation'],
    githubLink: '#',
    image: '/automation-preview.svg'
  }
];

const DEFAULT_TESTIMONIALS = [
  {
    name: "Principal",
    role: "Govt HSS Shangus",
    content: "The ERP portal developed by NexLifTech revolutionized our admission and examination process. The bulk roll number assignment alone saves us weeks of manual work. Incredible attention to detail.",
    rating: 5
  },
  {
    name: "Local Retail Owner",
    role: "E-Commerce Client",
    content: "Sheikh and his team delivered a blazing fast online store for us. Our mobile conversion rates doubled within the first month. The dark mode design is absolutely stunning.",
    rating: 5
  },
  {
    name: "Operations Manager",
    role: "Corporate Client",
    content: "The automated reporting scripts built in Python and VBA have freed up our team from tedious daily tasks. NexLifTech really understands how to solve business bottlenecks with code.",
    rating: 5
  }
];

const DEFAULT_DATA = {
  name: 'Sheikh Gulfam',
  title: 'Lecturer Botany | PhD CSIR IIIM Alumni | MSc Data Science Scholar',
  quote: '"Integrating scientific research, data science, and software engineering to solve real-world challenges."',
  storyParagraphs: [
    'Founded by Sheikh Gulfam — CSIR IIIM PhD Research Alumni, CSIR NET-JRF holder, and Lecturer in Botany in the School Education Department since 2017.',
    'Combining a scientific research background with a strong passion for computational skills and workflow automation, he is currently pursuing an MSc in Data Science & Analytics to engineer high-impact, real-world software applications.'
  ],
  credentials: [
    { icon: 'book', label: 'CSIR IIIM Research Alumni' },
    { icon: 'briefcase', label: 'Lecturer since 2017' },
    { icon: 'code', label: 'Tech enthusiast' }
  ],
  stats: [
    { label: 'Production Builds', value: 45, suffix: '+' },
    { label: 'Lighthouse Target', value: 100, suffix: '/100' },
    { label: 'System Uptime', value: 99, suffix: '%' },
    { label: 'Years Teaching & Dev', value: 7, suffix: '+' }
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
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const [activeTab, setActiveTab] = useState('hero'); // default to 'hero' tab
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [heroData, setHeroData] = useState(DEFAULT_HERO);
  const [loadingHero, setLoadingHero] = useState(true);

  const [servicesList, setServicesList] = useState(DEFAULT_SERVICES);
  const [loadingServices, setLoadingServices] = useState(true);

  const [projectsList, setProjectsList] = useState(DEFAULT_PROJECTS);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [testimonialsList, setTestimonialsList] = useState(DEFAULT_TESTIMONIALS);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Fetch Hero from Firestore
  useEffect(() => {
    async function fetchHero() {
      try {
        const docRef = doc(db, 'siteContent', 'hero');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHeroData({ ...DEFAULT_HERO, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching hero:', err);
      } finally {
        setLoadingHero(false);
      }
    }
    fetchHero();
  }, []);

  // Fetch Services from Firestore
  useEffect(() => {
    async function fetchServices() {
      try {
        const docRef = doc(db, 'siteContent', 'services_list');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().services) {
          setServicesList(docSnap.data().services);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // Fetch Projects from Firestore
  useEffect(() => {
    async function fetchProjects() {
      try {
        const docRef = doc(db, 'siteContent', 'portfolio_projects');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().projects) {
          const loadedProjects = docSnap.data().projects.map(p => {
            if (p.title === 'Green Valley Holidays' || p.liveLink?.includes('greenvalleyholidays')) {
              return {
                title: 'WalletVibe',
                category: 'Finance & Tools',
                description: 'An online personal finance tool designed to simplify money management—featuring expenditure tracking, lend/borrow record management, bank statements, and financial reporting.',
                tech: ['React', 'Firebase', 'Tailwind', 'Node.js'],
                liveLink: 'https://walletvibe.netlify.app/',
                image: '/walletvibe-preview.svg'
              };
            }
            if (p.title?.includes('Automated Reporting')) {
              return {
                title: 'Automated Educational & Reporting Suite',
                category: 'Workflow Automation',
                description: 'Custom Python, Selenium & Apps Script tools to auto-fetch, import & update UDISE+ student profiles, download JKBOSE 10th–12th bulk results, handle RR & exam form submissions, generate QR codes, perform system cleanup, and compile custom lists & reports.',
                tech: ['Python', 'Selenium', 'Apps Script', 'VBA', 'Automation'],
                githubLink: '#',
                image: '/automation-preview.svg'
              };
            }
            return p;
          });
          setProjectsList(loadedProjects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  // Fetch Testimonials from Firestore
  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const docRef = doc(db, 'siteContent', 'testimonials_list');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().testimonials) {
          setTestimonialsList(docSnap.data().testimonials);
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err);
      } finally {
        setLoadingTestimonials(false);
      }
    }
    fetchTestimonials();
  }, []);

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

  // Hero Section Editor Handlers
  function handleHeroFieldChange(field, value) {
    setHeroData(prev => ({ ...prev, [field]: value }));
  }

  function handleHeroTechBadgeChange(index, value) {
    setHeroData(prev => {
      const updated = [...prev.techBadges];
      updated[index] = value;
      return { ...prev, techBadges: updated };
    });
  }

  function addHeroTechBadge() {
    setHeroData(prev => ({
      ...prev,
      techBadges: [...prev.techBadges, '']
    }));
  }

  function removeHeroTechBadge(index) {
    setHeroData(prev => ({
      ...prev,
      techBadges: prev.techBadges.filter((_, i) => i !== index)
    }));
  }

  async function handleSaveHero() {
    setSaving(true);
    try {
      const docRef = doc(db, 'siteContent', 'hero');
      await setDoc(docRef, {
        ...heroData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });
      showToast('success', 'Hero content saved successfully!');
    } catch (err) {
      console.error('Error saving hero:', err);
      showToast('error', 'Failed to save hero content.');
    } finally {
      setSaving(false);
    }
  }

  // Services Editor Handlers
  function handleServiceFieldChange(index, field, value) {
    setServicesList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addService() {
    setServicesList(prev => [
      ...prev,
      {
        title: '',
        description: '',
        icon: '💻',
        color: 'rgba(139, 92, 246, 0.15)'
      }
    ]);
  }

  function removeService(index) {
    if (servicesList.length <= 1) {
      showToast('error', 'You must have at least one service.');
      return;
    }
    setServicesList(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveServices() {
    setSaving(true);
    try {
      const docRef = doc(db, 'siteContent', 'services_list');
      await setDoc(docRef, {
        services: servicesList,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });
      showToast('success', 'Services saved successfully!');
    } catch (err) {
      console.error('Error saving services:', err);
      showToast('error', 'Failed to save services.');
    } finally {
      setSaving(false);
    }
  }

  // Projects Editor Handlers
  function handleProjectFieldChange(index, field, value) {
    setProjectsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleProjectTechChange(projectIndex, techIndex, value) {
    setProjectsList(prev => {
      const updated = [...prev];
      const updatedTech = [...updated[projectIndex].tech];
      updatedTech[techIndex] = value;
      updated[projectIndex] = { ...updated[projectIndex], tech: updatedTech };
      return updated;
    });
  }

  function addProjectTech(projectIndex) {
    setProjectsList(prev => {
      const updated = [...prev];
      updated[projectIndex] = {
        ...updated[projectIndex],
        tech: [...updated[projectIndex].tech, '']
      };
      return updated;
    });
  }

  function removeProjectTech(projectIndex, techIndex) {
    setProjectsList(prev => {
      const updated = [...prev];
      const updatedTech = updated[projectIndex].tech.filter((_, i) => i !== techIndex);
      updated[projectIndex] = { ...updated[projectIndex], tech: updatedTech };
      return updated;
    });
  }

  function addProject() {
    setProjectsList(prev => [
      ...prev,
      {
        title: '',
        category: '',
        description: '',
        tech: ['React'],
        liveLink: '',
        githubLink: '',
        image: '/erp-preview.png'
      }
    ]);
  }

  function removeProject(index) {
    if (projectsList.length <= 1) {
      showToast('error', 'You must have at least one project.');
      return;
    }
    setProjectsList(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveProjects() {
    setSaving(true);
    try {
      const docRef = doc(db, 'siteContent', 'portfolio_projects');
      await setDoc(docRef, {
        projects: projectsList,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });
      showToast('success', 'Featured projects saved successfully!');
    } catch (err) {
      console.error('Error saving projects:', err);
      showToast('error', 'Failed to save featured projects.');
    } finally {
      setSaving(false);
    }
  }

  // Testimonials Editor Handlers
  function handleTestimonialFieldChange(index, field, value) {
    setTestimonialsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: field === 'rating' ? Number(value) : value };
      return updated;
    });
  }

  function addTestimonial() {
    setTestimonialsList(prev => [
      ...prev,
      {
        name: '',
        role: '',
        content: '',
        rating: 5
      }
    ]);
  }

  function removeTestimonial(index) {
    if (testimonialsList.length <= 1) {
      showToast('error', 'You must have at least one testimonial.');
      return;
    }
    setTestimonialsList(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveTestimonials() {
    setSaving(true);
    try {
      const docRef = doc(db, 'siteContent', 'testimonials_list');
      await setDoc(docRef, {
        testimonials: testimonialsList,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      });
      showToast('success', 'Testimonials saved successfully!');
    } catch (err) {
      console.error('Error saving testimonials:', err);
      showToast('error', 'Failed to save testimonials.');
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

  function handleCredentialIconChange(index, value) {
    setFormData(prev => {
      const updated = [...prev.credentials];
      updated[index] = { ...updated[index], icon: value };
      return { ...prev, credentials: updated };
    });
  }

  function addCredential() {
    setFormData(prev => ({
      ...prev,
      credentials: [...prev.credentials, { icon: 'award', label: '' }]
    }));
  }

  // Allow deleting credentials while keeping at least one row
  function removeCredential(index) {
    if (formData.credentials.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index)
    }));
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

    // Validate file type and size (limit to 600KB to fit well within Firestore's 1MB limit)
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file.');
      return;
    }
    if (file.size > 600 * 1024) {
      showToast('error', 'Image must be under 600KB for direct document storage.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target.result;
      setPhotoPreview(base64Data);
      setFormData(prev => ({ ...prev, photoURL: base64Data }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.email
      };

      const docRef = doc(db, 'siteContent', ABOUT_DOC_ID);
      await setDoc(docRef, dataToSave, { merge: true });

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
              className={`tab-btn ${activeTab === 'hero' ? 'active' : ''}`}
              onClick={() => setActiveTab('hero')}
            >
              <Globe size={16} /> Hero
            </button>
            <button 
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <User size={16} /> About
            </button>
            <button 
              className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              <BookOpen size={16} /> Services
            </button>
            <button 
              className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <Briefcase size={16} /> Projects
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveTab('pricing')}
            >
              <DollarSign size={16} /> Pricing
            </button>
            <button 
              className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
              onClick={() => setActiveTab('testimonials')}
            >
              <Award size={16} /> Testimonials
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

        {activeTab === 'hero' ? (
          <div className="pricing-editor-section">
            <div className="pricing-editor-header">
              <h2><Globe size={20} /> Manage Hero Section</h2>
              <p className="pricing-editor-subtitle">Modify the landing page header title, subtitle, badges, and tech stack logos.</p>
            </div>
            
            {loadingHero ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading hero content...</p>
              </div>
            ) : (
              <>
                <div className="dashboard-grid">
                  <div className="dashboard-card glass-panel">
                    <h2>Basic Info</h2>
                    <div className="admin-form-group">
                      <label>Badge Text</label>
                      <input
                        type="text"
                        value={heroData.badge}
                        onChange={(e) => handleHeroFieldChange('badge', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Main Title (use [text] for gradient highlights)</label>
                      <input
                        type="text"
                        value={heroData.title}
                        onChange={(e) => handleHeroFieldChange('title', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Subtitle / Description</label>
                      <textarea
                        value={heroData.subtitle}
                        onChange={(e) => handleHeroFieldChange('subtitle', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="dashboard-card glass-panel">
                    <h2>Call to Actions & Stack Settings</h2>
                    <div className="admin-form-group">
                      <label>Primary CTA Text</label>
                      <input
                        type="text"
                        value={heroData.ctaText1}
                        onChange={(e) => handleHeroFieldChange('ctaText1', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Primary CTA Link</label>
                      <input
                        type="text"
                        value={heroData.ctaLink1}
                        onChange={(e) => handleHeroFieldChange('ctaLink1', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Secondary CTA Text</label>
                      <input
                        type="text"
                        value={heroData.ctaText2}
                        onChange={(e) => handleHeroFieldChange('ctaText2', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Secondary CTA Link</label>
                      <input
                        type="text"
                        value={heroData.ctaLink2}
                        onChange={(e) => handleHeroFieldChange('ctaLink2', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Trust Signals Label</label>
                      <input
                        type="text"
                        value={heroData.trustText || ''}
                        onChange={(e) => handleHeroFieldChange('trustText', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="dashboard-card glass-panel full-width">
                    <h2>Technology Stack Badges</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      {heroData.techBadges.map((badge, idx) => (
                        <div key={idx} className="feature-input-row">
                          <input
                            type="text"
                            value={badge}
                            onChange={(e) => handleHeroTechBadgeChange(idx, e.target.value)}
                            placeholder="e.g. Next.js"
                          />
                          <button
                            type="button"
                            className="btn-icon btn-danger"
                            onClick={() => removeHeroTechBadge(idx)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={addHeroTechBadge}
                    >
                      + Add Tech Badge
                    </button>
                  </div>
                </div>

                <div className="save-bar">
                  <button
                    className="btn btn-primary btn-lg save-btn"
                    onClick={handleSaveHero}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving Hero Section...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Save Hero Section
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'services' ? (
          <div className="pricing-editor-section">
            <div className="pricing-editor-header">
              <h2><BookOpen size={20} /> Manage Services</h2>
              <p className="pricing-editor-subtitle">Modify the services and expertise listed on your landing page.</p>
            </div>
            
            {loadingServices ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading services...</p>
              </div>
            ) : (
              <>
                <div className="pricing-editor-grid">
                  {servicesList.map((service, servIdx) => (
                    <div key={servIdx} className="dashboard-card glass-panel pricing-editor-card" style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem' }}
                        onClick={() => removeService(servIdx)}
                        aria-label="Remove service"
                        title="Remove service"
                      >
                        ×
                      </button>
                      
                      <h3>Service #{servIdx + 1}: {service.title || 'Untitled'}</h3>
                      
                      <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                        <label>Title</label>
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => handleServiceFieldChange(servIdx, 'title', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Icon Emoji</label>
                        <input
                          type="text"
                          value={service.icon}
                          onChange={(e) => handleServiceFieldChange(servIdx, 'icon', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Background Color (RGBA)</label>
                        <input
                          type="text"
                          value={service.color}
                          onChange={(e) => handleServiceFieldChange(servIdx, 'color', e.target.value)}
                          placeholder="e.g. rgba(139, 92, 246, 0.15)"
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Description</label>
                        <textarea
                          value={service.description}
                          onChange={(e) => handleServiceFieldChange(servIdx, 'description', e.target.value)}
                          rows={3}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={addService}
                  >
                    + Add New Service Card
                  </button>
                </div>
                
                <div className="save-bar">
                  <button
                    className="btn btn-primary btn-lg save-btn"
                    onClick={handleSaveServices}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving Services...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Save Services List
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'projects' ? (
          <div className="pricing-editor-section">
            <div className="pricing-editor-header">
              <h2><Briefcase size={20} /> Manage Featured Projects</h2>
              <p className="pricing-editor-subtitle">Add, remove, or edit your showcase projects shown on the homepage.</p>
            </div>
            
            {loadingProjects ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading projects...</p>
              </div>
            ) : (
              <>
                <div className="projects-editor-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {projectsList.map((project, projIdx) => (
                    <div key={projIdx} className="dashboard-card glass-panel" style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-danger"
                        style={{ position: 'absolute', top: '1.25rem', right: '1.5rem' }}
                        onClick={() => removeProject(projIdx)}
                      >
                        <Trash2 size={14} /> Remove Project
                      </button>
                      
                      <h3>Project #{projIdx + 1}: {project.title || 'Untitled'}</h3>
                      
                      <div className="dashboard-grid" style={{ marginTop: '1rem' }}>
                        <div className="admin-form-group">
                          <label>Project Title</label>
                          <input
                            type="text"
                            value={project.title}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'title', e.target.value)}
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Category</label>
                          <input
                            type="text"
                            value={project.category}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'category', e.target.value)}
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>Live Demo URL (optional)</label>
                          <input
                            type="text"
                            value={project.liveLink || ''}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'liveLink', e.target.value)}
                          />
                        </div>
                        <div className="admin-form-group">
                          <label>GitHub Repository URL (optional)</label>
                          <input
                            type="text"
                            value={project.githubLink || ''}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'githubLink', e.target.value)}
                          />
                        </div>
                        <div className="admin-form-group full-width">
                          <label>Image Preview Path / URL (e.g. /erp-preview.png, /alpine-preview.png, /walletvibe-preview.svg)</label>
                          <input
                            type="text"
                            value={project.image}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'image', e.target.value)}
                            placeholder="e.g. /erp-preview.png"
                          />
                        </div>
                        <div className="admin-form-group full-width">
                          <label>Description</label>
                          <textarea
                            value={project.description}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'description', e.target.value)}
                            rows={3}
                            required
                          />
                        </div>
                        <div className="admin-form-group full-width">
                          <label>Tech Stack Tags</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {project.tech.map((tag, tagIdx) => (
                              <div key={tagIdx} className="feature-input-row">
                                <input
                                  type="text"
                                  value={tag}
                                  onChange={(e) => handleProjectTechChange(projIdx, tagIdx, e.target.value)}
                                  placeholder="e.g. React"
                                />
                                <button
                                  type="button"
                                  className="btn-icon btn-danger"
                                  onClick={() => removeProjectTech(projIdx, tagIdx)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => addProjectTech(projIdx)}
                          >
                            + Add Tech Tag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={addProject}
                  >
                    + Add New Project Card
                  </button>
                </div>
                
                <div className="save-bar">
                  <button
                    className="btn btn-primary btn-lg save-btn"
                    onClick={handleSaveProjects}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving Projects...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Save Featured Projects
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'testimonials' ? (
          <div className="pricing-editor-section">
            <div className="pricing-editor-header">
              <h2><Award size={20} /> Manage Testimonials</h2>
              <p className="pricing-editor-subtitle">Modify or add client reviews and success stories.</p>
            </div>
            
            {loadingTestimonials ? (
              <div className="inbox-loading">
                <div className="admin-spinner"></div>
                <p>Loading testimonials...</p>
              </div>
            ) : (
              <>
                <div className="pricing-editor-grid">
                  {testimonialsList.map((test, testIdx) => (
                    <div key={testIdx} className="dashboard-card glass-panel pricing-editor-card" style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.5rem' }}
                        onClick={() => removeTestimonial(testIdx)}
                        aria-label="Remove testimonial"
                        title="Remove testimonial"
                      >
                        ×
                      </button>
                      
                      <h3>Testimonial #{testIdx + 1}</h3>
                      
                      <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                        <label>Client Name</label>
                        <input
                          type="text"
                          value={test.name}
                          onChange={(e) => handleTestimonialFieldChange(testIdx, 'name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Role / Company</label>
                        <input
                          type="text"
                          value={test.role}
                          onChange={(e) => handleTestimonialFieldChange(testIdx, 'role', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Rating (1-5)</label>
                        <select
                          value={test.rating}
                          onChange={(e) => handleTestimonialFieldChange(testIdx, 'rating', e.target.value)}
                        >
                          <option value={1}>1 Star</option>
                          <option value={2}>2 Stars</option>
                          <option value={3}>3 Stars</option>
                          <option value={4}>4 Stars</option>
                          <option value={5}>5 Stars</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-group">
                        <label>Review Quote Content</label>
                        <textarea
                          value={test.content}
                          onChange={(e) => handleTestimonialFieldChange(testIdx, 'content', e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={addTestimonial}
                  >
                    + Add New Testimonial
                  </button>
                </div>
                
                <div className="save-bar">
                  <button
                    className="btn btn-primary btn-lg save-btn"
                    onClick={handleSaveTestimonials}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving Testimonials...
                      </>
                    ) : (
                      <>
                        <Save size={20} /> Save Testimonials
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'content' ? (
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
                  <div key={index} className="admin-form-group credential-editor-row">
                    <div className="credential-inputs">
                      <div className="credential-input-col size-sm">
                        <label className="credential-label">
                          {cred.icon === 'book' ? <BookOpen size={14} /> :
                           cred.icon === 'graduation' ? <GraduationCap size={14} /> :
                           cred.icon === 'briefcase' ? <Briefcase size={14} /> :
                           <Award size={14} />} Icon
                        </label>
                        <select
                          value={cred.icon || 'award'}
                          onChange={(e) => handleCredentialIconChange(index, e.target.value)}
                        >
                          <option value="award">Award</option>
                          <option value="book">Book/Research</option>
                          <option value="graduation">Graduation</option>
                          <option value="briefcase">Work/Experience</option>
                        </select>
                      </div>
                      <div className="credential-input-col">
                        <label>Label</label>
                        <input
                          type="text"
                          value={cred.label}
                          onChange={(e) => handleCredentialChange(index, e.target.value)}
                          placeholder="e.g. CSIR NET-JRF Qualified"
                          required
                        />
                      </div>
                    </div>
                    {formData.credentials.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon btn-danger remove-credential-btn"
                        onClick={() => removeCredential(index)}
                        aria-label="Remove credential"
                        title="Remove credential"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={addCredential}
                  style={{ marginTop: '1rem' }}
                >
                  + Add Credential
                </button>
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
