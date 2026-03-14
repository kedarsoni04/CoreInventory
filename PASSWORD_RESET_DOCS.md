# Password Reset with OTP Feature

## Overview
This implementation provides a secure password reset mechanism using **One-Time Password (OTP)** verification sent via email. The process has three steps:

1. **Request OTP**: User enters their email
2. **Verify OTP**: User enters the OTP they received
3. **Reset Password**: User sets a new password

---

## Frontend Components

### 1. **PasswordReset Page** (`frontend/src/pages/PasswordReset.jsx`)
- A dedicated password reset page with a clean, modern UI
- Displays progress with a step indicator (Email → OTP → Password)
- Responsive design that works on mobile and desktop
- Provides helpful feedback and error messages
- Test mode support (shows Ethereal preview link)

**Route:** `/reset-password`

**Features:**
- Email validation
- 6-digit OTP input with automatic formatting
- Password confirmation
- Real-time error messages
- Loading states
- Back navigation between steps

### 2. **Updated LoginPage** (`frontend/src/pages/LoginPage.jsx`)
- "Forgot password?" link now redirects to `/reset-password`
- Alternative: The LoginPage also has a built-in reset tab (optional)

### 3. **Styling** (`frontend/src/styles/PasswordReset.css`)
- Modern gradient background
- Animated step indicator
- Form validation styling
- Responsive mobile layout
- Toast-like alerts for feedback

---

## Backend Routes

All backend implementation is already complete in `backend/routes/auth.js`:

### 1. **POST /api/auth/request-reset-otp**
**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "message": "OTP sent to user@example.com. Check your inbox (and spam folder).",
  "ethereal": false
}
```

**Response (Test Mode with Ethereal):**
```json
{
  "message": "OTP sent! Since email is not configured, open the preview link to see it.",
  "ethereal": true,
  "previewUrl": "https://ethereal.email/message/..."
}
```

**Actions:**
- Validates email exists in database
- Generates 6-digit random OTP
- Stores OTP with 10-minute expiration
- Sends email via Gmail, Brevo SMTP, or Ethereal test account

---

### 2. **POST /api/auth/verify-reset-otp**
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "message": "OTP verified",
  "verified": true
}
```

**Validations:**
- Checks OTP matches the one sent
- Verifies OTP hasn't expired (10-minute window)
- Marks OTP as verified in database

---

### 3. **POST /api/auth/reset-password**
**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
  "message": "Password reset successfully"
}
```

**Actions:**
- Verifies OTP is marked as verified
- Hashes new password with bcrypt
- Updates user password in database
- Deletes OTP record (one-time use)
- Automatically redirects to login page

---

## API Client (`frontend/src/utils/api.js`)

The API calls are already set up:

```javascript
export const authAPI = {
  requestResetOTP: (data) => api.post('/auth/request-reset-otp', data),
  verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
```

---

## Database Schema

The `password_reset_otp` table is already created with:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `email` | TEXT | User's email address |
| `otp` | TEXT | 6-digit OTP code |
| `expires_at` | TEXT | ISO timestamp (10 mins from creation) |
| `verified` | INTEGER | 0 = unverified, 1 = verified |
| `created_at` | TEXT | When OTP was created |
| `updated_at` | TEXT | Last update time |

---

## Email Configuration

### Option 1: Gmail (Production)
Set in `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Option 2: Brevo SMTP (Production)
Set in `.env`:
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-email@gmail.com
EMAIL_PASSWORD=your-brevo-api-key
```

### Option 3: Ethereal Test Account (Development)
- No configuration needed
- Automatically creates a test account
- Returns a preview link to view the email

---

## User Flow

### Step 1: Request OTP
```
User clicks "Forgot password?" on login page
↓
Navigates to /reset-password
↓
Enters email address
↓
Clicks "Send OTP to Email"
↓
Backend generates OTP and emails it
```

### Step 2: Verify OTP
```
User receives email with 6-digit OTP
↓
Enters OTP in the form (Step 2)
↓
Clicks "Verify OTP"
↓
Backend marks OTP as verified
```

### Step 3: Reset Password
```
User enters new password (twice)
↓
Clicks "Reset Password"
↓
Backend updates user password
↓
OTP is deleted (one-time use)
↓
Redirects to login page (2 second delay)
```

---

## Security Features

✅ **OTP Expiration**: 10 minutes validity period  
✅ **One-Time Use**: OTP deleted after successful password reset  
✅ **Password Hashing**: bcrypt with 10 salt rounds  
✅ **Email Verification**: Confirms user owns the email  
✅ **Rate Limiting**: Could be added (not yet implemented)  
✅ **HTTPS Ready**: Supports secure connections  

---

## Testing the Feature

### Development (Ethereal Test Mode)
1. Leave EMAIL settings empty in `.env`
2. Request password reset
3. Click the "Ethereal preview URL" in the response
4. View the OTP code in the test inbox
5. Enter OTP and reset password

### Production (Gmail)
1. Configure Gmail credentials in `.env`
2. User enters email
3. Receives OTP via Gmail
4. Completes reset process

### Manual Testing
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Start frontend
cd frontend && npm start

# Test at http://localhost:3000/reset-password
```

---

## Error Handling

The frontend handles these errors gracefully:

| Error | Status | Message |
|-------|--------|---------|
| Email not found | 404 | "Email not found" |
| Invalid OTP | 401 | "Invalid OTP" |
| OTP expired | 401 | "OTP has expired" |
| Passwords don't match | 400 | "Passwords do not match" |
| Email send failed | 500 | Error message from transporter |

---

## Files Modified/Created

### Created:
- `frontend/src/pages/PasswordReset.jsx` - Main password reset page
- `frontend/src/styles/PasswordReset.css` - Styling for password reset page

### Modified:
- `frontend/src/App.jsx` - Added password reset route
- `frontend/src/pages/LoginPage.jsx` - Updated forgot password link

### Already Implemented (Backend):
- `backend/routes/auth.js` - OTP endpoints
- `backend/db.js` - password_reset_otp table
- `backend/db.json` - Database file

### API Already Configured:
- `frontend/src/utils/api.js` - authAPI methods

---

## Next Steps (Optional Enhancements)

1. **Rate Limiting**: Add rate limiting to prevent OTP spam
2. **Email Templates**: Customize HTML email template
3. **SMS OTP**: Alternative to email OTP
4. **OTP Resend**: Allow users to request a new OTP
5. **Security Questions**: Add additional verification layer
6. **Audit Logging**: Log password reset attempts

---

## Troubleshooting

### OTP not arriving?
- Check spam/junk folder
- Verify email configuration in `.env`
- Check backend logs for email errors
- If using Ethereal (test), click the preview URL

### "Email not found" error?
- Ensure account exists with that email
- Check database for user record

### OTP expired?
- Request a new OTP (10-minute window)
- Try again within the time limit

### Password reset fails?
- Ensure OTP was verified first
- Check password meets requirements (min 6 chars)
- Verify both passwords match

---

## Code Examples

### Request OTP
```javascript
import { authAPI } from '../utils/api';

try {
  const response = await authAPI.requestResetOTP({
    email: 'user@example.com'
  });
  console.log(response.data.message);
} catch (error) {
  console.error(error.response.data.error);
}
```

### Verify OTP
```javascript
try {
  const response = await authAPI.verifyResetOTP({
    email: 'user@example.com',
    otp: '123456'
  });
  console.log(response.data.message);
} catch (error) {
  console.error(error.response.data.error);
}
```

### Reset Password
```javascript
try {
  const response = await authAPI.resetPassword({
    email: 'user@example.com',
    otp: '123456',
    new_password: 'newPassword123'
  });
  console.log(response.data.message);
  // Navigate to login
  window.location.href = '/login';
} catch (error) {
  console.error(error.response.data.error);
}
```

---

## Support

For issues or questions:
1. Check the browser console for errors
2. Check backend console logs
3. Verify `.env` configuration
4. Ensure database is initialized
5. Check network requests in DevTools

---
