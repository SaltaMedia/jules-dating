#!/usr/bin/env node

// Quick script to check production environment variables
console.log('🔍 Checking production environment variables...\n');

const requiredVars = [
  'OPENAI_API_KEY',
  'CLOUDINARY_URL', 
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'FRONTEND_URL',
  'ALLOWED_ORIGINS'
];

console.log('📋 REQUIRED VARIABLES:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (varName.includes('KEY') || varName.includes('SECRET') ? '***' : value) : 'NOT SET';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📋 OPTIONAL VARIABLES:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const displayValue = value ? (varName.includes('KEY') || varName.includes('SECRET') ? '***' : value) : 'NOT SET';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔧 CLOUDINARY CONFIGURATION CHECK:');
if (process.env.CLOUDINARY_URL) {
  console.log('✅ CLOUDINARY_URL is set - will use URL configuration');
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log('✅ Individual Cloudinary credentials are set');
} else {
  console.log('❌ CRITICAL: No Cloudinary configuration found!');
  console.log('   This will cause image uploads (profile pic reviews) to fail.');
}

console.log('\n🤖 OPENAI CONFIGURATION CHECK:');
if (process.env.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is set - profile pic analysis will work');
} else {
  console.log('❌ CRITICAL: OPENAI_API_KEY is missing!');
  console.log('   This will cause profile pic analysis to fail.');
}

console.log('\n📊 SUMMARY:');
const missingRequired = requiredVars.filter(varName => !process.env[varName]);
if (missingRequired.length === 0) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log(`❌ Missing ${missingRequired.length} required variables:`);
  missingRequired.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n🚨 ACTION REQUIRED: Add these variables to your Render environment!');
}
