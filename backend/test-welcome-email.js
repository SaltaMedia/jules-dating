require('dotenv').config();
const { sendWelcomeEmail } = require('./utils/emailService');

async function testWelcomeEmail() {
  try {
    console.log('📧 Testing welcome email to steve@juleslabs.com...');
    
    const emailSent = await sendWelcomeEmail('steve@juleslabs.com', 'Steve');
    
    if (emailSent) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('❌ Failed to send welcome email');
    }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
  }
}

testWelcomeEmail();
