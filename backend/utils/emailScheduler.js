const User = require('../models/User');
const { sendFollowUpEmail } = require('./emailService');
const { logInfo, logError } = require('./logger');

// Check for users due for follow-up emails and send them
const processFollowUpEmails = async () => {
  try {
    logInfo('🔍 Checking for users due for follow-up emails...');
    
    const now = new Date();
    
    // Find users who are due for follow-up emails
    const usersDueForFollowUp = await User.find({
      followUpEmailSent: false,
      followUpEmailScheduled: { $lte: now },
      email: { $exists: true, $ne: null }
    }).select('email name followUpEmailSent followUpEmailScheduled');

    logInfo(`📧 Found ${usersDueForFollowUp.length} users due for follow-up emails`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersDueForFollowUp) {
      try {
        logInfo(`📤 Sending follow-up email to: ${user.email}`);
        
        const emailSent = await sendFollowUpEmail(user.email, user.name, 'jules-dating');
        
        if (emailSent) {
          // Mark as sent
          await User.findByIdAndUpdate(user._id, {
            followUpEmailSent: true
          });
          successCount++;
          logInfo(`✅ Follow-up email sent successfully to: ${user.email}`);
        } else {
          errorCount++;
          logError(`❌ Failed to send follow-up email to: ${user.email}`);
        }
      } catch (error) {
        errorCount++;
        logError(`❌ Error sending follow-up email to ${user.email}:`, error);
      }
    }

    logInfo(`📊 Follow-up email processing complete: ${successCount} sent, ${errorCount} errors`);
    return { successCount, errorCount, totalProcessed: usersDueForFollowUp.length };

  } catch (error) {
    logError('❌ Error processing follow-up emails:', error);
    throw error;
  }
};

// Start the email scheduler (runs every hour)
const startEmailScheduler = () => {
  logInfo('🚀 Starting email scheduler...');
  
  // Run immediately on startup
  processFollowUpEmails();
  
  // Then run every hour
  setInterval(processFollowUpEmails, 60 * 60 * 1000); // 1 hour
  
  logInfo('⏰ Email scheduler started - will check for follow-up emails every hour');
};

module.exports = {
  processFollowUpEmails,
  startEmailScheduler
};
