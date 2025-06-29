const http = require('http');
const app = require('./src/app');
const logger = require('./src/utils/logger');

// Test server functionality
const testServer = async () => {
  try {
    logger.info('🧪 Starting server test...');
    
    // Create server
    const server = http.createServer(app);
    const PORT = 3001; // Use different port to avoid conflicts
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`✅ Test server running on port ${PORT}`);
      
      // Test health check endpoint
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          logger.info(`✅ Health check response (${res.statusCode}):`);
          logger.info(data);
          
          // Test API endpoints
          testApiEndpoints(PORT, () => {
            server.close(() => {
              logger.info('🎉 All tests completed successfully!');
              process.exit(0);
            });
          });
        });
      });
      
      req.on('error', (err) => {
        logger.error('❌ Health check failed:', err);
        server.close(() => process.exit(1));
      });
      
      req.end();
    });
    
    server.on('error', (err) => {
      logger.error('❌ Server error:', err);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Test API endpoints
const testApiEndpoints = (port, callback) => {
  const endpoints = [
    '/api/auth/register',
    '/api/users/profile',
    '/api/expenses',
    '/api/goals',
    '/api/reports/summary'
  ];
  
  let completed = 0;
  
  endpoints.forEach((endpoint) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: endpoint,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        logger.info(`✅ ${endpoint} responded with status ${res.statusCode}`);
        completed++;
        
        if (completed === endpoints.length) {
          callback();
        }
      });
    });
    
    req.on('error', (err) => {
      logger.error(`❌ ${endpoint} failed:`, err.message);
      completed++;
      
      if (completed === endpoints.length) {
        callback();
      }
    });
    
    req.end();
  });
};

// Run test
testServer();