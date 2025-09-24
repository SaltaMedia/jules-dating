const nodemailer = require('nodemailer');
const { logInfo, logError } = require('./logger');

// Create transporter for Gmail SMTP
const createTransporter = () => {
  // Check if we have Gmail credentials
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    logError('Gmail credentials not configured. Email sending disabled.');
    logError('Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // steve@juleslabs.com
      pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logError('Email transporter not available - credentials not configured');
      return false;
    }

    const mailOptions = {
      from: `"Jules" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Jules Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Jules</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Personal Stylist</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You requested to reset your password for your Jules account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="color: #667eea; word-break: break-all; margin-bottom: 25px;">
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">
              © 2024 Jules Labs, LLC. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logInfo(`Password reset email sent to ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logError(`Failed to send password reset email to ${email}:`, error);
    
    // Log specific Gmail error details
    if (error.code === 'EAUTH') {
      logError('Gmail authentication failed. Please check your GMAIL_USER and GMAIL_APP_PASSWORD.');
      logError('Make sure you have enabled 2-factor authentication and generated an App Password.');
    }
    
    return false;
  }
};

// Send welcome email (for future use)
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logError('Email transporter not available');
      return false;
    }

    const mailOptions = {
      from: `"Jules" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to the Jules Beta 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #333; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Jules</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Wear Who You Are</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">You're in!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Fast answers. Upload a fit, describe what you're wearing, or ask for ideas. You'll get clear guidance in seconds.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Work in progress. This is a beta, so expect a few rough edges. That's the point...you get to shape how she evolves.
            </p>
            
            <h3 style="color: #333; margin-bottom: 15px;">How to start:</h3>
            <ul style="color: #666; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
              <li>Head to <a href="https://app.juleslabs.com" style="color: #667eea;">app.juleslabs.com</a></li>
              <li>Upload or describe an outfit</li>
              <li>Try out Fit Checks, Closet, and Chat</li>
            </ul>
            
            <h3 style="color: #333; margin-bottom: 15px;">Feedback matters.</h3>
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              We don't care about polite nods—we need real, blunt feedback. Did Jules help? Did she miss? Tell us so we can make her better. Feel free to email directly.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You'll also get occasional updates from us as the product improves and a survey asking for feedback.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #333; margin: 0; font-size: 14px;">
                Steve<br>
                Founder, Jules Labs
              </p>
            </div>
          </div>
          
          <div style="background: #333; padding: 20px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 14px;">
              © 2025 Jules Labs, LLC. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logInfo(`Welcome email sent to ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logError(`Failed to send welcome email to ${email}:`, error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
