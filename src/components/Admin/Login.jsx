import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './Admin.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalMode, setPortalMode] = useState('cms'); // 'cms' | 'personal'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(`/admin/dashboard?workspace=${portalMode}`);
    } catch (err) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page login-page-layout">
      <div className="admin-bg-effects">
        <div className="admin-glow admin-glow-1"></div>
        <div className="admin-glow admin-glow-2"></div>
      </div>

      <header className="login-top-bar">
        <a href="/" className="admin-back-link">
          <ArrowLeft size={16} /> <span>Back to Site</span>
        </a>
      </header>

      <main className="login-container">
        <div className="login-card glass-panel">
          <div className="login-header">
            <div className="login-logo" aria-hidden="true">
              <Lock className="login-logo-icon" />
            </div>
            <h1>Admin Access</h1>
            <p>Select workspace &amp; sign in to manage your data</p>
          </div>

          {/* Workspace Target Selector */}
          <div className="login-workspace-selector" role="tablist" aria-label="Select Workspace">
            <button
              type="button"
              role="tab"
              aria-selected={portalMode === 'cms'}
              onClick={() => setPortalMode('cms')}
              className={`workspace-tab-btn ${portalMode === 'cms' ? 'active-cms' : ''}`}
            >
              <span className="workspace-tab-icon">🌐</span>
              <span className="workspace-tab-label">Website CMS</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={portalMode === 'personal'}
              onClick={() => setPortalMode('personal')}
              className={`workspace-tab-btn ${portalMode === 'personal' ? 'active-personal' : ''}`}
            >
              <span className="workspace-tab-icon">🏢</span>
              <span className="workspace-tab-label">Personal &amp; Govt</span>
            </button>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="admin-form-group">
              <label htmlFor="admin-email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexliftech.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="login-footer-text">
            Protected area. Unauthorized access is prohibited.
          </p>
        </div>
      </main>
    </div>
  );
}
