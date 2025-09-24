require('dotenv').config();
const { processFollowUpEmails } = require('./utils/emailScheduler');

async function testEmailScheduler() {
  try {
    console.log('🔄 Testing email scheduler...');
    
    const result = await processFollowUpEmails();
    
    console.log('📊 Scheduler test results:', result);
  } catch (error) {
    console.error('❌ Error testing email scheduler:', error.message);
  }
}

testEmailScheduler();
