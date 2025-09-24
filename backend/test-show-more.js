const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create a test token
function createTestToken() {
  const payload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    isAdmin: false
  };
  
  const secret = process.env.JWT_SECRET || 'dev-jwt-secret-only-for-development';
  return jwt.sign(payload, secret);
}

// Test the Show More functionality
async function testShowMore() {
  try {
    console.log('Testing Show More functionality...\n');
    
    const testToken = createTestToken();
    console.log('Created test token for authentication\n');
    
    // First, get initial personalized picks
    console.log('1. Getting initial personalized picks...');
    const initialResponse = await axios.get('http://localhost:4001/api/personalized-picks', {
      headers: { 
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Initial picks received for categories:', Object.keys(initialResponse.data.picks || {}));
    
    // Test Show More for each category
    const categories = ['outerwear', 'tops', 'bottoms', 'shoes', 'accessories'];
    
    for (const category of categories) {
      console.log(`\n2. Testing Show More for ${category}...`);
      
      // First Show More click
      const firstMoreResponse = await axios.get(`http://localhost:4001/api/personalized-picks/more/${category}?count=3`, {
        headers: { 
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const firstProducts = firstMoreResponse.data.products || [];
      console.log(`First Show More for ${category}: ${firstProducts.length} products`);
      console.log('Product titles:', firstProducts.map(p => p.title).join(', '));
      
      // Second Show More click
      const secondMoreResponse = await axios.get(`http://localhost:4001/api/personalized-picks/more/${category}?count=3`, {
        headers: { 
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const secondProducts = secondMoreResponse.data.products || [];
      console.log(`Second Show More for ${category}: ${secondProducts.length} products`);
      console.log('Product titles:', secondProducts.map(p => p.title).join(', '));
      
      // Check if products are different
      const firstTitles = firstProducts.map(p => p.title).sort();
      const secondTitles = secondProducts.map(p => p.title).sort();
      const areDifferent = JSON.stringify(firstTitles) !== JSON.stringify(secondTitles);
      
      console.log(`Products are different: ${areDifferent ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!areDifferent) {
        console.log('❌ ISSUE: Same products returned on second Show More click');
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('Authentication failed. Make sure the backend is running and JWT_SECRET is set.');
    }
  }
}

// Run the test
testShowMore(); 