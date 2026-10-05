import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './Admin.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function routeUserByRole(user) {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    const emailClean = (user.email || '').toLowerCase().trim();

    // 1. Dedicated test series admin account: e.educational.24@gmail.com
    if (emailClean === 'e.educational.24@gmail.com') {
      navigate('/admin/dashboard?workspace=botany', { replace: true });
      return;
    }

    // 2. Super admin accounts
    if (emailClean === 'sheikhgulfam91@gmail.com' || emailClean === 'admin@nexliftech.com') {
      navigate('/admin/dashboard?workspace=cms', { replace: true });
      return;
    }

    // 3. Inspect role from Firestore user record
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const role = snap.data().role;
        if (role === 'botany_admin') {
          navigate('/admin/dashboard?workspace=botany', { replace: true });
          return;
        }
        if (role === 'admin' || role === 'superadmin') {
          navigate('/admin/dashboard?workspace=cms', { replace: true });
          return;
        }
      }
    } catch (e) {
      console.warn('Could not query user role for redirect:', e);
    }

    // 4. Default: students or candidates
    navigate('/botany-test-series', { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailTrimmed = email.trim().toLowerCase();
    const isBotanyAdminEmail = (emailTrimmed === 'e.educational.24@gmail.com');

    try {
      let cred;
      try {
        cred = await login(emailTrimmed, password);
      } catch (authErr) {
        // If it's the designated Botany Admin account and it does not exist in Firebase Auth yet, auto-provision it
        if (isBotanyAdminEmail && (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential')) {
          try {
            cred = await signup(emailTrimmed, password, 'Dr. Aubid Ahmad');
          } catch (signupErr) {
            if (signupErr.code === 'auth/email-already-in-use') {
              throw authErr;
            }
            throw signupErr;
          }
        } else {
          throw authErr;
        }
      }

      await routeUserByRole(cred.user);
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
          setError(err.message || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      await routeUserByRole(cred.user);
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
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
            <h1>Portal Sign In</h1>
            <p>Enter your credentials to access your designated workspace</p>
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
                  placeholder="name@example.com"
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
                'Sign In with Email'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <p className="login-footer-text">
            Protected area. Unauthorized access is prohibited.
          </p>
        </div>
      </main>
    </div>
  );
}
