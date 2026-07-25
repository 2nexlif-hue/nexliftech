import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Contact.css';

export default function Contact() {
  const animateRef = useScrollAnimation();
  const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success, error
  const [messageText, setMessageText] = useState('');

  const sanitizeInput = (val) => {
    if (typeof val !== 'string') return '';
    // Strip HTML tags and trim whitespace
    return val.replace(/<[^>]*>/g, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');

    // Rate limit: 60 seconds between submissions
    const RATE_LIMIT_KEY = 'nexliftech_last_submit';
    const RATE_LIMIT_MS = 60 * 1000;
    const lastSubmit = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      setFormStatus('error');
      setMessageText('Please wait a minute before submitting again.');
      setTimeout(() => { setFormStatus('idle'); setMessageText(''); }, 5000);
      return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    
    const name = sanitizeInput(formData.get('name')).slice(0, 100);
    const email = sanitizeInput(formData.get('email')).slice(0, 150);
    const mobile = sanitizeInput(formData.get('mobile')).slice(0, 15);
    const district = sanitizeInput(formData.get('district')).slice(0, 100);
    const tehsil = sanitizeInput(formData.get('tehsil')).slice(0, 100);
    const projectType = sanitizeInput(formData.get('project-type'));
    const budget = sanitizeInput(formData.get('budget'));
    const message = sanitizeInput(formData.get('message')).slice(0, 2000);

    // Basic validation check
    if (!name || !email || !mobile || !district || !tehsil || !projectType || !budget || !message) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
      return;
    }
    
    try {
      // Save directly to Firestore under 'contactMessages'
      await addDoc(collection(db, 'contactMessages'), {
        name,
        email,
        mobile,
        district,
        tehsil,
        projectType,
        budget,
        message,
        createdAt: serverTimestamp(),
        status: 'unread'
      });

      // Submit to Netlify forms as secondary fallback for notifications
      try {
        const sanitizedFormData = new FormData();
        sanitizedFormData.append('form-name', 'contact');
        sanitizedFormData.append('name', name);
        sanitizedFormData.append('email', email);
        sanitizedFormData.append('mobile', mobile);
        sanitizedFormData.append('district', district);
        sanitizedFormData.append('tehsil', tehsil);
        sanitizedFormData.append('project-type', projectType);
        sanitizedFormData.append('budget', budget);
        sanitizedFormData.append('message', message);

        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(sanitizedFormData).toString()
        });
      } catch (netlifyError) {
        console.warn('Netlify backup submission failed:', netlifyError);
      }

      localStorage.setItem('nexliftech_last_submit', String(Date.now()));
      setFormStatus('success');
      form.reset();
      setMessageText('');
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Firebase save error:', error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Initiate <span className="text-gradient">Project</span></h2>
          <p className="section-subtitle">
            Send your project scope or technical specs below for a prompt response.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-info animate-on-scroll" ref={animateRef}>
            <div className="contact-card glass-panel">
              <h3>Technical Inquiry</h3>
              <p className="contact-desc">
                Send your project requirements or API/automation specs directly to our engineering lead.
              </p>
              
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:sheikhgulfam91@gmail.com">sheikhgulfam91@gmail.com</a><br />
                    <a href="mailto:2nexlif@gmail.com" style={{fontSize: '0.9em', marginTop: '4px', display: 'inline-block'}}>2nexlif@gmail.com</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4>Phone & WhatsApp</h4>
                    <a href="tel:+919682547458">+91 9682547458</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4>Location</h4>
                    <p>Tehsil & District: Anantnag<br />Jammu & Kashmir, India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-container animate-on-scroll" ref={animateRef}>
            <form 
              className="contact-form glass-card"
              onSubmit={handleSubmit}
              name="contact"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="contact" />
              <p className="hidden" style={{ display: 'none' }}>
                <label>Don’t fill this out if you're human: <input name="bot-field" /></label>
              </p>
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" required placeholder="John Doe" maxLength={100} />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required placeholder="john@example.com" maxLength={150} />
                </div>
                <div className="form-group">
                  <label htmlFor="mobile">Mobile No</label>
                  <input type="tel" id="mobile" name="mobile" required placeholder="+91 9XXXXXXXXX" pattern="[+0-9]{7,15}" maxLength={15} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="district">District</label>
                  <input type="text" id="district" name="district" required placeholder="e.g. Anantnag" maxLength={100} />
                </div>
                <div className="form-group">
                  <label htmlFor="tehsil">Tehsil</label>
                  <input type="text" id="tehsil" name="tehsil" required placeholder="e.g. Anantnag" maxLength={100} />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="project-type">Project Type</label>
                  <select id="project-type" name="project-type" required defaultValue="">
                    <option value="" disabled>Select an option</option>
                    <option value="landing-page">Landing Page</option>
                    <option value="business-site">Business Website</option>
                    <option value="school-website">School Website</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="web-app">Web Application</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="budget">Budget</label>
                  <select id="budget" name="budget" required defaultValue="">
                    <option value="" disabled>Select budget</option>
                    <option value="<20k">Less than ₹20,000</option>
                    <option value="20k-50k">₹20,000 - ₹50,000</option>
                    <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                    <option value=">100k">More than ₹1,00,000</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group textarea-group">
                <div className="textarea-header">
                  <label htmlFor="message">Message</label>
                  <span className="char-counter">{2000 - messageText.length} characters remaining</span>
                </div>
                <textarea 
                  id="message" 
                  name="message" 
                  rows="4" 
                  required 
                  placeholder="Tell us about your project goals..."
                  maxLength={2000}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary submit-btn"
                disabled={formStatus === 'submitting'}
              >
                {formStatus === 'submitting' ? (
                  <><Loader2 size={18} className="spinner" /> Sending...</>
                ) : formStatus === 'success' ? (
                  <>Sent Successfully! <Send size={18} /></>
                ) : formStatus === 'error' ? (
                  <>Error Sending. Try Again.</>
                ) : (
                  <>Send Message <Send size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
