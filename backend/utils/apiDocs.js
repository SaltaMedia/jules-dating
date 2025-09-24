const { logInfo } = require('./logger');

// API Documentation
const apiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Jules Style Backend API',
    description: 'AI-powered style and dating advice platform',
    version: '1.0.0',
    contact: {
      name: 'Jules Support',
      email: 'support@jules-style.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:4001',
      description: 'Development server'
    },
    {
      url: 'https://api.jules-style.com',
      description: 'Production server'
    }
  ],
  paths: {
    '/': {
      get: {
        summary: 'API Status',
        description: 'Get API status and version information',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    version: { type: 'string' },
                    status: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register new user',
        description: 'Create a new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Validation error' },
          '409': { description: 'User already exists' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and get access token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user',
        description: 'Get current user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/chat': {
      post: {
        summary: 'Chat with Jules',
        description: 'Send a message to Jules and get AI-powered response',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', minLength: 1 },
                  context: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Chat response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    response: { type: 'string' },
                    intent: { type: 'string' },
                    products: { type: 'array', items: { type: 'object' } },
                    images: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' },
          '400': { description: 'Invalid message' }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Comprehensive health check of all services',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    overall: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'object' },
                        externalServices: { type: 'object' },
                        application: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/metrics': {
      get: {
        summary: 'System metrics',
        description: 'Get system performance metrics',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'System metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requestCount: { type: 'number' },
                    errorCount: { type: 'number' },
                    averageResponseTime: { type: 'number' },
                    system: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/database': {
      get: {
        summary: 'Database statistics',
        description: 'Get database query performance statistics',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Database statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalQueries: { type: 'number' },
                    slowQueries: { type: 'number' },
                    averageQueryTime: { type: 'number' },
                    queriesByCollection: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/cache': {
      get: {
        summary: 'Cache statistics',
        description: 'Get cache performance statistics',
        tags: ['Monitoring'],
        responses: {
          '200': {
            description: 'Cache statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    redis: { type: 'object' },
                    memory: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          statusCode: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Chat',
      description: 'AI chat functionality with Jules'
    },
    {
      name: 'Monitoring',
      description: 'System health and performance monitoring'
    }
  ]
};

// Generate API documentation
function generateApiDocs() {
  return apiSpec;
}

// Get endpoint list for testing
function getEndpointList() {
  const endpoints = [];
  
  Object.keys(apiSpec.paths).forEach(path => {
    Object.keys(apiSpec.paths[path]).forEach(method => {
      const endpoint = apiSpec.paths[path][method];
      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: endpoint.summary,
        tags: endpoint.tags || [],
        requiresAuth: endpoint.security ? true : false
      });
    });
  });
  
  return endpoints;
}

// Generate test cases
function generateTestCases() {
  const testCases = [
    {
      name: 'API Status Check',
      endpoint: 'GET /',
      expectedStatus: 200,
      description: 'Verify API is running'
    },
    {
      name: 'User Registration',
      endpoint: 'POST /api/auth/register',
      payload: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      },
      expectedStatus: 201,
      description: 'Register new user'
    },
    {
      name: 'User Login',
      endpoint: 'POST /api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      },
      expectedStatus: 200,
      description: 'Login with valid credentials'
    },
    {
      name: 'Get Current User',
      endpoint: 'GET /api/auth/me',
      requiresAuth: true,
      expectedStatus: 200,
      description: 'Get authenticated user profile'
    },
    {
      name: 'Chat with Jules',
      endpoint: 'POST /api/chat',
      payload: {
        message: 'Hello Jules, how are you?'
      },
      requiresAuth: true,
      expectedStatus: 200,
      description: 'Send message to Jules'
    },
    {
      name: 'Health Check',
      endpoint: 'GET /api/health',
      expectedStatus: 200,
      description: 'Check system health'
    },
    {
      name: 'System Metrics',
      endpoint: 'GET /api/metrics',
      expectedStatus: 200,
      description: 'Get performance metrics'
    },
    {
      name: 'Database Statistics',
      endpoint: 'GET /api/database',
      expectedStatus: 200,
      description: 'Get database performance stats'
    },
    {
      name: 'Cache Statistics',
      endpoint: 'GET /api/cache',
      expectedStatus: 200,
      description: 'Get cache performance stats'
    }
  ];
  
  return testCases;
}

module.exports = {
  generateApiDocs,
  getEndpointList,
  generateTestCases
}; 