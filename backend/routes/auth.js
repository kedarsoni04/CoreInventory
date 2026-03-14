const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { findOne, insert, update, findAll, remove } = require('../db');
const { JWT_SECRET } = require('../middleware');

const router = express.Router();

// Check if real email credentials are configured (not placeholder values)
function isEmailConfigured() {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASSWORD || '';
  return (
    user.length > 0 &&
    pass.length > 0 &&
    !user.includes('your-email') &&
    !pass.includes('your-smtp') &&
    !pass.includes('your-app') &&
    !pass.includes('your-password')
  );
}

// Build the right transporter — Brevo SMTP, Gmail, or Ethereal fallback
async function getTransporter() {
  if (isEmailConfigured()) {
    let transportConfig;

    if (process.env.EMAIL_HOST) {
      // Custom SMTP (Brevo, Mailgun, etc.)
      transportConfig = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };
    } else {
      // Service shorthand (gmail, outlook, etc.)
      transportConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
      };
    }

    return {
      transport: nodemailer.createTransport(transportConfig),
      from: `"CoreInventory" <${process.env.EMAIL_USER}>`,
      ethereal: false
    };
  }

  // Auto-create a free Ethereal test account — no config needed
  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  console.log(`📬 Ethereal test inbox: ${testAccount.user}`);
  return { transport, from: testAccount.user, ethereal: true };
}

// Verify connection on startup
if (isEmailConfigured()) {
  nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  }).verify((err) => {
    if (err) console.warn('⚠️  Gmail connection failed:', err.message);
    else console.log('✅ Gmail configured and connected');
  });
} else {
  console.log('📬 No Gmail credentials — will use Ethereal test inbox (preview URL returned per request).');
}

// Helper function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email — returns { success, previewUrl? }
async function sendOtpEmail(to, otp) {
  const { transport, from, ethereal } = await getTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <div style="text-align:center; margin-bottom: 20px;">
        <span style="background:#f0b429; color:#111; font-weight:800; font-size:20px; padding:6px 16px; border-radius:6px;">CoreInventory</span>
      </div>
      <h2 style="color:#111; margin:0 0 8px;">Password Reset Code</h2>
      <p style="color:#555; margin:0 0 20px;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#fff8e7; border:2px solid #f0b429; padding:24px; border-radius:8px; text-align:center; margin:0 0 20px;">
        <div style="font-size:40px; font-weight:900; letter-spacing:14px; color:#111; font-family:monospace;">${otp}</div>
      </div>
      <p style="color:#999; font-size:12px;">If you didn't request this, ignore this email. Your password won't change.</p>
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
      <p style="font-size:11px; color:#bbb; text-align:center;">CoreInventory — Inventory Management System</p>
    </div>
  `;

  try {
    const info = await transport.sendMail({
      from: `"CoreInventory" <${from}>`,
      to,
      subject: 'Your Password Reset OTP — CoreInventory',
      html
    });

    if (ethereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📨 Ethereal preview URL: ${previewUrl}`);
      return { success: true, ethereal: true, previewUrl };
    }
    return { success: true, ethereal: false };
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    return { success: false, error: err.message };
  }
}


// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (findOne('users', { email })) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = insert('users', { name, email, password: hash, role: 'manager' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = findOne('users', { email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/request-reset-otp
// Request OTP for password reset
router.post('/request-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const user = findOne('users', { email });
    if (!user) return res.status(404).json({ error: 'Email not found' });
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    // Delete any existing OTP for this email
    const existingOtp = findOne('password_reset_otp', { email });
    if (existingOtp) {
      // Update existing OTP record
      update('password_reset_otp', existingOtp.id, { otp, expires_at: expiresAt, verified: 0 });
    } else {
      // Insert new OTP record
      insert('password_reset_otp', { email, otp, expires_at: expiresAt, verified: 0 });
    }
    

    // Send OTP via email (Ethereal or real Gmail)
    const result = await sendOtpEmail(email, otp);

    if (!result.success) {
      return res.status(500).json({ error: `Email failed to send: ${result.error}` });
    }

    if (result.ethereal) {
      // Ethereal: real email was sent, user can view via preview URL
      return res.json({
        message: 'OTP sent! Since email is not configured, open the preview link to see it.',
        previewUrl: result.previewUrl,
        ethereal: true
      });
    }

    // Real Gmail sent
    return res.json({ message: `OTP sent to ${email}. Check your inbox (and spam folder).` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/verify-reset-otp
// Verify OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    
    const otpRecord = findOne('password_reset_otp', { email, otp });
    if (!otpRecord) return res.status(401).json({ error: 'Invalid OTP' });
    
    // Check if OTP has expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      return res.status(401).json({ error: 'OTP has expired' });
    }
    
    // Mark OTP as verified
    update('password_reset_otp', otpRecord.id, { verified: 1 });
    
    res.json({ message: 'OTP verified', verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/reset-password
// Reset password with verified OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !new_password) return res.status(400).json({ error: 'Email and new password required' });
    
    const otpRecord = findOne('password_reset_otp', { email, otp });
    if (!otpRecord) return res.status(401).json({ error: 'Invalid OTP' });
    if (!otpRecord.verified) return res.status(401).json({ error: 'OTP not verified' });
    
    const user = findOne('users', { email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Hash new password
    const hash = await bcrypt.hash(new_password, 10);
    
    // Update user password
    update('users', user.id, { password: hash });
    
    // Delete OTP record after successful reset
    remove('password_reset_otp', otpRecord.id);
    
    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
