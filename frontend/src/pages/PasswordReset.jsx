import React, { useState } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const PasswordReset = () => {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.requestResetOTP({ email });
      toast.success(response.data.message);
      if (response.data.ethereal) {
        setPreviewUrl(response.data.previewUrl);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyResetOTP({ email, otp });
      toast.success(response.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({ email, otp, new_password: newPassword });
      toast.success(response.data.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPreviewUrl('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius2)', padding: '40px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--text)', fontWeight: '700' }}>Reset Your Password</h1>
            <p style={{ margin: '0', fontSize: '13px', color: 'var(--text3)' }}>Secure password recovery with OTP verification</p>
          </div>

          {/* Step Indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ 
                flex: 1, 
                height: '3px', 
                borderRadius: '2px', 
                background: s <= step ? 'var(--accent)' : 'var(--bg4)',
                transition: 'background 0.3s ease'
              }} />
            ))}
          </div>

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {previewUrl && (
                <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--blue)', marginTop: '-8px' }}>
                  <strong>Test Mode:</strong> <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Click here to view the OTP email</a>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}>
                {loading ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Send OTP to Email'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
                <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', cursor: 'pointer' }}>Back to Login</a>
              </div>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label">One-Time Password (OTP)</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter the 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  disabled={loading}
                  maxLength="6"
                  style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                  required
                />
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
                  Check your email for the 6-digit code. It expires in 10 minutes.
                </div>
              </div>

              {previewUrl && (
                <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--blue)' }}>
                  <strong>Test Mode:</strong> <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Click here to view the OTP email</a>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}>
                {loading ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Verify OTP'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
                <button type="button" onClick={handleBackClick} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }}>← Back to Email</button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>Minimum 6 characters</div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}>
                {loading ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Reset Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
                <button type="button" onClick={handleBackClick} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }}>← Back to OTP</button>
              </div>
            </form>
          )}
        </div>

        {/* Info Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Secure</h3>
            <p style={{ margin: '0', fontSize: '12px' }}>Your password is encrypted</p>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Fast</h3>
            <p style={{ margin: '0', fontSize: '12px' }}>10-minute OTP window</p>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>Easy</h3>
            <p style={{ margin: '0', fontSize: '12px' }}>Check your email</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
