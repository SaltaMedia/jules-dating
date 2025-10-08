require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FitCheck = require('./models/FitCheck');
const jwt = require('jsonwebtoken');

async function testFitCheckEndpoint() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== TESTING FIT CHECK ENDPOINT FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    
    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { expiresIn: '7d' }
    );
    
    // Simulate the exact query from the fit check controller
    console.log(`\n🔍 Testing fit check history query...`);
    
    const userId = user._id; // This is what req.user.id would be
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    console.log(`   Query parameters:`);
    console.log(`   - userId: ${userId} (type: ${typeof userId})`);
    console.log(`   - page: ${page}`);
    console.log(`   - limit: ${limit}`);
    console.log(`   - skip: ${skip}`);

    const fitChecks = await FitCheck.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FitCheck.countDocuments({ userId });

    console.log(`\n📊 Query results:`);
    console.log(`   - Found ${fitChecks.length} fit checks`);
    console.log(`   - Total count: ${total}`);
    
    if (fitChecks.length > 0) {
      console.log(`\n📸 Sample fit checks:`);
      fitChecks.forEach((fc, i) => {
        console.log(`   ${i+1}. ${fc.eventContext} - Created: ${fc.createdAt}`);
        console.log(`      User ID: ${fc.userId} (type: ${typeof fc.userId})`);
      });
    }
    
    // Test the exact response format
    const response = {
      fitChecks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    console.log(`\n📤 API Response format:`);
    console.log(`   - fitChecks: ${response.fitChecks.length} items`);
    console.log(`   - pagination: page ${response.pagination.page} of ${response.pagination.pages}`);
    console.log(`   - total: ${response.pagination.total}`);
    
    // Test with different userId formats
    console.log(`\n🔍 Testing with different userId formats...`);
    
    const fitChecksString = await FitCheck.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const fitChecksObjectId = await FitCheck.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`   - String format: ${fitChecksString.length} results`);
    console.log(`   - ObjectId format: ${fitChecksObjectId.length} results`);
    
    // Check if there's any issue with the data
    console.log(`\n🔍 Checking data integrity...`);
    
    if (fitChecks.length === 0) {
      console.log(`   ❌ No fit checks found - this is the problem!`);
      
      // Check if there are any fit checks at all
      const allFitChecks = await FitCheck.find({}).limit(5);
      console.log(`   - Total fit checks in database: ${allFitChecks.length}`);
      
      if (allFitChecks.length > 0) {
        console.log(`   - Sample fit check user ID: ${allFitChecks[0].userId}`);
        console.log(`   - Sample fit check user ID type: ${typeof allFitChecks[0].userId}`);
        console.log(`   - Query user ID: ${userId}`);
        console.log(`   - Query user ID type: ${typeof userId}`);
      }
    } else {
      console.log(`   ✅ Fit checks found - API should work correctly`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testFitCheckEndpoint();
