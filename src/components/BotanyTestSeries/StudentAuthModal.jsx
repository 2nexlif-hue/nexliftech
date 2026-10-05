import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import './BotanySeries.css';

const ADMIN_RESERVED_EMAILS = [
  '2nexlif@gmail.com',
  'e.educational.24@gmail.com',
  'admin@nexliftech.com',
  'sheikhgulfam91@gmail.com'
];

export default function StudentAuthModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, signInWithGoogle, resetPassword } = useAuth();

  if (!isOpen) return null;

  async function handleGoogleLogin() {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      onSuccess?.(cred.user);
      onClose();
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in was not completed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const emailTrimmed = email.trim().toLowerCase();

    try {
      if (mode === 'signin') {
        const cred = await login(email.trim(), password);
        onSuccess?.(cred.user);
        onClose();
      } else if (mode === 'signup') {
        if (ADMIN_RESERVED_EMAILS.includes(emailTrimmed)) {
          setError('This email address is reserved for administrative portals. Please sign in via the Admin Portal instead of creating a student account.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password should be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please verify your confirm password.');
          setLoading(false);
          return;
        }
        const cred = await signup(email.trim(), password, displayName.trim());
        onSuccess?.(cred.user);
        onClose();
      } else if (mode === 'reset') {
        if (!email.trim()) {
          setError('Please provide your registered email address.');
          setLoading(false);
          return;
        }
        await resetPassword(email.trim());
        setMessage('Password reset instructions sent! Please check your email inbox (and spam/promotions folder) and follow the link to reset your password.');
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists. Please Sign In.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
          setError('Invalid email or password.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use at least 6 characters.');
          break;
        default:
          setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="botany-modal-overlay">
      <div className="botany-modal-card">
        <button type="button" className="botany-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="botany-modal-header">
          <div className="botany-modal-logo">🌿</div>
          <h3>
            {mode === 'signin' && 'Sign In to Your Account'}
            {mode === 'signup' && 'Create Your Student Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h3>
          <p>
            {mode === 'signin' && 'Access the Botany Assistant Professor test series & CBT simulations.'}
            {mode === 'signup' && 'Account will be linked to your test series progress, scores, and receipts.'}
            {mode === 'reset' && 'Enter your email to receive password recovery instructions.'}
          </p>
        </div>

        {/* 1-Tap Google Sign-In */}
        {mode !== 'reset' && (
          <>
            <button 
              type="button" 
              className="botany-google-btn"
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

            <div className="botany-modal-divider">
              <span>OR USE EMAIL</span>
            </div>
          </>
        )}

        {error && (
          <div className="botany-modal-alert error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="botany-modal-alert success">
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="botany-modal-form">
          {mode === 'signup' && (
            <div className="botany-form-group">
              <label className="botany-form-label">Full Name</label>
              <div className="botany-input-wrapper">
                <User size={16} className="botany-input-icon" />
                <input 
                  type="text" 
                  className="botany-auth-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. / Scholar Name"
                  required
                />
              </div>
            </div>
          )}

          <div className="botany-form-group">
            <label className="botany-form-label">Email Address</label>
            <div className="botany-input-wrapper">
              <Mail size={16} className="botany-input-icon" />
              <input 
                type="email" 
                className="botany-auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <>
              <div className="botany-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="botany-form-label" style={{ margin: 0 }}>Password</label>
                  {mode === 'signin' && (
                    <button 
                      type="button" 
                      className="botany-link-btn"
                      onClick={() => switchMode('reset')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="botany-input-wrapper">
                  <Lock size={16} className="botany-input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="botany-auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="botany-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="botany-form-group">
                  <label className="botany-form-label">Confirm Password</label>
                  <div className="botany-input-wrapper">
                    <Lock size={16} className="botany-input-icon" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      className="botany-auth-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                    />
                    <button
                      type="button"
                      className="botany-input-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.65rem' }} disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account & Continue'}
                  {mode === 'reset' && 'Send Reset Email'}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="botany-modal-footer">
          {mode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button type="button" className="botany-link-btn bold" onClick={() => switchMode('signup')}>
                Sign Up
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button type="button" className="botany-link-btn bold" onClick={() => switchMode('signin')}>
                Sign In
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              Remembered your password?{' '}
              <button type="button" className="botany-link-btn bold" onClick={() => switchMode('signin')}>
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
