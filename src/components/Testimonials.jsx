import { Star, Quote } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Testimonials.css';

export default function Testimonials() {
  const animateRef = useScrollAnimation();

  const testimonials = [
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

  return (
    <section id="testimonials" className="testimonials">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Client <span className="text-gradient">Success Stories</span></h2>
          <p className="section-subtitle">
            Don't just take our word for it. Here's what our clients have to say about working with NexLifTech.
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
                {[...Array(testimonial.rating)].map((_, i) => (
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
