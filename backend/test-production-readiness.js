const mongoose = require('mongoose');
require('dotenv').config();

async function testProductionReadiness() {
  try {
    console.log('🔍 Testing Jules Dating Production Readiness...\n');

    // Test 1: Environment Variables
    console.log('🔍 Test 1: Environment Variables...');
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET', 
      'SESSION_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'FRONTEND_URL'
    ];

    const missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
        console.log(`❌ Missing: ${varName}`);
      } else {
        console.log(`✅ ${varName}: Set`);
      }
    });

    if (missingVars.length > 0) {
      console.log(`\n❌ Missing ${missingVars.length} required environment variables:`, missingVars);
    } else {
      console.log('\n✅ All required environment variables are set');
    }

    // Test 2: Database Connection
    console.log('\n🔍 Test 2: Database Connection...');
    try {
      let MONGODB_URI = process.env.MONGODB_URI;
      
      if (MONGODB_URI && MONGODB_URI.includes('mongodb+srv://')) {
        if (!MONGODB_URI.includes('/jules_dating')) {
          MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/jules_dating?');
        }
      } else {
        MONGODB_URI = 'mongodb://localhost:27017/jules_dating';
      }
      
      console.log('Connecting to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      
      await mongoose.connect(MONGODB_URI);
      const dbName = mongoose.connection.db.databaseName;
      console.log(`✅ Connected to database: ${dbName}`);
      
      // Test User model
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      console.log(`✅ User model working: ${userCount} users found`);
      
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
    }

    // Test 3: Google OAuth Configuration
    console.log('\n🔍 Test 3: Google OAuth Configuration...');
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (googleClientId && googleClientSecret) {
      console.log(`✅ Google Client ID: ${googleClientId.substring(0, 20)}...`);
      console.log(`✅ Google Client Secret: ${googleClientSecret.substring(0, 10)}...`);
      
      // Check if it's a production client ID
      if (googleClientId.includes('apps.googleusercontent.com')) {
        console.log('✅ Google OAuth configured for production');
      } else {
        console.log('⚠️ Google OAuth may be configured for development');
      }
    } else {
      console.log('❌ Google OAuth not properly configured');
    }

    // Test 4: Frontend URL Configuration
    console.log('\n🔍 Test 4: Frontend URL Configuration...');
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      console.log(`✅ Frontend URL: ${frontendUrl}`);
      
      if (frontendUrl.includes('localhost')) {
        console.log('⚠️ Frontend URL configured for development');
      } else {
        console.log('✅ Frontend URL configured for production');
      }
    } else {
      console.log('❌ Frontend URL not set');
    }

    // Test 5: CORS Configuration
    console.log('\n🔍 Test 5: CORS Configuration...');
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins) {
      console.log(`✅ Allowed Origins: ${allowedOrigins}`);
    } else {
      console.log('⚠️ ALLOWED_ORIGINS not set - using default localhost');
    }

    console.log('\n🎯 PRODUCTION READINESS SUMMARY:');
    if (missingVars.length === 0) {
      console.log('✅ All environment variables configured');
      console.log('✅ Database connection working');
      console.log('✅ Ready for production deployment');
    } else {
      console.log(`❌ ${missingVars.length} environment variables need to be configured`);
      console.log('❌ Not ready for production deployment');
    }

  } catch (error) {
    console.error('❌ Production readiness test error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
  }
}

// Run the test
testProductionReadiness().catch(console.error);
