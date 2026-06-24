import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Contact.css';

export default function Contact() {
  const animateRef = useScrollAnimation();
  const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    // Using Netlify Forms, we submit the form data using fetch
    const form = e.target;
    const formData = new FormData(form);
    
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })
    .then(() => {
      setFormStatus('success');
      form.reset();
      setTimeout(() => setFormStatus('idle'), 5000);
    })
    .catch((error) => {
      console.error('Form submission error:', error);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    });
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Let's Build Something <span className="text-gradient">Amazing</span></h2>
          <p className="section-subtitle">
            Ready to start your next project? Reach out and we'll get back to you within 24 hours.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-info animate-on-scroll" ref={animateRef}>
            <div className="contact-card glass-panel">
              <h3>Get in Touch</h3>
              <p className="contact-desc">
                Whether you have a question, a project idea, or just want to say hello, we're always open to discussing new opportunities.
              </p>
              
              <div className="info-list">
                <div className="info-item">
                  <div className="info-icon">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:hello@nexliftech.com">hello@nexliftech.com</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4>Phone</h4>
                    <a href="tel:+919000000000">+91 (900) 000-0000</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-icon">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4>Location</h4>
                    <p>Jammu & Kashmir, India</p>
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
                <input type="text" id="name" name="name" required placeholder="John Doe" />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="john@example.com" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="project-type">Project Type</label>
                  <select id="project-type" name="project-type" required defaultValue="">
                    <option value="" disabled>Select an option</option>
                    <option value="landing-page">Landing Page</option>
                    <option value="business-site">Business Website</option>
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
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="4" required placeholder="Tell us about your project goals..."></textarea>
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
