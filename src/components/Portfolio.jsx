import { ExternalLink, Code } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import './Portfolio.css';

export default function Portfolio() {
  const animateRef = useScrollAnimation();

  const projects = [
    {
      title: 'Govt HSS Shangus ERP',
      category: 'Education & Portals',
      description: 'A comprehensive Admission and Examination Portal for Government Higher Secondary School Shangus. Features include bulk roll number assignment, reporting utilities, and a centralized admin dashboard.',
      tech: ['React', 'Firebase', 'Tailwind', 'Node.js'],
      liveLink: 'https://hssshangus.netlify.app/',
      image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%231a1a2e%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2232%22%20fill%3D%22%238888a0%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EERP%20Dashboard%20Preview%3C%2Ftext%3E%3C%2Fsvg%3E'
    },
    {
      title: 'Visit Alpines',
      category: 'Travel & Tourism',
      description: 'A premium booking and travel itinerary web application for Alpine tours, showcasing gorgeous destinations, guided tours, and bookings.',
      tech: ['React', 'Vite', 'CSS', 'Framer Motion'],
      liveLink: 'https://visitalpines.com/',
      image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%2312121a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2232%22%20fill%3D%22%238888a0%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EVisit%20Alpines%3C%2Ftext%3E%3C%2Fsvg%3E'
    },
    {
      title: 'Green Valley Holidays',
      category: 'Travel & Tourism',
      description: 'A custom holiday booking portal with structured travel packages, detailed dynamic itineraries, and high-performance load times.',
      tech: ['React', 'Vite', 'CSS', 'SEO'],
      liveLink: 'https://greenvalleyholidays.fun/',
      image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%231a1a2e%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2232%22%20fill%3D%22%238888a0%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EGreen%20Valley%20Holidays%3C%2Ftext%3E%3C%2Fsvg%3E'
    },
    {
      title: 'Automated Reporting Suite',
      category: 'Workflow Automation',
      description: 'Custom Python and Google Apps Script solutions that automate MS Office workflows and generate daily PDF reports, saving clients 15+ hours a week.',
      tech: ['Python', 'Google Apps Script', 'VBA'],
      githubLink: '#',
      image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%2312121a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2232%22%20fill%3D%22%238888a0%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EWorkflow%20Automation%3C%2Ftext%3E%3C%2Fsvg%3E'
    }
  ];

  return (
    <section id="portfolio" className="portfolio">
      <div className="container">
        <div className="section-header animate-on-scroll" ref={animateRef}>
          <h2 className="section-title">Featured <span className="text-gradient">Projects</span></h2>
          <p className="section-subtitle">
            A selection of our recent work across education, business, and workflow automation.
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
                <img src={project.image} alt={project.title} className="project-image" loading="lazy" />
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
