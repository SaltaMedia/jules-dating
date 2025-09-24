const axios = require('axios');
const { logInfo, logError, logWarn } = require('./logger');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:4001',
  timeout: 10000,
  testUser: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  }
};

// Test results storage
let testResults = [];
let authToken = null;

// Test runner class
class TestRunner {
  constructor() {
    this.axios = axios.create({
      baseURL: TEST_CONFIG.baseURL,
      timeout: TEST_CONFIG.timeout
    });
  }

  // Run all tests
  async runAllTests() {
    logInfo('Starting comprehensive API tests...');
    testResults = [];
    
    try {
      // Basic connectivity test
      await this.testBasicConnectivity();
      
      // Authentication tests
      await this.testAuthentication();
      
      // API endpoint tests
      await this.testAPIEndpoints();
      
      // Performance tests
      await this.testPerformance();
      
      // Error handling tests
      await this.testErrorHandling();
      
      return this.generateReport();
    } catch (error) {
      logError('Test runner failed', error);
      throw error;
    }
  }

  // Test basic connectivity
  async testBasicConnectivity() {
    const testName = 'Basic Connectivity';
    
    try {
      const startTime = Date.now();
      const response = await this.axios.get('/');
      const duration = Date.now() - startTime;
      
      this.addResult(testName, {
        passed: response.status === 200,
        status: response.status,
        duration,
        data: response.data
      });
    } catch (error) {
      this.addResult(testName, {
        passed: false,
        error: error.message
      });
    }
  }

  // Test authentication flow
  async testAuthentication() {
    // Test registration
    await this.testRegistration();
    
    // Test login
    await this.testLogin();
    
    // Test protected endpoints
    await this.testProtectedEndpoints();
  }

  // Test user registration
  async testRegistration() {
    const testName = 'User Registration';
    
    try {
      const startTime = Date.now();
      const response = await this.axios.post('/api/auth/register', TEST_CONFIG.testUser);
      const duration = Date.now() - startTime;
      
      this.addResult(testName, {
        passed: response.status === 201 && response.data.token,
        status: response.status,
        duration,
        data: { hasToken: !!response.data.token }
      });
    } catch (error) {
      // Registration might fail if user already exists, which is expected
      this.addResult(testName, {
        passed: error.response?.status === 409, // User already exists
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test user login
  async testLogin() {
    const testName = 'User Login';
    
    try {
      const startTime = Date.now();
      const response = await this.axios.post('/api/auth/login', {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      });
      const duration = Date.now() - startTime;
      
      if (response.status === 200 && response.data.token) {
        authToken = response.data.token;
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
      
      this.addResult(testName, {
        passed: response.status === 200 && response.data.token,
        status: response.status,
        duration,
        data: { hasToken: !!response.data.token }
      });
    } catch (error) {
      this.addResult(testName, {
        passed: false,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test protected endpoints
  async testProtectedEndpoints() {
    if (!authToken) {
      this.addResult('Protected Endpoints', {
        passed: false,
        error: 'No auth token available'
      });
      return;
    }

    // Test get current user
    await this.testGetCurrentUser();
    
    // Test chat endpoint
    await this.testChatEndpoint();
  }

  // Test get current user
  async testGetCurrentUser() {
    const testName = 'Get Current User';
    
    try {
      const startTime = Date.now();
      const response = await this.axios.get('/api/auth/me');
      const duration = Date.now() - startTime;
      
      this.addResult(testName, {
        passed: response.status === 200 && response.data.email,
        status: response.status,
        duration,
        data: { email: response.data.email }
      });
    } catch (error) {
      this.addResult(testName, {
        passed: false,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test chat endpoint
  async testChatEndpoint() {
    const testName = 'Chat with Jules';
    
    try {
      const startTime = Date.now();
      const response = await this.axios.post('/api/chat', {
        message: 'Hello Jules, how are you?'
      });
      const duration = Date.now() - startTime;
      
      this.addResult(testName, {
        passed: response.status === 200 && response.data.response,
        status: response.status,
        duration,
        data: { 
          hasResponse: !!response.data.response,
          intent: response.data.intent
        }
      });
    } catch (error) {
      this.addResult(testName, {
        passed: false,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test API endpoints
  async testAPIEndpoints() {
    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'get' },
      { name: 'System Metrics', path: '/api/metrics', method: 'get' },
      { name: 'Database Stats', path: '/api/database', method: 'get' },
      { name: 'Cache Stats', path: '/api/cache', method: 'get' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  // Test individual endpoint
  async testEndpoint(endpoint) {
    try {
      const startTime = Date.now();
      const response = await this.axios[endpoint.method](endpoint.path);
      const duration = Date.now() - startTime;
      
      this.addResult(endpoint.name, {
        passed: response.status === 200,
        status: response.status,
        duration,
        data: { hasData: !!response.data }
      });
    } catch (error) {
      this.addResult(endpoint.name, {
        passed: false,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test performance
  async testPerformance() {
    const testName = 'Performance Test';
    
    try {
      const startTime = Date.now();
      const promises = [];
      
      // Make 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(this.axios.get('/api/health'));
      }
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      const allSuccessful = responses.every(r => r.status === 200);
      const avgResponseTime = duration / responses.length;
      
      this.addResult(testName, {
        passed: allSuccessful && avgResponseTime < 1000,
        status: allSuccessful ? 200 : 'mixed',
        duration: avgResponseTime,
        data: { 
          concurrentRequests: responses.length,
          allSuccessful,
          averageResponseTime: avgResponseTime
        }
      });
    } catch (error) {
      this.addResult(testName, {
        passed: false,
        error: error.message
      });
    }
  }

  // Test error handling
  async testErrorHandling() {
    // Test invalid endpoint
    await this.testInvalidEndpoint();
    
    // Test invalid auth
    await this.testInvalidAuth();
  }

  // Test invalid endpoint
  async testInvalidEndpoint() {
    const testName = 'Invalid Endpoint (404)';
    
    try {
      const response = await this.axios.get('/api/invalid-endpoint');
      this.addResult(testName, {
        passed: false,
        status: response.status,
        error: 'Expected 404 but got different status'
      });
    } catch (error) {
      this.addResult(testName, {
        passed: error.response?.status === 404,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Test invalid authentication
  async testInvalidAuth() {
    const testName = 'Invalid Authentication (401)';
    
    try {
      // Remove auth header temporarily
      const originalAuth = this.axios.defaults.headers.common['Authorization'];
      delete this.axios.defaults.headers.common['Authorization'];
      
      const response = await this.axios.get('/api/auth/me');
      
      // Restore auth header
      this.axios.defaults.headers.common['Authorization'] = originalAuth;
      
      this.addResult(testName, {
        passed: false,
        status: response.status,
        error: 'Expected 401 but got different status'
      });
    } catch (error) {
      this.addResult(testName, {
        passed: error.response?.status === 401,
        status: error.response?.status,
        error: error.message
      });
    }
  }

  // Add test result
  addResult(name, result) {
    testResults.push({
      name,
      timestamp: new Date().toISOString(),
      ...result
    });
  }

  // Generate test report
  generateReport() {
    const total = testResults.length;
    const passed = testResults.filter(r => r.passed).length;
    const failed = total - passed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        successRate: `${successRate}%`
      },
      results: testResults,
      timestamp: new Date().toISOString()
    };
    
    logInfo('Test report generated', {
      total,
      passed,
      failed,
      successRate: `${successRate}%`
    });
    
    return report;
  }
}

// Export test runner
module.exports = {
  TestRunner,
  TEST_CONFIG
}; 