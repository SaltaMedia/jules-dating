// Test script for outfit memory system
const axios = require('axios');

async function testOutfitMemory() {
  const baseUrl = 'http://localhost:4001';
  const userId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format
  
  console.log('🧪 Testing Jules Outfit Memory System\n');
  
  try {
    // Test 1: User asks for outfit advice
    console.log('1️⃣ User asks for outfit advice...');
    const adviceResponse = await axios.post(`${baseUrl}/api/chat/test`, {
      message: "Can you help me figure out what to wear to a concert date this Thursday? I'm going to see The Roots in Pioneer Courthouse Square with a girl I like.",
      userId: userId
    });
    
    console.log('✅ Advice response received');
    console.log('📝 Jules response:', adviceResponse.data.response.substring(0, 200) + '...');
    
    // Test 2: User asks for images
    console.log('\n2️⃣ User asks for images...');
    const imageResponse = await axios.post(`${baseUrl}/api/inspiration/test`, {
      message: "yeah. show me some examples.",
      context: [
        { role: 'user', content: "Can you help me figure out what to wear to a concert date this Thursday? I'm going to see The Roots in Pioneer Courthouse Square with a girl I like." },
        { role: 'assistant', content: adviceResponse.data.response }
      ],
      userId: userId
    });
    
    console.log('✅ Image response received');
    console.log('🔍 Search query used:', imageResponse.data.query);
    console.log('🖼️ Images found:', imageResponse.data.images.length);
    console.log('💾 Stored outfit pieces:', imageResponse.data.storedOutfitPieces);
    
    // Test 3: User asks for more images
    console.log('\n3️⃣ User asks for more images...');
    const moreImagesResponse = await axios.post(`${baseUrl}/api/inspiration/show-more`, {
      message: "show me more",
      context: [
        { role: 'user', content: "Can you help me figure out what to wear to a concert date this Thursday? I'm going to see The Roots in Pioneer Courthouse Square with a girl I like." },
        { role: 'assistant', content: adviceResponse.data.response }
      ],
      userId: userId,
      existingImages: imageResponse.data.images
    });
    
    console.log('✅ More images response received');
    console.log('🔍 Search query used:', moreImagesResponse.data.query);
    console.log('🖼️ Additional images found:', moreImagesResponse.data.images.length);
    
    // Check for duplicates
    const allImages = [...imageResponse.data.images, ...moreImagesResponse.data.images];
    const imageUrls = allImages.map(img => img.image);
    const uniqueUrls = [...new Set(imageUrls)];
    
    console.log('\n📊 Results Summary:');
    console.log(`- Total images: ${allImages.length}`);
    console.log(`- Unique images: ${uniqueUrls.length}`);
    console.log(`- Duplicates: ${allImages.length - uniqueUrls.length}`);
    
    if (allImages.length === uniqueUrls.length) {
      console.log('✅ No duplicates found!');
    } else {
      console.log('❌ Duplicates found!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testOutfitMemory();
