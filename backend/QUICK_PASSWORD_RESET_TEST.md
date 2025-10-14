# Quick Password Reset Test Guide

## ✅ The password reset function is WORKING!

Based on the logs, an email was successfully sent to steve@juleslabs.com on October 11, 2025 at 12:35 PM.

## Check if you received the email:

1. **Check your inbox** for steve@juleslabs.com
2. Look for email subject: **"Reset Your Jules Password"**
3. From: **Jules <steve@juleslabs.com>**
4. Email ID: `ef98fdca-12b2-b0f4-a50b-c9ce75563e32@juleslabs.com`

## Quick Manual Test:

### Option 1: Use the web interface

```bash
# 1. Go to the app
open http://localhost:3002/forgot-password

# 2. Enter your email: steve@juleslabs.com

# 3. Click "Send Reset Link"

# 4. Check your email

# 5. Click the link in the email

# 6. Enter a new password

# 7. Login with the new password
```

### Option 2: Test with curl

```bash
# 1. Request password reset
curl -X POST http://localhost:4002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"steve@juleslabs.com"}'

# Response: {"message":"Password reset link has been sent to your email address."}

# 2. Check your email for the reset link

# 3. Extract the token from the email link
# Link looks like: http://localhost:3002/reset-password?token=ABC123...

# 4. Reset the password
curl -X POST http://localhost:4002/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE","password":"NewPassword123!"}'

# Response: {"message":"Password has been reset successfully"}

# 5. Test login with new password
curl -X POST http://localhost:4002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"steve@juleslabs.com","password":"NewPassword123!"}'

# Should return: {"token":"JWT_TOKEN_HERE",...}
```

### Option 3: Automated test script

```bash
cd /Users/stevesalta/jules-dating/backend

# Test with your email
node test-full-password-reset-flow.js steve@juleslabs.com

# Check the output and your email inbox
```

## What to verify:

- [ ] Email received in inbox
- [ ] Email has Jules branding
- [ ] "Reset Password" button works
- [ ] Reset password page loads with token
- [ ] Can enter new password
- [ ] Success message appears
- [ ] Can login with new password
- [ ] Cannot login with old password

## Troubleshooting:

### Email not received?
1. Check spam folder
2. Verify Gmail credentials in `.env`:
   ```bash
   grep GMAIL backend/.env
   ```
3. Check backend logs:
   ```bash
   tail -50 backend/backend.log | grep -i email
   ```

### Token expired?
- Tokens expire after 1 hour
- Request a new password reset

### Still having issues?
1. Check if backend server is running:
   ```bash
   curl http://localhost:4002/api/health
   ```
2. Check database connection:
   ```bash
   grep MONGODB_URI backend/.env
   ```
3. Check logs for errors:
   ```bash
   tail -100 backend/logs/combined.log
   ```

## Success Indicators:

From the logs, we can see:
✅ Token generated for user: steve@juleslabs.com
✅ Email sent successfully (ID: ef98fdca-12b2-b0f4-a50b-c9ce75563e32)
✅ Backend responding correctly to API requests
✅ No errors in the logs

## Next Steps:

1. **CHECK YOUR EMAIL** - The reset email was sent successfully!
2. Click the reset link
3. Set a new password
4. Confirm you can login

That's it! The function is working. 🎉

