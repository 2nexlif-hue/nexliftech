import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SecurityGuard from './components/SecurityGuard';

const Login = lazy(() => import('./components/Admin/Login'));
const Dashboard = lazy(() => import('./components/Admin/Dashboard'));
const ProtectedRoute = lazy(() => import('./components/Admin/ProtectedRoute'));
const BotanySeriesHome = lazy(() => import('./components/BotanyTestSeries/BotanySeriesHome'));

export default function AuthenticatedApp() {
  return (
    <AuthProvider>
      <SecurityGuard />
      <Suspense fallback={<div className="route-loading">Loading...</div>}>
        <Routes>
          <Route path="/botany-test-series" element={<BotanySeriesHome />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
