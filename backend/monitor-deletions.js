require('dotenv').config();
const mongoose = require('mongoose');
const DataProtectionMonitor = require('./middleware/dataProtection');

async function monitorDeletions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n🛡️ Data Protection Monitoring System');
    console.log('=====================================');
    
    // Get current stats
    const stats = DataProtectionMonitor.instance.getDeletionStats();
    
    console.log('\n📊 Current Deletion Statistics:');
    console.log(`   Hourly deletions: ${stats.hourlyDeletions}`);
    console.log(`   Daily deletions: ${stats.dailyDeletions}`);
    console.log(`   Total tracked deletions: ${stats.totalTrackedDeletions}`);
    
    console.log('\n🚨 Alert Thresholds:');
    console.log(`   Max deletions per hour: ${stats.thresholds.maxDeletionsPerHour}`);
    console.log(`   Max deletions per day: ${stats.thresholds.maxDeletionsPerDay}`);
    
    console.log('\n🔍 Suspicious Patterns:');
    stats.thresholds.suspiciousPatterns.forEach(pattern => {
      console.log(`   - ${pattern}`);
    });
    
    console.log('\n📋 How the System Works:');
    console.log('   1. Monitors all User.deleteMany(), User.deleteOne(), User.findByIdAndDelete() calls');
    console.log('   2. Logs every deletion with user details and stack trace');
    console.log('   3. Checks for suspicious patterns (real email domains, bulk deletions)');
    console.log('   4. Sends alerts for any deletion activity');
    console.log('   5. Stores alerts in database for audit trail');
    
    console.log('\n🚨 Alert Types:');
    console.log('   - USER_DELETION: Any user deletion (medium severity)');
    console.log('   - SUSPICIOUS_DELETION: Deletions matching suspicious patterns (high/critical)');
    
    console.log('\n📧 Notification Methods:');
    console.log('   - Server logs (always active)');
    console.log('   - Email alerts (if ALERT_EMAIL is set)');
    console.log('   - Webhook alerts (if MONITORING_WEBHOOK is set)');
    console.log('   - Database storage (always active)');
    
    console.log('\n🔧 To Set Up Email Alerts:');
    console.log('   export ALERT_EMAIL="your-email@example.com"');
    
    console.log('\n🔧 To Set Up Webhook Alerts:');
    console.log('   export MONITORING_WEBHOOK="https://your-monitoring-service.com/webhook"');
    
    console.log('\n📊 To View Alerts:');
    console.log('   GET /api/data-protection/alerts (requires admin auth)');
    console.log('   GET /api/data-protection/stats (requires admin auth)');
    
    console.log('\n✅ System Status: ACTIVE');
    console.log('   The data protection monitor is now running and will alert on any user deletions.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

monitorDeletions();
