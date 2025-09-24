# Email Setup Guide for Jules Style

## Current Issue
Gmail is rejecting authentication with error: `535-5.7.8 Username and Password not accepted`

## Setup Steps

### 1. Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

### 2. Generate App Password
1. In Google Account settings, go to "Security"
2. Find "2-Step Verification" and click "App passwords"
3. Select "Mail" as the app
4. Generate the password
5. Copy the 16-character password

### 3. Update Environment Variables
Add these to your `.env` file:

```bash
GMAIL_USER=steve@juleslabs.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 4. Test Email Configuration
Run the test script:
```bash
node test-email.js
```

## Alternative Email Services

If Gmail continues to have issues, consider:

### SendGrid
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Mailgun
```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
```

## Current Fallback
Until email is configured, the forgot password will:
1. Generate a reset token
2. Return the reset URL directly to the user
3. User can copy/paste the URL to reset their password

## Security Note
- Never commit email credentials to version control
- Use environment variables for all sensitive data
- App passwords are more secure than regular passwords
