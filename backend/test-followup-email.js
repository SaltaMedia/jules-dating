require('dotenv').config();
const { sendFollowUpEmail } = require('./utils/emailService');

async function testFollowUpEmail() {
  try {
    console.log('📧 Testing follow-up email to steve@saltamediaco.com...');
    
    const emailSent = await sendFollowUpEmail('steve@saltamediaco.com', 'Steve');
    
    if (emailSent) {
      console.log('✅ Follow-up email sent successfully!');
    } else {
      console.log('❌ Failed to send follow-up email');
    }
  } catch (error) {
    console.error('❌ Error sending follow-up email:', error.message);
  }
}

testFollowUpEmail();
