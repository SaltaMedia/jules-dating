#!/usr/bin/env node

/**
 * Pinterest Token Setup Script
 * 
 * This script helps you set up Pinterest API tokens with refresh token support
 * to extend the token lifespan beyond 24 hours.
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const pinterestTokenManager = require('../utils/pinterestTokenManager');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupPinterest() {
  console.log('🎯 Pinterest Token Setup for Jules Style App\n');
  console.log('This will help you configure Pinterest API tokens with refresh token support.');
  console.log('This extends your token lifespan beyond 24 hours.\n');

  // Check current configuration
  console.log('📋 Current Configuration:');
  const status = pinterestTokenManager.getTokenStatus();
  console.log(JSON.stringify(status, null, 2));
  console.log('');

  const setupType = await question('Choose setup type:\n1. OAuth Flow (recommended)\n2. Manual Token Entry\nEnter choice (1 or 2): ');

  if (setupType === '1') {
    await setupOAuthFlow();
  } else if (setupType === '2') {
    await setupManualTokens();
  } else {
    console.log('❌ Invalid choice. Exiting.');
    rl.close();
    return;
  }
}

async function setupOAuthFlow() {
  console.log('\n🔐 OAuth Flow Setup\n');
  
  // Check if client credentials are configured
  if (!pinterestTokenManager.clientId || !pinterestTokenManager.clientSecret) {
    console.log('❌ Pinterest client credentials not configured.');
    console.log('Please add the following to your .env file:');
    console.log('PINTEREST_CLIENT_ID=your_client_id_here');
    console.log('PINTEREST_CLIENT_SECRET=your_client_secret_here');
    console.log('PINTEREST_REDIRECT_URI=http://localhost:4001/api/pinterest/callback');
    console.log('\nTo get these credentials:');
    console.log('1. Go to https://developers.pinterest.com/');
    console.log('2. Create a new app');
    console.log('3. Get your client ID and client secret');
    console.log('4. Add the redirect URI to your app settings');
    rl.close();
    return;
  }

  try {
    const authUrl = pinterestTokenManager.getAuthorizationUrl();
    console.log('✅ Authorization URL generated successfully!');
    console.log('\n📱 Please follow these steps:');
    console.log('1. Open this URL in your browser:');
    console.log(authUrl);
    console.log('\n2. Authorize the application');
    console.log('3. Copy the authorization code from the callback URL');
    console.log('4. Paste it below\n');

    const code = await question('Enter the authorization code: ');
    
    if (!code) {
      console.log('❌ No authorization code provided. Exiting.');
      rl.close();
      return;
    }

    console.log('\n🔄 Exchanging code for tokens...');
    const tokens = await pinterestTokenManager.exchangeCodeForTokens(code);
    
    console.log('✅ Tokens obtained successfully!');
    console.log('📊 Token Status:');
    console.log(JSON.stringify(pinterestTokenManager.getTokenStatus(), null, 2));
    
    // Update .env file
    await updateEnvFile(tokens);
    
  } catch (error) {
    console.error('❌ Error during OAuth flow:', error.message);
  }
}

async function setupManualTokens() {
  console.log('\n✏️  Manual Token Setup\n');
  console.log('If you already have Pinterest tokens, you can enter them manually.');
  console.log('Note: For refresh token support, you need both access_token and refresh_token.\n');

  const accessToken = await question('Enter your Pinterest access token: ');
  const refreshToken = await question('Enter your Pinterest refresh token (optional): ');

  if (!accessToken) {
    console.log('❌ Access token is required. Exiting.');
    rl.close();
    return;
  }

  try {
    // Configure tokens
    pinterestTokenManager.tokens = {
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: Date.now() + (86400 * 1000) // 24 hours from now
    };

    await pinterestTokenManager.saveTokens();
    
    console.log('✅ Tokens configured successfully!');
    console.log('📊 Token Status:');
    console.log(JSON.stringify(pinterestTokenManager.getTokenStatus(), null, 2));
    
    // Update .env file
    await updateEnvFile(pinterestTokenManager.tokens);
    
  } catch (error) {
    console.error('❌ Error configuring tokens:', error.message);
  }
}

async function updateEnvFile(tokens) {
  try {
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      // .env file doesn't exist, create it
      envContent = '';
    }

    // Update or add Pinterest tokens
    const lines = envContent.split('\n');
    const pinterestLines = [
      `PINTEREST_ACCESS_TOKEN=${tokens.access_token}`,
      tokens.refresh_token ? `PINTEREST_REFRESH_TOKEN=${tokens.refresh_token}` : ''
    ].filter(line => line);

    let updated = false;
    for (const line of pinterestLines) {
      const [key] = line.split('=');
      const existingIndex = lines.findIndex(l => l.startsWith(key + '='));
      
      if (existingIndex >= 0) {
        lines[existingIndex] = line;
        updated = true;
      } else {
        lines.push(line);
        updated = true;
      }
    }

    if (updated) {
      await fs.writeFile(envPath, lines.join('\n'));
      console.log('✅ Updated .env file with new tokens');
    }
  } catch (error) {
    console.warn('⚠️  Could not update .env file:', error.message);
    console.log('Please manually update your .env file with:');
    console.log(`PINTEREST_ACCESS_TOKEN=${tokens.access_token}`);
    if (tokens.refresh_token) {
      console.log(`PINTEREST_REFRESH_TOKEN=${tokens.refresh_token}`);
    }
  }
}

// Run the setup
setupPinterest().finally(() => {
  rl.close();
}); 