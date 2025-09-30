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
      subject: 'Welcome to Jules Beta!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #333; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Jules</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to Jules Beta!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hey ${name || 'there'},
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thanks for being part of Jules beta. This is an early build, and your feedback is a big part of how we make it better.
            </p>
            
            <h3 style="color: #333; margin-bottom: 15px;">What you'll get:</h3>
            <ul style="color: #666; line-height: 1.6; margin-bottom: 25px; padding-left: 20px;">
              <li>Honest feedback on your pics, fits, and texts</li>
              <li>A chance to see how Jules can help you stand out in dating</li>
              <li>Occasional updates from me as we improve the experience</li>
            </ul>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              I'll send you a follow-up email soon with a quick way to share your thoughts. In the meantime, dive in and see what Jules can do.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Appreciate you being here,
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

// Send follow-up feedback email (4 days after signup)
const sendFollowUpEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logError('Email transporter not available');
      return false;
    }

    const mailOptions = {
      from: `"Jules" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Help me make Jules better (takes 2 mins)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #333; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Jules</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Dating Beta</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Hey ${name || 'there'},
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You've had a little time with the Jules Dating beta. Now I'd love your feedback—it'll directly shape what we build next.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Here's the short form (2 minutes tops):
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://docs.google.com/forms/d/1ZCeLJgyvD40i42igJMOUxpO9BMX3NYrR_VNn4We_07c/edit" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;">
                👉 Give Feedback Here
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We're keeping this early, scrappy, and honest. Your input means a lot - good, bad, great, or brutal.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
              Thanks for helping us build something that actually makes life a little bit better.
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
    logInfo(`Follow-up email sent to ${email}: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logError(`Failed to send follow-up email to ${email}:`, error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFollowUpEmail
};
