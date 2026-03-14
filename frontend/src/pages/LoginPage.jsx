import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // login | signup | reset
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
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
              <button type="button" onClick={() => setTab('reset')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Forgot password?</button>
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
              <input className="form-control" placeholder="John Doe" value={form.name} onChange={set('name')} required />
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
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { authAPI } = await import('../utils/api');
              const { data } = await authAPI.resetPassword({ email: form.email });
              toast.success(`OTP sent! (Demo: ${data.otp})`);
              setTab('login');
            } catch (err) {
              toast.error(err.response?.data?.error || 'Error');
            }
          }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>Send OTP</button>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>← Back to login</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
