# CoreInventory - Password Reset & Remote Access Setup

## Overview
This guide covers:
1. Password Reset Feature with OTP via Email
2. Database Schema for OTP Storage
3. Remote Access Configuration
4. Email Setup (Gmail, Outlook, etc.)

---

## 1. Password Reset Feature

### How It Works
Users can reset their forgotten password through a 3-step process:

1. **Step 1**: Enter email address
   - System generates a 6-digit OTP
   - OTP sent to email (or shown in demo mode)
   - Valid for 10 minutes

2. **Step 2**: Verify OTP
   - User enters the OTP code from their email
   - System validates and marks OTP as verified

3. **Step 3**: Set New Password
   - User enters new password (min 6 characters)
   - Password is hashed and stored
   - OTP record is cleared

### Frontend Flow
- **Component**: `src/pages/LoginPage.jsx`
- **API Methods**: `src/utils/api.js` → `authAPI`
  - `requestResetOTP()` - POST /api/auth/request-reset-otp
  - `verifyResetOTP()` - POST /api/auth/verify-reset-otp
  - `resetPassword()` - POST /api/auth/reset-password

### Backend Endpoints
- `POST /api/auth/request-reset-otp` - Generate and send OTP
- `POST /api/auth/verify-reset-otp` - Validate OTP
- `POST /api/auth/reset-password` - Update password with verified OTP

---

## 2. Database Schema

### New Table: `password_reset_otp`
```sql
CREATE TABLE password_reset_otp (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  email TEXT,
  otp TEXT,
  expires_at TEXT,
  verified INTEGER DEFAULT 0
);
```

**Fields**:
- `id`: Unique identifier
- `created_at`: Timestamp of OTP generation
- `email`: User's email address
- `otp`: 6-digit OTP code
- `expires_at`: Expiration timestamp (10 minutes)
- `verified`: 0 = not verified, 1 = verified

**Note**: Database is automatically updated on first run. No manual migration needed.

---

## 3. Email Configuration

### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication**:
   - Go to https://myaccount.google.com/
   - Security → 2-Step Verification

2. **Create App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy this password

3. **Update `.env` file**:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Option B: Gmail (Without 2-Factor)
If you can't use App Passwords:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-actual-gmail-password

# Also enable "Less secure app access" at:
# https://myaccount.google.com/lesssecureapps
```

⚠️ **Not recommended for production**

### Option C: Outlook/Hotmail
```
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Option D: Custom SMTP
```
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

### Demo Mode (No Email)
- Leave `EMAIL_USER` and `EMAIL_PASSWORD` empty or commented
- OTP will appear in API response and browser console
- Useful for testing without email setup

---

## 4. Remote Access Setup

### Enable Remote Access

**Step 1: Update Backend Configuration**

Edit `backend/.env`:
```
PORT=5000
HOST=0.0.0.0  # Allows connections from any IP
```

**Step 2: Update Frontend API URL**

Create `frontend/.env.local`:
```
REACT_APP_API_URL=http://your-server-ip:5000/api
```

Replace `your-server-ip` with:
- Local testing: `192.168.x.x` or `localhost`
- Remote server: Server's public IP or domain

**Step 3: Rebuild Frontend**
```bash
cd frontend
npm run build
# Output will be in frontend/build/
```

**Step 4: Serve Frontend**

Option A - Using Node.js:
```bash
npm install -g serve
serve -s frontend/build -l 3000
```

Option B - Using Docker or your web server (nginx, Apache)

### Firewall Configuration

**Windows Firewall**:
```powershell
# Allow port 5000 (backend)
netsh advfirewall firewall add rule name="CoreInventory API" dir=in action=allow protocol=tcp localport=5000

# Allow port 3000 (frontend, if needed)
netsh advfirewall firewall add rule name="CoreInventory Frontend" dir=in action=allow protocol=tcp localport=3000
```

**Linux (UFW)**:
```bash
sudo ufw allow 5000
sudo ufw allow 3000  # if needed
```

### Testing Remote Connection

1. **Get your IP address**:
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig
   ```

2. **Test from another computer**:
   ```
   Open browser: http://your-ip:3000
   ```

3. **Test API**:
   ```
   curl http://your-ip:5000/api/health
   ```

---

## 5. Installation & Running

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create or verify .env file with email config
# Edit .env with your email credentials

# Start server
npm start
```

The server will listen on `0.0.0.0:5000` and be accessible:
- Locally: `http://localhost:5000`
- Remotely: `http://your-ip:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# For development (local only)
npm start

# For production (remote access)
# 1. Create .env.local with remote API URL
# 2. Build: npm run build
# 3. Serve from build/ folder
```

---

## 6. API Documentation

### Create Reset OTP
**POST** `/api/auth/request-reset-otp`

```json
{
  "email": "user@example.com"
}
```

**Response (with email)**:
```json
{
  "message": "OTP sent to your email"
}
```

**Response (demo mode)**:
```json
{
  "message": "OTP sent to your email",
  "otp": "123456",
  "demoMode": true
}
```

---

### Verify Reset OTP
**POST** `/api/auth/verify-reset-otp`

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "message": "OTP verified",
  "verified": true
}
```

---

### Reset Password
**POST** `/api/auth/reset-password`

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePassword123"
}
```

**Response**:
```json
{
  "message": "Password reset successfully"
}
```

---

## 7. Troubleshooting

### Email Not Sending

1. **Check credentials**:
   - Verify EMAIL_USER and EMAIL_PASSWORD in `.env`
   - For Gmail, confirm using App Password (not regular password)

2. **Check logs**:
   - Look for "Email service configured" or warning message on server startup

3. **Test with demo mode**:
   - Leave EMAIL credentials empty
   - OTP will appear in response for testing

### Can't Access Remotely

1. **Firewall issue**:
   - Ensure port 5000 is open (Windows Firewall, UFW, etc.)
   - Check router port forwarding if accessing from outside network

2. **Wrong IP**:
   - Verify you're using correct IP address
   - Test with `ping` first

3. **Frontend API URL**:
   - Verify `REACT_APP_API_URL` in frontend `.env.local`
   - Check developer console for API errors

### OTP Expires Too Quickly

Edit `backend/routes/auth.js`, find:
```javascript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
```

Change `10` to desired minutes.

---

## 8. Security Recommendations

### For Production:

1. **Use HTTPS**:
   - Set up SSL certificate (Let's Encrypt, etc.)
   - Use nginx or Apache with SSL

2. **Change JWT_SECRET**:
   ```
   JWT_SECRET=your_very_secure_random_string_here
   ```

3. **Email Security**:
   - Never hardcode credentials
   - Use environment variables/secrets management
   - For Gmail: Use 2FA + App Passwords

4. **Rate Limiting**:
   - Implement request throttling to prevent OTP brute force
   - Add CAPTCHA for password reset form

5. **CORS Configuration**:
   - Update CORS in `backend/server.js` to allow only your domain

6. **Database Security**:
   - Regular backups of `backend/database.sqlite`
   - Consider migrating to PostgreSQL for large deployments

---

## Summary

✅ **Database**: `password_reset_otp` table created automatically  
✅ **Backend**: 3 new endpoints for password reset with OTP  
✅ **Frontend**: 3-step password reset UI in LoginPage  
✅ **Email**: Integration with nodemailer (demo mode available)  
✅ **Remote**: Server listens on 0.0.0.0, ready for remote access  

You can now use this system for:
- Secure password recovery
- Multi-step verification
- Email-based user confirmation
- Remote deployment

Enjoy using CoreInventory! 🚀
