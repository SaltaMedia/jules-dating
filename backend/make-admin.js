require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');
    
    // Find user by email
    const user = await User.findOne({ email: 'spsalta@gmail.com' });
    
    if (user) {
      console.log('Found user:', user.email);
      console.log('Current admin status:', user.isAdmin);
      
      if (!user.isAdmin) {
        user.isAdmin = true;
        await user.save();
        console.log('✅ User is now admin!');
      } else {
        console.log('✅ User is already admin');
      }
    } else {
      console.log('❌ User not found. Available users:');
      const allUsers = await User.find({}).select('email isAdmin');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (admin: ${u.isAdmin})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

makeAdmin();
