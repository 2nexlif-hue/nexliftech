import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, Quote } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Testimonials.css';

const DEFAULT_TESTIMONIALS = [
  {
    name: "Principal",
    role: "Govt HSS Shangus",
    content: "The ERP portal transformed our admissions workflow. Bulk roll assignment alone eliminated weeks of manual data entry.",
    rating: 5
  },
  {
    name: "E-Commerce Client",
    role: "Retail Platform",
    content: "Blazing fast React web application with zero rendering latency. Mobile conversion rates doubled in month one.",
    rating: 5
  },
  {
    name: "Operations Manager",
    role: "Corporate Automation",
    content: "Python & Selenium pipelines automated our daily report generation entirely. Exceptionally clean and resilient implementation.",
    rating: 5
  }
];

export default function Testimonials() {
  const animateRef = useScrollAnimation();
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'testimonials_list');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().testimonials) {
        setTestimonials(DEFAULT_TESTIMONIALS);
      }
    }, (err) => {
      console.error('Firestore testimonials load error:', err);
    });
    return unsubscribe;
  }, []);

  return (
    <section id="testimonials" className="testimonials">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Client <span className="text-gradient">Feedback</span></h2>
          <p className="section-subtitle">
            Direct reviews from institutional and commercial partners.
          </p>
        </div>

        <div className="grid grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="testimonial-card glass-panel animate-on-scroll"
              ref={animateRef}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <Quote className="quote-icon" size={40} />
              
              <div className="rating">
                {[...Array(Math.min(Math.max(Math.floor(Number(testimonial.rating) || 0), 0), 5))].map((_, i) => (
                  <Star key={i} size={16} className="star-icon fill-current" />
                ))}
              </div>
              
              <p className="testimonial-content">"{testimonial.content}"</p>
              
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
