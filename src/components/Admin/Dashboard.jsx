import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  ArrowLeft, Save, LogOut, Upload, Image, User, FileText,
  Award, BookOpen, GraduationCap, Briefcase, CheckCircle, AlertCircle, Eye,
  Mail, MailOpen, Trash2, Calendar, DollarSign, Globe, Inbox, Building2,
  ArrowUp, ArrowDown, Copy, Plus, Search, Star, ExternalLink, Sparkles
} from 'lucide-react';
import AdminAwcMonitoring from './AdminAwcMonitoring';
import AdminBotanyTestSeries from './AdminBotanyTestSeries';
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
    title: 'Botany Assistant Professor CBT Examination Suite',
    category: 'EdTech & Assessment Engines',
    clientTag: 'Curated by Dr. Aubid Ahmad (Asst. Professor) • Built & Deployed by NexLifTech',
    description: 'An advanced, high-stakes Computer-Based Testing (CBT) portal and examination suite engineered for Dr. Aubid Ahmad, Assistant Professor. Features 35 scheduled tests, ~2,700 high-yield questions across 10 PSC units, Excel bulk uploads with 3-version rollbacks, automated option analysis, and Razorpay student enrollment workflows.',
    tech: ['React', 'Firebase', 'Razorpay', 'Excel Engine', 'CBT Analytics'],
    liveLink: '/botany-test-series',
    image: '/botany-suite-preview.svg'
  },
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
    name: "Starter Build",
    tabName: "Starter",
    badge: "For Tutors & Academies",
    description: "High-converting single-page web app for modern brands, tutors & coaching academies.",
    price: "₹14,999",
    features: [
      "High-Converting Single-Page Web App (React / Vite)",
      "Course & Fee Structure Showcase with Gallery",
      "Instant WhatsApp & Email Admission Inquiry forms",
      "Sub-second load speed & Mobile-First luxury UI",
      "Google Search & Business Maps indexing setup",
      "Free SSL & Custom Domain connection assistance",
      "2 Iteration rounds + 30 days warranty support"
    ],
    isPopular: false
  },
  {
    name: "Pro Application",
    tabName: "Pro",
    badge: "For Schools & Businesses",
    description: "Dynamic multi-page portal with visual CMS for schools, institutes & growing businesses.",
    price: "₹34,999",
    features: [
      "Multi-Page Dynamic Website (Up to 7 custom pages)",
      "Online Student Admission & Inquiry Application Form",
      "Digital Notice Board & Circular Management CMS",
      "Faculty & Staff Directory with Events & Gallery",
      "Lead Management Pipeline with CSV / Excel export",
      "Advanced Google Analytics 4 & Social Share cards",
      "Bank-Grade Security, DDoS & Anti-Spam protection",
      "3 Revision rounds + 90 days dedicated support"
    ],
    isPopular: true
  },
  {
    name: "Enterprise ERP",
    tabName: "Enterprise",
    badge: "Institutional ERP",
    referenceLink: "https://hssshangus.netlify.app/",
    referenceName: "Live Reference: Govt HSS Shangus",
    description: "Full-stack institutional ERPs, RBAC databases, and complex automation systems.",
    price: "Custom",
    features: [
      "Tailored School / College ERP (As in Govt HSS Shangus)",
      "Online Admission & Student Registration Workflow",
      "Bulk Roll Number Assigner & Automated Subject Mapping",
      "1-Click Printable Student ID Cards & PDF Result Sheets",
      "Role-Based Access (Principal Admin, Exam Cell, Staff Portals)",
      "Online Fee Collection & Payment Gateway (UPI / Cards)",
      "100% Full Source Code & Database Ownership",
      "1-Year Priority SLA Support & Dedicated Maintenance"
    ],
    isPopular: false
  }
];

export default function Dashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const emailLower = currentUser?.email?.toLowerCase().trim() || '';
  const isBotanyAdminOnly = (
    emailLower === 'e.educational.24@gmail.com' || 
    userProfile?.role === 'botany_admin'
  );
  const isSuperAdmin = (
    emailLower === '2nexlif@gmail.com' ||
    emailLower === 'admin@nexliftech.com' ||
    emailLower === 'sheikhgulfam91@gmail.com' ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'superadmin'
  );

  const initialWorkspace = isBotanyAdminOnly
    ? 'botany'
    : searchParams.get('workspace') === 'personal'
    ? 'personal'
    : searchParams.get('workspace') === 'botany'
    ? 'botany'
    : 'cms';

  const [workspace, setWorkspace] = useState(initialWorkspace);

  const [formData, setFormData] = useState(DEFAULT_DATA);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState(null);

  const [activeTab, setActiveTab] = useState(
    isBotanyAdminOnly
      ? 'botanySuite'
      : initialWorkspace === 'personal'
      ? 'awcMonitoring'
      : initialWorkspace === 'botany'
      ? 'botanySuite'
      : 'hero'
  );

  // Enforce Botany Suite workspace for dedicated test series admin account
  useEffect(() => {
    if (isBotanyAdminOnly) {
      if (workspace !== 'botany') setWorkspace('botany');
      if (activeTab !== 'botanySuite') setActiveTab('botanySuite');
    }
  }, [isBotanyAdminOnly, workspace, activeTab]);

  // Non-admin students should not access admin dashboard
  useEffect(() => {
    if (userProfile && userProfile.role === 'student' && !isBotanyAdminOnly && !isSuperAdmin) {
      navigate('/botany-test-series', { replace: true });
    }
  }, [userProfile, isBotanyAdminOnly, isSuperAdmin, navigate]);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inboxFilter, setInboxFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [inboxSearch, setInboxSearch] = useState('');

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

  // --- REORDERING & ITEM ACTIONS ---
  function moveService(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= servicesList.length) return;
    setServicesList(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return updated;
    });
  }

  function duplicateService(index) {
    const item = servicesList[index];
    setServicesList(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, {
        ...item,
        title: `${item.title || 'Untitled'} (Copy)`
      });
      return updated;
    });
    showToast('success', 'Service duplicated successfully.');
  }

  function moveProject(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= projectsList.length) return;
    setProjectsList(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return updated;
    });
  }

  function duplicateProject(index) {
    const item = projectsList[index];
    setProjectsList(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, {
        ...item,
        title: `${item.title || 'Untitled'} (Copy)`,
        tech: [...(item.tech || [])]
      });
      return updated;
    });
    showToast('success', 'Project showcase duplicated.');
  }

  function movePricingPlan(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= pricingPlans.length) return;
    setPricingPlans(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return updated;
    });
  }

  function duplicatePricingPlan(index) {
    const item = pricingPlans[index];
    setPricingPlans(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, {
        ...item,
        name: `${item.name || 'Plan'} (Copy)`,
        features: [...(item.features || [])]
      });
      return updated;
    });
    showToast('success', 'Pricing plan duplicated.');
  }

  function togglePlanPopular(index) {
    setPricingPlans(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isPopular: !updated[index].isPopular };
      return updated;
    });
  }

  function moveTestimonial(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= testimonialsList.length) return;
    setTestimonialsList(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return updated;
    });
  }

  function duplicateTestimonial(index) {
    const item = testimonialsList[index];
    setTestimonialsList(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, {
        ...item,
        name: `${item.name || 'Client'} (Copy)`
      });
      return updated;
    });
    showToast('success', 'Testimonial duplicated.');
  }

  function renderHeroTitlePreview(rawTitle) {
    if (!rawTitle) return null;
    const parts = rawTitle.split(/(\[[^\]]+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={idx} className="gradient-text font-bold">
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

  async function handleMarkAllAsRead() {
    if (!db) return;
    const unreadMsgs = messages.filter(m => m.status === 'unread');
    if (unreadMsgs.length === 0) return;
    try {
      for (const m of unreadMsgs) {
        await updateDoc(doc(db, 'contactMessages', m.id), { status: 'read' });
      }
      showToast('success', `Marked ${unreadMsgs.length} messages as read`);
    } catch (err) {
      console.error('Error marking all read:', err);
      showToast('error', 'Failed to mark all as read');
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

  function deleteMessage(msgId) {
    setConfirmModal({
      title: 'Delete Contact Message?',
      message: 'Are you sure you want to delete this customer inquiry message? This action cannot be undone.',
      actionText: 'Delete Message',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'contactMessages', msgId));
          showToast('success', 'Message deleted successfully.');
        } catch (err) {
          console.error('Error deleting message:', err);
          showToast('error', 'Failed to delete message.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="/" className="admin-back-link">
            <ArrowLeft size={16} /> <span>Back to Site</span>
          </a>
          
          {isBotanyAdminOnly ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              <span>Botany Examination Suite • Faculty Portal</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              <span>Firestore Operational</span>
            </div>
          )}
        </div>

        <div className="topbar-right">
          <a 
            href={isBotanyAdminOnly ? "/botany-test-series" : "/"} 
            target="_blank" 
            rel="noreferrer" 
            className="btn btn-secondary btn-sm" 
            style={{ gap: '0.4rem', fontSize: '0.78rem' }}
          >
            <Eye size={14} /> {isBotanyAdminOnly ? 'Preview Test Series' : 'Preview Site'}
          </a>

          <div className="topbar-user-badge" style={isBotanyAdminOnly ? { borderColor: 'rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.08)' } : {}}>
            <div className="user-avatar-mini" style={isBotanyAdminOnly ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' } : {}}>
              {(userProfile?.displayName || currentUser?.email || 'A')[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span className="admin-email-text" style={isBotanyAdminOnly ? { color: '#10b981' } : {}}>
                {isBotanyAdminOnly ? 'Dr. Aubid Ahmad' : currentUser?.email}
              </span>
              {isBotanyAdminOnly && (
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{currentUser?.email}</span>
              )}
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.25)', background: 'rgba(244, 63, 94, 0.08)' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Workspace Mode Category Selector or Isolated Faculty Banner */}
        {isBotanyAdminOnly ? (
          <div className="isolated-faculty-workspace-banner">
            <div className="faculty-workspace-info">
              <div className="faculty-badge-icon">🌿</div>
              <div>
                <h2>Botany Assistant Professor Examination Suite</h2>
                <p>Dedicated Examination &amp; Question Bank Workspace • Curated by Dr. Aubid Ahmad</p>
              </div>
            </div>
            <div className="faculty-account-pill">
              <span>Faculty Admin</span>
            </div>
          </div>
        ) : (
          <div className="dashboard-workspace-bar">
            <button
              type="button"
              onClick={() => {
                setWorkspace('cms');
                setActiveTab('hero');
              }}
              className={`workspace-bar-btn ${workspace === 'cms' ? 'active-cms' : ''}`}
            >
              <Globe size={16} />
              <span>Website CMS Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWorkspace('botany');
                setActiveTab('botanySuite');
              }}
              className={`workspace-bar-btn ${workspace === 'botany' ? 'active-botany' : ''}`}
            >
              <GraduationCap size={16} />
              <span>Botany Assistant Professor Suite</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWorkspace('personal');
                setActiveTab('awcMonitoring');
              }}
              className={`workspace-bar-btn ${workspace === 'personal' ? 'active-personal' : ''}`}
            >
              <Building2 size={16} />
              <span>Personal & Govt Projects Account</span>
            </button>
          </div>
        )}

        {!isBotanyAdminOnly && (
          <div className="dashboard-header-wrapper">
          <div className="dashboard-header">
            <h1>
              {workspace === 'cms'
                ? 'Website Content Portal'
                : workspace === 'botany'
                ? 'Botany Assistant Professor Examination Suite'
                : 'Personal & Official Projects Suite'}
            </h1>
            <p className="dashboard-subtitle">
              {workspace === 'cms' 
                ? 'Manage site content, portfolio, pricing plans, and view incoming customer messages.'
                : workspace === 'botany'
                ? 'Curated by Dr. Aubid Ahmad, Asst. Professor. Manage 10-unit syllabus, 35-test calendar, Excel question banks, versioning, and subscriptions.'
                : 'Access & manage official government inspection checklists, personal apps, and Firestore records.'}
            </p>
          </div>
          
          {workspace === 'cms' && (
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'hero' ? 'active' : ''}`}
                onClick={() => setActiveTab('hero')}
              >
                <Globe size={16} /> <span>Hero</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <User size={16} /> <span>About</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <BookOpen size={16} /> <span>Services</span>
                {servicesList.length > 0 && (
                  <span className="tab-count-badge">{servicesList.length}</span>
                )}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                <Briefcase size={16} /> <span>Projects</span>
                {projectsList.length > 0 && (
                  <span className="tab-count-badge">{projectsList.length}</span>
                )}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                <DollarSign size={16} /> <span>Pricing</span>
                {pricingPlans.length > 0 && (
                  <span className="tab-count-badge">{pricingPlans.length}</span>
                )}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'testimonials' ? 'active' : ''}`}
                onClick={() => setActiveTab('testimonials')}
              >
                <Award size={16} /> <span>Testimonials</span>
                {testimonialsList.length > 0 && (
                  <span className="tab-count-badge">{testimonialsList.length}</span>
                )}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                <Mail size={16} /> <span>Messages Inbox</span>
                {unreadCount > 0 ? (
                  <span className="unread-badge">{unreadCount}</span>
                ) : messages.length > 0 ? (
                  <span className="tab-count-badge">{messages.length}</span>
                ) : null}
              </button>
            </div>
          )}

          {workspace === 'personal' && (
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'awcMonitoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('awcMonitoring')}
              >
                <Building2 size={16} /> <span>Anganwadi Monitoring (Poshan)</span>
              </button>
            </div>
          )}
        </div>
        )}

        {activeTab === 'hero' ? (
          <div className="pricing-editor-section">
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <Globe size={22} />
                </div>
                <div>
                  <h2>Manage Hero Section</h2>
                  <p className="section-editor-subtitle">Modify the landing page header title, subtitle, badges, and tech stack logos.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSaveHero}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save Hero Section'}</span>
                </button>
              </div>
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
                      {heroData.title && (
                        <div className="live-preview-box">
                          <div className="live-preview-label">
                            <Sparkles size={12} /> Live Title Preview
                          </div>
                          <div className="live-preview-title">
                            {renderHeroTitlePreview(heroData.title)}
                          </div>
                        </div>
                      )}
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
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2>Manage Services ({servicesList.length})</h2>
                  <p className="section-editor-subtitle">Modify the services, tech expertise, icons, and themes on your landing page.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm" 
                  onClick={addService}
                >
                  <Plus size={14} /> Add Service
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSaveServices}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save Services'}</span>
                </button>
              </div>
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
                    <div key={servIdx} className="dashboard-card glass-panel pricing-editor-card">
                      <div className="card-header-bar">
                        <h3 className="card-header-title">
                          <span>{service.icon || '💻'}</span>
                          <span>{service.title || `Service #${servIdx + 1}`}</span>
                        </h3>
                        <div className="card-action-toolbar">
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveService(servIdx, -1)}
                            disabled={servIdx === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveService(servIdx, 1)}
                            disabled={servIdx === servicesList.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => duplicateService(servIdx)}
                            title="Duplicate Service"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn btn-danger-hover"
                            onClick={() => removeService(servIdx)}
                            title="Remove Service"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
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
                        <div className="color-preview-row">
                          <div 
                            className="color-swatch-box" 
                            style={{ background: service.color || 'rgba(139, 92, 246, 0.15)' }} 
                            title="Color Preview Swatch"
                          />
                          <input
                            type="text"
                            value={service.color}
                            onChange={(e) => handleServiceFieldChange(servIdx, 'color', e.target.value)}
                            placeholder="e.g. rgba(139, 92, 246, 0.15)"
                            required
                          />
                        </div>
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
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <Briefcase size={22} />
                </div>
                <div>
                  <h2>Manage Featured Projects ({projectsList.length})</h2>
                  <p className="section-editor-subtitle">Add, remove, reorder, or edit showcase projects displayed on the homepage.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addProject}
                >
                  <Plus size={14} /> Add Project
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSaveProjects}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save Projects'}</span>
                </button>
              </div>
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
                    <div key={projIdx} className="dashboard-card glass-panel">
                      <div className="card-header-bar">
                        <h3 className="card-header-title">
                          <span>Project #{projIdx + 1}: {project.title || 'Untitled'}</span>
                          {project.category && (
                            <span className="tab-count-badge" style={{ marginLeft: '0.4rem' }}>
                              {project.category}
                            </span>
                          )}
                        </h3>
                        <div className="card-action-toolbar">
                          {project.liveLink && (
                            <a
                              href={project.liveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="toolbar-btn"
                              title="Open Live Preview in New Tab"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveProject(projIdx, -1)}
                            disabled={projIdx === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveProject(projIdx, 1)}
                            disabled={projIdx === projectsList.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => duplicateProject(projIdx)}
                            title="Duplicate Project"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn btn-danger-hover"
                            onClick={() => removeProject(projIdx)}
                            title="Remove Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="dashboard-grid">
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
                          <label>Image Preview Path / URL</label>
                          <input
                            type="text"
                            value={project.image}
                            onChange={(e) => handleProjectFieldChange(projIdx, 'image', e.target.value)}
                            placeholder="e.g. /erp-preview.png or /walletvibe-preview.svg"
                          />
                          {project.image && (
                            <div className="project-preview-thumb">
                              <img
                                src={project.image}
                                alt={project.title || 'Preview'}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
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
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <Award size={22} />
                </div>
                <div>
                  <h2>Manage Testimonials ({testimonialsList.length})</h2>
                  <p className="section-editor-subtitle">Modify or add client reviews, star ratings, and success stories.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm" 
                  onClick={addTestimonial}
                >
                  <Plus size={14} /> Add Testimonial
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSaveTestimonials}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save Testimonials'}</span>
                </button>
              </div>
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
                    <div key={testIdx} className="dashboard-card glass-panel pricing-editor-card">
                      <div className="card-header-bar">
                        <h3 className="card-header-title">
                          <span>Testimonial #{testIdx + 1}: {test.name || 'Client'}</span>
                        </h3>
                        <div className="card-action-toolbar">
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveTestimonial(testIdx, -1)}
                            disabled={testIdx === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => moveTestimonial(testIdx, 1)}
                            disabled={testIdx === testimonialsList.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => duplicateTestimonial(testIdx)}
                            title="Duplicate Testimonial"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn btn-danger-hover"
                            onClick={() => removeTestimonial(testIdx)}
                            title="Remove Testimonial"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="admin-form-group">
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
                        <label>Rating (1-5 Stars)</label>
                        <div className="star-rating-picker">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled = starVal <= (Number(test.rating) || 5);
                            return (
                              <button
                                key={starVal}
                                type="button"
                                className="star-pick-btn"
                                onClick={() => handleTestimonialFieldChange(testIdx, 'rating', starVal)}
                                title={`Set rating to ${starVal} Star${starVal > 1 ? 's' : ''}`}
                              >
                                <Star
                                  size={18}
                                  fill={isFilled ? '#eab308' : 'none'}
                                  color={isFilled ? '#eab308' : 'var(--text-secondary)'}
                                />
                              </button>
                            );
                          })}
                          <span className="star-rating-label">
                            {test.rating || 5} / 5 Stars
                          </span>
                        </div>
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
          <div className="pricing-editor-section">
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <User size={22} />
                </div>
                <div>
                  <h2>Manage About & Founder Profile</h2>
                  <p className="section-editor-subtitle">Update developer photo, biography, credentials, and achievements stats.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                </button>
              </div>
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
          </div>
        ) : activeTab === 'pricing' ? (
          <div className="pricing-editor-section">
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h2>Manage Pricing Plans ({pricingPlans.length})</h2>
                  <p className="section-editor-subtitle">Modify plan names, tiers, features, prices, and highlight popular badges.</p>
                </div>
              </div>
              <div className="section-editor-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm save-top-btn"
                  onClick={handleSavePricing}
                  disabled={saving}
                >
                  {saving ? <span className="btn-spinner"></span> : <Save size={15} />}
                  <span>{saving ? 'Saving...' : 'Save Pricing Plans'}</span>
                </button>
              </div>
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
                      <div className="card-header-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h3 className="card-header-title">{plan.name || `Plan #${planIdx + 1}`}</h3>
                          {plan.isPopular && <span className="popular-badge-pill">Popular</span>}
                        </div>
                        <div className="card-action-toolbar">
                          <button
                            type="button"
                            className={`toolbar-btn ${plan.isPopular ? 'active' : ''}`}
                            onClick={() => togglePlanPopular(planIdx)}
                            title={plan.isPopular ? 'Remove Popular Badge' : 'Mark as Popular'}
                            style={plan.isPopular ? { background: 'var(--gradient-accent)', color: '#fff', borderColor: 'transparent' } : {}}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => movePricingPlan(planIdx, -1)}
                            disabled={planIdx === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => movePricingPlan(planIdx, 1)}
                            disabled={planIdx === pricingPlans.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => duplicatePricingPlan(planIdx)}
                            title="Duplicate Plan"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
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
        ) : activeTab === 'messages' ? (
          <div className="inbox-container">
            <div className="section-editor-header">
              <div className="section-editor-title-group">
                <div className="section-icon-badge">
                  <Inbox size={22} />
                </div>
                <div>
                  <h2>Contact Messages Inbox</h2>
                  <p className="section-editor-subtitle">
                    {messages.length} total customer inquiry message{messages.length !== 1 ? 's' : ''}
                    {unreadCount > 0 ? ` (${unreadCount} unread)` : ' (all caught up)'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <div className="section-editor-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCircle size={14} /> Mark All as Read
                  </button>
                </div>
              )}
            </div>

            {/* Search & Filter Toolbar */}
            <div className="inbox-toolbar">
              <div className="inbox-search-box">
                <Search size={15} className="inbox-search-icon" />
                <input
                  type="text"
                  placeholder="Search sender name, email, phone, text..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                />
              </div>

              <div className="inbox-filter-group">
                <button
                  type="button"
                  className={`inbox-filter-btn ${inboxFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setInboxFilter('all')}
                >
                  All ({messages.length})
                </button>
                <button
                  type="button"
                  className={`inbox-filter-btn ${inboxFilter === 'unread' ? 'active' : ''}`}
                  onClick={() => setInboxFilter('unread')}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  className={`inbox-filter-btn ${inboxFilter === 'read' ? 'active' : ''}`}
                  onClick={() => setInboxFilter('read')}
                >
                  Read ({messages.length - unreadCount})
                </button>
              </div>
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
            ) : (() => {
              const displayMessages = messages.filter((msg) => {
                if (inboxFilter === 'unread' && msg.status !== 'unread') return false;
                if (inboxFilter === 'read' && msg.status === 'unread') return false;
                if (inboxSearch.trim()) {
                  const q = inboxSearch.toLowerCase();
                  const matchesName = (msg.name || '').toLowerCase().includes(q);
                  const matchesEmail = (msg.email || '').toLowerCase().includes(q);
                  const matchesMsg = (msg.message || '').toLowerCase().includes(q);
                  const matchesMobile = (msg.mobile || '').toLowerCase().includes(q);
                  const matchesLoc = `${msg.tehsil || ''} ${msg.district || ''}`.toLowerCase().includes(q);
                  return matchesName || matchesEmail || matchesMsg || matchesMobile || matchesLoc;
                }
                return true;
              });

              if (displayMessages.length === 0) {
                return (
                  <div className="inbox-empty glass-panel" style={{ padding: '3rem 2rem' }}>
                    <Search size={36} className="empty-icon" />
                    <h3>No Matching Messages</h3>
                    <p>No messages match your search filter "{inboxSearch || inboxFilter}".</p>
                  </div>
                );
              }

              return (
                <div className="messages-list">
                  {displayMessages.map((msg) => (
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
                          {msg.mobile && <span className="meta-item" style={{ color: 'var(--accent-secondary, #06b6d4)' }}>📱 {msg.mobile}</span>}
                          {(msg.tehsil || msg.district) && (
                            <span className="meta-item" style={{ color: 'var(--accent-primary, #8b5cf6)' }}>
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
                        <a 
                          href={`mailto:${msg.email}?subject=Re: Inquiry on NexLifTech (${formatProjectType(msg.projectType)})`}
                          className="btn btn-secondary btn-sm reply-btn"
                        >
                          <Mail size={14} /> Reply via Email
                        </a>
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
              );
            })()}
          </div>
        ) : activeTab === 'awcMonitoring' ? (
          <AdminAwcMonitoring />
        ) : workspace === 'botany' || activeTab === 'botanySuite' ? (
          <AdminBotanyTestSeries currentUser={currentUser} />
        ) : null}
      </div>

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
    </div>
  );
}
