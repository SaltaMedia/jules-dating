const axios = require('axios');

async function testChat() {
  try {
    console.log('Testing Jules chat functionality...');
    
    // Test message that should trigger product recommendations
    const testMessage = "pull up white shoes that I can buy";
    
    const response = await axios.post('http://localhost:4001/api/chat/test', {
      message: testMessage
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n=== JULES RESPONSE ===');
    console.log(response.data.response);
    
    console.log('\n=== PRODUCTS EXTRACTED ===');
    console.log('Number of products:', response.data.products?.length || 0);
    console.log('All products:', response.data.allProducts?.length || 0);
    console.log('Has more products:', response.data.hasMoreProducts);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log('\n=== PRODUCT DETAILS ===');
      response.data.products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        console.log(`  Description: ${product.description}`);
        console.log(`  Link: ${product.link}`);
        console.log(`  Brand: ${product.brand}`);
        console.log(`  Source: ${product.source}`);
      });
    }
    
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Intent:', response.data.intent);
    console.log('Conversation ID:', response.data.conversationId);
    
  } catch (error) {
    console.error('Error testing chat:', error.response?.data || error.message);
  }
}

testChat(); 