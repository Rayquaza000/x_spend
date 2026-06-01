import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = Code + New Password
  const [form, setForm] = useState({ username: '', email: '', password: '', code: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!form.email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email: form.email });
      setSuccessMsg(data.message || 'Reset code printed to server console.');
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!form.code || !form.newPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/reset-password', {
        email: form.email,
        code: form.code,
        newPassword: form.newPassword
      });
      setSuccessMsg(data.message || 'Password reset successful!');
      setTimeout(() => {
        setIsForgot(false);
        setForgotStep(1);
        setSuccessMsg('');
        setForm(prev => ({ ...prev, password: '', code: '', newPassword: '' }));
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isForgot) {
      if (forgotStep === 1) {
        await handleForgotPassword();
      } else {
        await handleResetPassword();
      }
      return;
    }

    setError('');
    if (!form.email || !form.password || (isRegister && !form.username)) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.username, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-title">x_spend</div>
        <div className="login-subtitle">
          {isForgot ? (
            forgotStep === 1 ? 'Reset password recovery code' : 'Set your new account password'
          ) : isRegister ? (
            'Create your account'
          ) : (
            'Sign in to your account'
          )}
        </div>

        {error && <div className="error-msg">{error}</div>}
        {successMsg && <div className="success-msg">{successMsg}</div>}

        {isForgot ? (
          /* Forgot Password View */
          forgotStep === 1 ? (
            /* Forgot Step 1: Input Email */
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={set('email')}
                onKeyDown={handleKeyDown}
              />
            </div>
          ) : (
            /* Forgot Step 2: Input Code and New Password */
            <>
              <div className="form-group">
                <label className="form-label">Verification Code (from server console)</label>
                <input
                  className="form-input"
                  placeholder="e.g. 123456"
                  value={form.code}
                  onChange={set('code')}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </>
          )
        ) : (
          /* Login/Register normal views */
          <>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={set('username')}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={set('email')}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                onKeyDown={handleKeyDown}
              />
            </div>

            {!isRegister && (
              <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 12 }}>
                <button
                  onClick={() => { setIsForgot(true); setForgotStep(1); setError(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-mid)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </>
        )}

        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            isForgot ? (
              forgotStep === 1 ? 'Sending code…' : 'Resetting password…'
            ) : isRegister ? (
              'Creating account…'
            ) : (
              'Signing in…'
            )
          ) : (
            isForgot ? (
              forgotStep === 1 ? 'Send Reset Code' : 'Reset Password'
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )
          )}
        </button>

        <div className="login-toggle">
          {isForgot ? (
            <>
              Remembered your password?{' '}
              <button onClick={() => { setIsForgot(false); setForgotStep(1); setError(''); setSuccessMsg(''); }}>
                Sign In
              </button>
            </>
          ) : isRegister ? (
            <>
              Already have an account?{' '}
              <button onClick={() => { setIsRegister(false); setError(''); }}>Sign In</button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => { setIsRegister(true); setError(''); }}>Register</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
