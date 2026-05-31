import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, redirect directly to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/dashboard');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isSignUp) {
        // Sign up logic (Supabase Auth sign up)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          // Check if DB triggers blocked the signup with 500 error
          if (signUpError.message.includes('Database error') || signUpError.message.includes('Access Denied')) {
            throw new Error('Access Denied: This email is not approved in the Wisdom Allowed Admins list.');
          }
          throw signUpError;
        }

        // Check if signup succeeded but was unauthorized (e.g. if we let Auth succeed but block profile creation)
        if (signUpData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', signUpData.user.id)
            .maybeSingle();

          if (!profile) {
            // Sign out immediately as they are not on the allowed list
            await supabase.auth.signOut();
            throw new Error('Access Denied: Your email is not in the allowed admin list.');
          }
        }

        setSuccess('Signup successful! Please check your email for verification, or try logging in.');
        setIsSignUp(false);
      } else {
        // Sign in logic
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) throw signInError;

        // Double check profile table to verify they have an admin role
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError || !profile || !['admin', 'superadmin'].includes(profile.role)) {
            // Unapproved email login attempt: sign them out immediately
            await supabase.auth.signOut();
            throw new Error('Access Denied: Your email is not in the allowed admin list.');
          }
        }

        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      // Simplify database errors for a clean UX
      const friendlyMsg = err.message?.includes('Database error saving new user')
        ? 'Access Denied: Your email is not approved in the Wisdom Allowed Admins list.'
        : err.message;
      setError(friendlyMsg || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page container flex-center premium-glow">
      <div className="login-box glass-card">
        
        {/* Header decoration */}
        <div className="login-header flex-center">
          <div className="lock-icon-frame flex-center">
            <KeyRound size={28} className="lock-icon" />
          </div>
          <h2 className="login-title">Wisdom Control Panel</h2>
          <p className="login-subtitle">
            {isSignUp
              ? 'Request administrator access to publish events.'
              : 'Log in to manage Wisdom classes, flyers, and dynamic forms.'}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="auth-alert error-alert flex-center">
            <AlertTriangle size={18} className="alert-icon" />
            <div className="alert-text">{error}</div>
          </div>
        )}

        {success && (
          <div className="auth-alert success-alert flex-center">
            <ShieldCheck size={18} className="alert-icon" />
            <div className="alert-text">{success}</div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Admin Email Address</label>
            <div className="input-with-icon">
              <Mail className="field-icon" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input with-icon-padding"
                placeholder="admin@wisdommanjeri.org"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <KeyRound className="field-icon" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input with-icon-padding"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-mobile-full submit-btn">
            {loading ? (
              <>
                <Loader2 size={18} className="spinner-icon animate-spin" /> Verifying...
              </>
            ) : isSignUp ? (
              'Request Access & Sign Up'
            ) : (
              'Log In Securely'
            )}
          </button>
        </form>

        {/* Form Toggle Switcher */}
        <div className="auth-switcher">
          <p>
            {isSignUp ? 'Already have an authorized admin account?' : 'Need a new admin account?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="btn-text auth-toggle-link"
              disabled={loading}
            >
              {isSignUp ? 'Log in here' : 'Register here'}
            </button>
          </p>
          {!isSignUp && (
            <p className="security-notice">
              🔒 <strong>Security Notice:</strong> Signups are locked to pre-authorized Wisdom emails only.
            </p>
          )}
        </div>
      </div>

      <style>{`
        .admin-login-page {
          min-height: calc(100vh - 160px);
          padding: 40px 0;
        }
        .login-box {
          max-width: 440px;
          width: 100%;
          padding: 40px 32px;
          background-color: var(--bg-card);
          border-color: var(--primary);
        }
        .login-box:hover {
          transform: none; /* Keep forms stable */
        }
        .login-header {
          flex-direction: column;
          gap: 12px;
          text-align: center;
          margin-bottom: 28px;
        }
        .lock-icon-frame {
          width: 60px;
          height: 60px;
          background-color: var(--primary-light);
          border-radius: var(--radius-full);
          color: var(--primary);
          filter: drop-shadow(0 4px 10px var(--primary-glow));
        }
        .login-title {
          font-size: 1.6rem;
          color: var(--text-main);
        }
        .login-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        
        /* Auth Alerts */
        .auth-alert {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
        }
        .error-alert {
          background-color: #fee2e2;
          border: 1px solid var(--error);
          color: var(--error);
        }
        .success-alert {
          background-color: #d1fae5;
          border: 1px solid var(--success);
          color: var(--success);
        }
        .alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .alert-text {
          line-height: 1.4;
        }

        /* Forms spacing */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .field-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }
        .with-icon-padding {
          padding-left: 48px;
        }
        .submit-btn {
          margin-top: 8px;
        }

        /* Switcher link */
        .auth-switcher {
          text-align: center;
          margin-top: 24px;
          font-size: 0.85rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-toggle-link {
          font-weight: 700;
          color: var(--primary);
          padding: 0 4px;
          font-size: 0.85rem;
          display: inline;
          cursor: pointer;
        }
        .auth-toggle-link:hover {
          text-decoration: underline;
        }
        .security-notice {
          font-size: 0.75rem;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
        }
        
        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 480px) {
          .login-box {
            padding: 28px 16px;
          }
        }
      `}</style>
    </div>
  );
};
