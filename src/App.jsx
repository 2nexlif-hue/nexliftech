import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';

// Public components (eagerly loaded for the landing page)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import CustomCursor from './components/CustomCursor';
import ThemeSwitcher from './components/ThemeSwitcher';

const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));

function AdminFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--border-light)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p>Loading...</p>
    </div>
  );
}

function LandingPage() {
  const notificationsHook = useNotifications();

  return (
    <>
      <CustomCursor />
      <header className="site-header">
        <Navbar notificationsHook={notificationsHook} />
      </header>

      <main>
        <Hero />
        <Services />
        <About />
        <Portfolio />
        <Pricing />
        <Testimonials />
        <Contact />
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
 
function RouteAwareThemeSwitcher() {
  const { pathname } = useLocation();
  return pathname === '/botany-test-series' ? null : <ThemeSwitcher />;
}

function App() {
  return (
    <Router>
      <RouteAwareThemeSwitcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/*" element={
          <Suspense fallback={<AdminFallback />}>
            <AuthenticatedApp />
          </Suspense>
        } />
      </Routes>
    </Router>
  );
}

export default App;
