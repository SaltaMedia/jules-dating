#!/usr/bin/env node

/**
 * Jules Dating - Monitoring Setup Script
 * 
 * This script helps you set up monitoring for your production environment.
 * Run this after deploying to production to verify everything is working.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4002';
const MONITORING_ENDPOINTS = [
  '/api/monitoring/health',
  '/api/monitoring/healthz',
  '/api/monitoring/metrics',
  '/api/monitoring/database',
  '/api/monitoring/cache',
  '/api/monitoring/system',
  '/api/monitoring/readiness'
];

async function testEndpoint(endpoint) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 10000 });
    const responseTime = Date.now() - startTime;
    
    return {
      endpoint,
      status: '✅ SUCCESS',
      statusCode: response.status,
      responseTime: `${responseTime}ms`,
      data: response.data
    };
  } catch (error) {
    return {
      endpoint,
      status: '❌ FAILED',
      error: error.message,
      statusCode: error.response?.status || 'N/A'
    };
  }
}

async function runMonitoringTests() {
  console.log('🚀 Jules Dating - Monitoring Setup Test');
  console.log('=====================================');
  console.log(`Testing endpoints at: ${BASE_URL}`);
  console.log('');

  const results = [];
  
  for (const endpoint of MONITORING_ENDPOINTS) {
    console.log(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.status === '✅ SUCCESS') {
      console.log(`  ✅ ${result.statusCode} - ${result.responseTime}`);
    } else {
      console.log(`  ❌ ${result.error}`);
    }
  }

  console.log('');
  console.log('📊 Test Results Summary');
  console.log('======================');
  
  const successful = results.filter(r => r.status === '✅ SUCCESS').length;
  const failed = results.filter(r => r.status === '❌ FAILED').length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('');
    console.log('❌ Failed Endpoints:');
    results.filter(r => r.status === '❌ FAILED').forEach(result => {
      console.log(`  - ${result.endpoint}: ${result.error}`);
    });
  }

  console.log('');
  console.log('🔗 Monitoring Dashboard');
  console.log('======================');
  console.log(`Dashboard URL: ${BASE_URL}/api/monitoring/dashboard`);
  console.log('');
  console.log('📋 Recommended Monitoring Setup:');
  console.log('1. Set up uptime monitoring for: /api/monitoring/healthz');
  console.log('2. Monitor performance metrics at: /api/monitoring/metrics');
  console.log('3. Check production readiness: /api/monitoring/readiness');
  console.log('4. Set up alerts for error rates > 5%');
  console.log('5. Monitor database connection health');
  console.log('');

  // Test production readiness
  const readinessResult = results.find(r => r.endpoint === '/api/monitoring/readiness');
  if (readinessResult && readinessResult.status === '✅ SUCCESS') {
    const readiness = readinessResult.data;
    console.log('🎯 Production Readiness Check');
    console.log('============================');
    console.log(`Overall Status: ${readiness.overall.toUpperCase()}`);
    console.log(`Success Rate: ${readiness.summary.successRate}`);
    console.log(`Passed Checks: ${readiness.summary.passed}/${readiness.summary.total}`);
    
    if (readiness.overall !== 'ready') {
      console.log('');
      console.log('⚠️  Issues to address:');
      Object.entries(readiness.checks).forEach(([category, checks]) => {
        Object.entries(checks).forEach(([checkName, check]) => {
          if (!check.passed) {
            console.log(`  - ${category}.${checkName}: ${check.message}`);
          }
        });
      });
    }
  }

  return results;
}

// Run the tests
if (require.main === module) {
  runMonitoringTests()
    .then(() => {
      console.log('');
      console.log('✅ Monitoring setup test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Monitoring setup test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runMonitoringTests, testEndpoint };
