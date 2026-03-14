import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // login | signup | reset
  const [resetStep, setResetStep] = useState(1); // 1: email | 2: otp | 3: password
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">CI</div>
          <div className="auth-title">CoreInventory</div>
          <div className="auth-sub">
            {tab === 'login' && 'Sign in to your workspace'}
            {tab === 'signup' && 'Create a new account'}
            {tab === 'reset' && 'Reset your password'}
          </div>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4 }}>
              {loading ? <div className="spinner" /> : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              <a href="/reset-password" style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Forgot password?</a>
              {' · '}
              <button type="button" onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Create account</button>
            </div>
            <div className="divider" style={{ marginTop: 20 }}>demo credentials</div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)', lineHeight: 1.7 }}>
              Email: admin@coreinventory.com<br />Password: admin123
            </div>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="Kedar soni" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="min 6 chars" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <div className="spinner" /> : 'Create Account'}
            </button>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Sign in</button>
            </div>
          </form>
        )}

        {tab === 'reset' && (
          <>
            <div className="reset-steps" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ 
                  flex: 1, 
                  height: 4, 
                  borderRadius: 2, 
                  background: s <= resetStep ? 'var(--accent)' : 'var(--bg4)',
                  transition: 'background 0.3s ease'
                }} />
              ))}
            </div>

            {resetStep === 1 && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const { authAPI } = await import('../utils/api');
                  const { data } = await authAPI.requestResetOTP({ email: resetForm.email });

                  if (data.ethereal && data.previewUrl) {
                    // Ethereal: show a clickable link to view the email
                    toast.success('OTP email sent! Click below to view it.', { duration: 6000 });
                    setResetForm(f => ({ ...f, _previewUrl: data.previewUrl }));
                  } else if (data.demoMode) {
                    toast.success(`Dev Mode: OTP is ${data.otp}`, { duration: 8000 });
                  } else {
                    toast.success('OTP sent! Check your inbox.');
                  }
                  setResetStep(2);
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Account not found');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    placeholder="Reset link will be sent here" 
                    value={resetForm.email} 
                    onChange={(e) => setResetForm(f => ({ ...f, email: e.target.value }))} 
                    required 
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                  {loading ? <div className="spinner" /> : 'Get Reset Code'}
                </button>
                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                  <button type="button" onClick={() => { setTab('login'); setResetStep(1); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>← Back to login</button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const { authAPI } = await import('../utils/api');
                  await authAPI.verifyResetOTP({ email: resetForm.email, otp: resetForm.otp });
                  toast.success('Code verified successfully!');
                  setResetStep(3);
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Incorrect or expired code');
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label className="form-label">6-Digit Code</label>
                  <input 
                    className="form-control" 
                    type="text" 
                    placeholder="••••••" 
                    value={resetForm.otp} 
                    onChange={(e) => setResetForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))} 
                    required 
                    maxLength="6"
                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Check {resetForm.email}</span>
                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          const { authAPI } = await import('../utils/api');
                          const { data } = await authAPI.requestResetOTP({ email: resetForm.email });
                          if (data.ethereal && data.previewUrl) {
                            setResetForm(f => ({ ...f, _previewUrl: data.previewUrl }));
                            toast.success('New code sent! Check the email preview.');
                          } else if (data.demoMode) {
                            toast.success(`Dev Mode: ${data.otp}`);
                          } else {
                            toast.success('Code resent! Check your inbox.');
                          }
                        } catch (err) {
                          toast.error('Failed to resend code');
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
                    >
                      Resend?
                    </button>
                  </div>
                  {resetForm._previewUrl && (
                    <a 
                      href={resetForm._previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                    >
                      📧 View OTP Email → (opens in browser)
                    </a>
                  )}
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                  {loading ? <div className="spinner" /> : 'Verify Code'}
                </button>
                <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                  <button type="button" onClick={() => setResetStep(1)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>← Use different email</button>
                </div>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (resetForm.newPassword.length < 6) {
                  toast.error('Password must be at least 6 characters');
                  return;
                }
                setLoading(true);
                try {
                  const { authAPI } = await import('../utils/api');
                  await authAPI.resetPassword({ 
                    email: resetForm.email, 
                    otp: resetForm.otp,
                    new_password: resetForm.newPassword 
                  });
                  toast.success('Password updated! You can now sign in.');
                  setTab('login');
                  setResetStep(1);
                  setResetForm({ email: '', otp: '', newPassword: '' });
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Session expired. Start over.');
                  setResetStep(1);
                } finally {
                  setLoading(false);
                }
              }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="form-control" 
                      type={showNewPw ? 'text' : 'password'} 
                      placeholder="At least 6 characters" 
                      value={resetForm.newPassword} 
                      onChange={(e) => setResetForm(f => ({ ...f, newPassword: e.target.value }))} 
                      required 
                      minLength="6"
                      style={{ paddingRight: 40 }} 
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                  {loading ? <div className="spinner" /> : 'Save New Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
