const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { validateProductSearch, validatePagination } = require('../middleware/validation');
const { OpenAI } = require('openai');
const User = require('../models/User');
const { productCache } = require('../utils/productCache');

// Initialize OpenAI client when needed
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Extract brand from product name (e.g., "AllSaints Balfern Biker Jacket" -> "AllSaints")
function extractBrandFromProductName(productName) {
  const words = productName.split(' ');
  return words[0]; // Always just use the first word as the brand
}

// Product blacklist - reject specific problematic products
function isBlacklistedProduct(productName) {
  const blacklistedProducts = [
    'AllSaints Balfern Leather Biker Jacket',
    'AllSaints Balfern Biker Jacket'
  ];
  
  const isBlacklisted = blacklistedProducts.some(blacklisted => 
    productName.toLowerCase().includes(blacklisted.toLowerCase())
  );
  
  if (isBlacklisted) {
    console.log(`🚫 BLOCKED BLACKLISTED PRODUCT: ${productName}`);
  }
  return isBlacklisted;
}

// Domain blacklist - reject known bad/irrelevant domains
function isBadDomain(url) {
  const badDomains = [
    'commaction.org',
    'sarkujapan.com',
    'parkavenuetavern.com', 
    'realendpoints.com',
    'codrington.edu.bb',
    'fixmedical.com',
    'hscct.org',
    'greensafaris.com',
    'kulanjobs.com',
    'ihrcworld.org',
    // Block job sites
    'jobs.com',
    'indeed.com',
    'linkedin.com',
    'glassdoor.com',
    'monster.com',
    'careerbuilder.com',
    // Block educational sites
    '.edu',
    '.org',
    // Block social media
    'pinterest.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'reddit.com',
    'youtube.com',
    'tiktok.com'
  ];
  
  const isBad = badDomains.some(badDomain => url.toLowerCase().includes(badDomain));
  if (isBad) {
    console.log(`🚫 BLOCKED BAD DOMAIN: ${url}`);
  }
  return isBad;
}

// Extract products from Jules's response using AI
async function extractProductsFromResponse(julesResponse) {
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract EXACTLY 3 product names from Jules's response. Look for text in **bold** format like "**Product Name** - $XX". Return only the first 3 product names, one per line, without the ** or price. Do not return more than 3 products.`
        },
        {
          role: 'user',
          content: julesResponse
        }
      ],
      max_tokens: 200
    });
    
    const extractedText = completion.choices[0].message.content.trim();
    const products = extractedText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(product => !isBlacklistedProduct(product)) // Filter out blacklisted products
      .slice(0, 3); // Force limit to 3 products
    
    console.log(`🤖 AI extracted products:`, products);
    return products;
  } catch (error) {
    console.error('AI extraction failed:', error.message);
    return [];
  }
}

// Simple Google search for MVP
async function searchGoogleAPI(query, apiKey, cseId) {
  try {
    console.log(`🔍 MVP Search: "${query}"`);
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cseId,
        q: query,
        num: 5
      }
    });
    
    const results = response.data.items || [];
    console.log(`✅ Found ${results.length} results for "${query}"`);
    
    return results;
  } catch (error) {
    console.error(`❌ Search failed for "${query}":`, error.message);
    return [];
  }
}

// Filter results and get first good one
function getBestResult(results) {
  return results
    .filter(item => {
      // Reject bad domains
      if (isBadDomain(item.link)) return false;
      
      const url = item.link.toLowerCase();
      const title = (item.title || '').toLowerCase();
      const snippet = (item.snippet || '').toLowerCase();
      const fullText = `${title} ${snippet}`;
      
      // Reject non-product sites
      const nonProductSites = ['wikipedia.org', 'reddit.com', 'pinterest.com', 'instagram.com', 'facebook.com', 'twitter.com', 'youtube.com', 'tiktok.com'];
      if (nonProductSites.some(site => url.includes(site))) return false;
      
      // Reject women's fashion for men's requests
      const womensKeywords = ['women', 'womens', 'ladies', 'female', 'girls', 'girl\'s', 'womenswear', 'ladieswear'];
      if (womensKeywords.some(keyword => fullText.includes(keyword))) {
        console.log(`🚫 BLOCKED WOMEN'S PRODUCT: ${url} - contains women's keywords`);
        return false;
      }
      
      // Must be from legitimate shopping sites
      const shoppingSites = ['shop', 'store', 'buy', 'product', 'clothing', 'fashion', 'retail', 'mall', 'outlet', 'brand'];
      const hasShoppingContext = shoppingSites.some(site => fullText.includes(site)) || 
                                 url.includes('shop') || 
                                 url.includes('store') || 
                                 url.includes('buy') ||
                                 url.includes('product');
      
      if (!hasShoppingContext) {
        console.log(`🚫 BLOCKED NON-SHOPPING SITE: ${url} - no shopping context`);
        return false;
      }
      
      // No hardcoded preferred sites - let Google's algorithm determine relevance
      
      return true;
    })[0]; // Return first good result
}

// Main product search function for MVP
async function searchProducts(productNames, apiKey, cseId) {
  const allProducts = [];
  
  for (const productName of productNames) {
    console.log(`\n🔍 MVP Searching for: "${productName}"`);
    
    // Enhanced search: "brand+productname+ mens buy site:brand.com OR site:retailer.com"
    const searchQuery = `${productName} mens buy`;
    const results = await searchGoogleAPI(searchQuery, apiKey, cseId);
    
    let bestResult = getBestResult(results);
    
    // If no good result found, try simplified fallback: brand + mens buy
    if (!bestResult) {
      console.log(`🔄 Fallback: Trying brand + mens buy search`);
      const brand = extractBrandFromProductName(productName);
      const fallbackQuery = `${brand} mens buy`;
      console.log(`🔄 Fallback query: "${fallbackQuery}"`);
      
      const fallbackResults = await searchGoogleAPI(fallbackQuery, apiKey, cseId);
      bestResult = getBestResult(fallbackResults);
    }
    
    if (bestResult) {
      // Try to get image from search result
      let image = '';
      if (bestResult.pagemap && bestResult.pagemap.cse_image && bestResult.pagemap.cse_image[0]) {
        image = bestResult.pagemap.cse_image[0].src;
        console.log(`📸 Found image: ${image}`);
      } else {
        console.log(`❌ No image found for ${productName}`);
      }
      
      allProducts.push({
        title: productName,
        link: bestResult.link,
        image: image,
        price: bestResult.pagemap?.offer?.[0]?.price || '',
        description: bestResult.snippet || '',
        brand: productName.split(' ')[0] // First word as brand
      });
      
      console.log(`✅ Found result for "${productName}": ${bestResult.link}`);
    } else {
      console.log(`❌ No results found for "${productName}"`);
    }
  }
  
  return allProducts;
}

// POST /api/products - Main product search endpoint
router.post('/', auth, validateProductSearch, async (req, res) => {
  try {
    const { message, conversation, userId } = req.body;
    
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!apiKey || !cseId) {
      console.error('❌ Google API credentials not set');
      return res.status(500).json({ error: 'Search service unavailable' });
    }
    
    // Check cache first
    const cacheKey = productCache.generateCacheKey(message, conversation);
    const cachedResult = productCache.get(cacheKey);
    if (cachedResult) {
      console.log('💾 Cache HIT for product search');
      return res.json({
        hasProducts: cachedResult.products.length > 0,
        products: cachedResult.products,
        cached: true
      });
    }
    
    // Extract product names from conversation or message
    let productNames = [];
    
    // Try to extract from conversation messages (Jules's response)
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        productNames = await extractProductsFromResponse(lastMessage.content);
      }
    }
    
    // If still no products, return empty result
    if (productNames.length === 0) {
      console.log('❌ No products extracted from message or conversation');
      return res.json({
        hasProducts: false,
        products: [],
        message: 'No products found in the request'
      });
    }
    
    console.log(`🔍 MVP Searching for products:`, productNames);
    
    // Search for products
    const products = await searchProducts(productNames, apiKey, cseId);
    
    // Cache the result
    productCache.set(cacheKey, { products }, 3600); // 1 hour cache
    
    console.log(`✅ MVP Found ${products.length} products total`);
    
    res.json({
      hasProducts: products.length > 0,
      products: products.slice(0, 3), // Only return first 3 products
      cached: false
    });
    
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Product search failed' });
  }
});

// GET /api/products - Get cached products (for pagination)
router.get('/', auth, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // This endpoint is mainly for compatibility
    res.json({
      products: [],
      totalPages: 0,
      currentPage: parseInt(page),
      hasMore: false
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// GET /api/products/cache-stats - Get cache statistics
router.get('/cache-stats', (req, res) => {
  try {
    const stats = productCache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// POST /api/products/clear-cache - Clear product cache
router.post('/clear-cache', (req, res) => {
  try {
    productCache.clear();
    res.json({ message: 'Product search cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// POST /api/products/test - Test endpoint for debugging
router.post('/test', async (req, res) => {
  try {
    const { message, conversation, isFollowUp, previousRecommendations } = req.body;
    
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
      return res.status(500).json({ error: 'Google API credentials not set' });
    }
    
    // Extract products from conversation
    let productNames = [];
    if (isFollowUp && conversation && conversation.messages && conversation.messages.length > 0) {
      console.log('🔄 Follow-up request: Using current conversation context');
      // For follow-up requests, extract products from Jules's NEW response in current conversation
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        productNames = await extractProductsFromResponse(lastMessage.content);
        console.log(`🔄 Extracted ${productNames.length} NEW products from follow-up response:`, productNames);
      } else {
        console.log('❌ No assistant message found in follow-up conversation');
      }
    } else if (conversation && conversation.messages && conversation.messages.length > 0) {
      console.log('📝 Regular request: Using conversation context');
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        productNames = await extractProductsFromResponse(lastMessage.content);
        console.log(`📝 Extracted ${productNames.length} products from regular response:`, productNames);
      }
    }
    
    if (productNames.length === 0) {
      console.log('❌ No products extracted from conversation');
      // Fallback: try to extract from previous recommendations if available
      if (isFollowUp && previousRecommendations) {
        console.log('🔄 Fallback: Trying to extract from previous recommendations');
        productNames = await extractProductsFromResponse(previousRecommendations);
        if (productNames.length > 0) {
          console.log(`🔄 Fallback successful: Found ${productNames.length} products from previous recommendations`);
        }
      }
      
      if (productNames.length === 0) {
        return res.json({ error: 'No products found in conversation or previous recommendations' });
      }
    }
    
    console.log(`🧪 MVP TEST: Searching for products:`, productNames);
    
    // Test the search for each product
    const allProducts = [];
    for (const productName of productNames) {
      const searchQuery = `${productName} mens buy`;
      console.log(`🧪 MVP TEST: Query for "${productName}": "${searchQuery}"`);
      
      const products = await searchProducts([productName], apiKey, cseId);
      allProducts.push(...products);
    }
    
    // Return the format expected by chatController - limit to 3 products
    res.json({
      response: conversation.messages[conversation.messages.length - 1].content, // Jules's response
      products: allProducts.slice(0, 3), // Only return first 3 products
      message: 'MVP Test completed',
      productNames,
      totalFound: allProducts.length
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// GET /api/products/proxy-image/:imageId - Proxy images (for CORS)
router.get('/proxy-image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const imageUrl = Buffer.from(imageId, 'base64').toString('utf-8');
    
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    res.set({
      'Content-Type': response.headers['content-type'],
      'Cache-Control': 'public, max-age=3600'
    });
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});

module.exports = router;

