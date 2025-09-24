const express = require('express');
const router = express.Router();
const { generateApiDocs, getEndpointList, generateTestCases } = require('../utils/apiDocs');
const { TestRunner } = require('../utils/testRunner');
const { asyncHandler } = require('../utils/errorHandler');
const { logInfo } = require('../utils/logger');

// Serve OpenAPI specification
router.get('/openapi.json', asyncHandler(async (req, res) => {
  logInfo('API documentation requested');
  res.json(generateApiDocs());
}));

// Serve API documentation in HTML format
router.get('/', asyncHandler(async (req, res) => {
  const apiSpec = generateApiDocs();
  const endpoints = getEndpointList();
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jules Style API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { display: inline-block; padding: 4px 8px; border-radius: 3px; font-weight: bold; font-size: 12px; margin-right: 10px; }
            .get { background: #28a745; color: white; }
            .post { background: #007bff; color: white; }
            .put { background: #ffc107; color: black; }
            .delete { background: #dc3545; color: white; }
            .path { font-family: monospace; font-weight: bold; color: #333; }
            .summary { color: #666; margin-top: 5px; }
            .tags { margin-top: 5px; }
            .tag { display: inline-block; background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 5px; }
            .auth { background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
            .swagger-link { display: inline-block; background: #85ea2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 Jules Style API Documentation</h1>
            
            <div class="info">
                <strong>API Version:</strong> ${apiSpec.info.version}<br>
                <strong>Description:</strong> ${apiSpec.info.description}<br>
                <strong>Contact:</strong> ${apiSpec.info.contact.email}
            </div>
            
            <a href="/api/docs/openapi.json" class="swagger-link">📄 Download OpenAPI Specification</a>
            <a href="https://editor.swagger.io/?url=http://localhost:4001/api/docs/openapi.json" class="swagger-link" target="_blank">🔧 Open in Swagger Editor</a>
            
            <h2>📋 Available Endpoints</h2>
            ${endpoints.map(endpoint => `
                <div class="endpoint">
                    <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                    <span class="path">${endpoint.path}</span>
                    ${endpoint.requiresAuth ? '<span class="auth">🔒 Auth Required</span>' : ''}
                    <div class="summary">${endpoint.summary}</div>
                    <div class="tags">
                        ${endpoint.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
            
            <h2>🧪 Testing</h2>
            <p>Use the endpoints below to test the API functionality:</p>
            <ul>
                <li><a href="/api/docs/test">Run API Tests</a></li>
                <li><a href="/api/docs/endpoints">List All Endpoints</a></li>
                <li><a href="/api/docs/test-cases">View Test Cases</a></li>
            </ul>
        </div>
    </body>
    </html>
  `;
  
  res.send(html);
}));

// List all endpoints
router.get('/endpoints', asyncHandler(async (req, res) => {
  const endpoints = getEndpointList();
  res.json({
    total: endpoints.length,
    endpoints: endpoints,
    timestamp: new Date().toISOString()
  });
}));

// Get test cases
router.get('/test-cases', asyncHandler(async (req, res) => {
  const testCases = generateTestCases();
  res.json({
    total: testCases.length,
    testCases: testCases,
    timestamp: new Date().toISOString()
  });
}));

// Run comprehensive API tests
router.get('/test', asyncHandler(async (req, res) => {
  logInfo('Comprehensive API tests requested');
  
  try {
    const testRunner = new TestRunner();
    const report = await testRunner.runAllTests();
    res.json(report);
  } catch (error) {
    logInfo('API tests failed', error);
    res.status(500).json({
      error: 'Test execution failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

module.exports = router; 