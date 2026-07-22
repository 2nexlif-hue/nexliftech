import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ExternalLink, Code } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Portfolio.css';

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

export default function Portfolio() {
  const animateRef = useScrollAnimation();
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'portfolio_projects');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists() && snap.data().projects) {
        const loadedProjects = snap.data().projects.map(p => {
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
        setProjects(loadedProjects);
      }
    }, (err) => {
      console.error('Firestore portfolio load error:', err);
    });
    return unsubscribe;
  }, []);

  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Featured <span className="text-gradient">Projects</span></h2>
          <p className="section-subtitle">
            A selection of our recent work across education, finance, travel, and workflow automation.
          </p>
        </div>

        <div className="grid grid-cols-2">
          {projects.map((project, index) => (
            <div 
              key={index} 
              className="project-card glass-panel animate-on-scroll" 
              ref={animateRef}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="project-image-container">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="project-image" 
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='800' height='450' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='450' fill='%2316162a'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%236b6b80' text-anchor='middle' dominant-baseline='middle'%3EPreview Coming Soon%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="project-overlay">
                  <div className="project-links">
                    {project.liveLink && (
                      <a href={project.liveLink} target="_blank" rel="noreferrer" className="project-link" aria-label="View Live">
                        <ExternalLink size={20} />
                      </a>
                    )}
                    {project.githubLink && (
                      <a href={project.githubLink} target="_blank" rel="noreferrer" className="project-link" aria-label="View Source">
                        <Code size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="project-content">
                <div className="project-meta">
                  <span className="project-category">{project.category}</span>
                </div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>
                
                <div className="project-tech">
                  {project.tech.map((tech, i) => (
                    <span key={i} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="portfolio-cta animate-on-scroll" ref={animateRef}>
          <p>Ready to see your project here?</p>
          <a href="#contact" className="btn btn-primary">Start a Conversation</a>
        </div>
      </div>
    </section>
  );
}
