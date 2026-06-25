import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useNotifications } from './hooks/useNotifications';

// Public components (eagerly loaded for the landing page)
import Navbar from './components/Navbar';
import NotificationBanner from './components/NotificationBanner';
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

// Admin components (lazy loaded — only fetched when admin routes are visited)
const Login = lazy(() => import('./components/Admin/Login'));
const Dashboard = lazy(() => import('./components/Admin/Dashboard'));
const ProtectedRoute = lazy(() => import('./components/Admin/ProtectedRoute'));

function AdminFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#8888a0',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(255,255,255,0.06)',
        borderTopColor: '#8b5cf6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p>Loading admin panel...</p>
    </div>
  );
}

function LandingPage() {
  const notificationsHook = useNotifications();
  const { activeBanner, dismissNotification } = notificationsHook;

  return (
    <>
      <CustomCursor />
      <NotificationBanner
        activeBanner={activeBanner}
        dismissNotification={dismissNotification}
      />

      <Navbar notificationsHook={notificationsHook} />

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AdminFallback />}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<AdminFallback />}>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Suspense>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
