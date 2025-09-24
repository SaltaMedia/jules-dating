const mongoose = require('mongoose');
const UserProfile = require('./models/UserProfile');
const User = require('./models/User');
require('dotenv').config();

async function debugRealUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test with Steve's user ID specifically
    const steveUserId = '68646323e334460d16b24bd3';
    console.log(`\n🧪 Testing Context Building for Steve: ${steveUserId}`);
    
    // Import and test the actual function
    const { getSystemPrompt } = require('./controllers/chatController');
    const context = await getSystemPrompt(steveUserId);
    
    console.log('\n📝 Generated Context:');
    console.log(context);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugRealUser();
