const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to strip unwanted closers
function stripClosers(text) {
  const unwantedClosers = [
    "got any more style questions? just ask",
    "crush that date with confidence",
    "if you need more tips",
    "enjoy getting drinks",
    "have a fantastic time on the date",
    "cheers to creating something awesome",
    "let me know if you need anything else",
    "feel free to ask more questions",
    "hope this helps",
    "good luck"
  ];

  let cleanedText = text;
  unwantedClosers.forEach(closer => {
    const regex = new RegExp(closer, 'gi');
    cleanedText = cleanedText.replace(regex, '');
  });
  
  // Remove emojis
  cleanedText = cleanedText.replace(/[💖✨❤️💕💗💓💞💝💘💟💌💋💍💎💐🌸🌺🌷🌹🌻🌼🌻🌿🍀☘️🌱🌲🌳🌴🌵🌾🌿🍃🍂🍁🍄🌰🎃🎄🎋🎍🎎🎏🎐🎑🎀🎁🎂🎃🎄🎅🎆🎇🎈🎉🎊🎋🎌🎍🎎🎏🎐🎑🎒🎓🎔🎕🎖️🎗️🎘️🎙️🎚️🎛️🎜️🎝️🎞️🎟️🎠🎡🎢🎣🎤🎥🎦🎧🎨🎩🎪🎫🎬🎭🎮🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋️🏌️🏍️🏎️🏏🏐🏑🏒🏓🏔️🏕️🏖️🏗️🏘️🏙️🏚️🏛️🏜️🏝️🏞️🏟️🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏱🏲🏳️🏴🏵️🏶🏷️🏸🏹🏺🏻🏼🏽🏾🏿]/g, '');
  
  return cleanedText.trim();
}

// Helper function to build search query for a specific product
function buildProductSearchQuery(productName, userMessage) {
  // Extract colors from user message
  const colorMatch = userMessage.toLowerCase().match(/(white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange)/);
  const color = colorMatch ? colorMatch[0] : '';
  
  // Extract size/price context from user message
  const sizeMatch = userMessage.toLowerCase().match(/(small|medium|large|xl|xxl|xs|\ds|\d+)/);
  const priceMatch = userMessage.toLowerCase().match(/under\s*\$?(\d+)|less\s*than\s*\$?(\d+)|budget\s*\$?(\d+)/);
  
  // Build specific search query
  let searchQuery = productName;
  
  // Add color if specified and not already in product name
  if (color && !productName.toLowerCase().includes(color)) {
    searchQuery = `${color} ${productName}`;
  }
  
  // Add price constraint if mentioned
  if (priceMatch) {
    const priceLimit = priceMatch[1] || priceMatch[2] || priceMatch[3];
    searchQuery += ` under $${priceLimit}`;
  }
  
  // Add men's specification and purchase intent
  searchQuery += ' men\'s buy shop';
  
  return searchQuery;
}

// Helper function to extract products from Jules's response
function extractProductsFromJulesResponse(julesResponse) {
  if (!julesResponse) return [];
  
  // Look for products in Jules's response text
  const productPattern = /\*\*([^*]+)\*\*\s*[-–]\s*\$?([\d,]+)/g;
  const products = [];
  let match;
  
  while ((match = productPattern.exec(julesResponse)) !== null) {
    products.push({
      title: match[1].trim(),
      price: match[2] || ''
    });
  }
  
  console.log('DEBUG: Extracted products from Jules response:', products);
  return products;
}

// Simplified men's fashion prompt
function getProductInstructions(message, userData = null) {
  return `You are Jules, a men's fashion AI. When users ask for products, recommend 2-3 specific men's items with this format:

**Product Name** - $Price
- Why I love these: [reason]

Example:
**Nike Air Force 1 '07** - $100
- Why I love these: Classic and versatile

CRITICAL: Focus ONLY on men's fashion and products. Current request: ${message}`;
}

// Helper function to extract items from conversation context
function extractItemsFromContext(contextText) {
  const items = [];
  const lowerContext = contextText.toLowerCase();
  
  // Common clothing items to look for
  const clothingItems = [
    'shoes', 'sneakers', 'boots', 'shirt', 'jeans', 'pants', 'jacket', 'coat', 
    'sweater', 'hoodie', 't-shirt', 'polo', 'henley', 'shorts', 'chinos', 
    'joggers', 'sweatpants', 'vest', 'waistcoat', 'loafers', 'vans', 
    'necklace', 'ring', 'earrings', 'bracelet', 'jewelry', 'pendant', 
    'chain', 'button-down', 'button down', 'buttonup', 'button-up'
  ];
  
  // Look for clothing items in the context
  clothingItems.forEach(item => {
    if (lowerContext.includes(item)) {
      items.push(item);
    }
  });
  
  return [...new Set(items)]; // Remove duplicates
}

// Main function to search for products based on Jules' response
async function searchProductsFromJulesResponse(message, conversationMessages) {
  try {
    console.log('🔍 Direct product search - generating Jules response...');
    
    // Get product instructions
    const systemPrompt = getProductInstructions(message);
    
    // Build enhanced user message with context
    let enhancedMessage = message;
    if (conversationMessages && conversationMessages.length > 0) {
      const recentMessages = conversationMessages.slice(-4);
      const contextText = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Jules'}: ${msg.content}`
      ).join('\n');
      
      // Extract key items from conversation context
      const contextItems = extractItemsFromContext(contextText);
      console.log('DEBUG: Extracted items from context:', contextItems);
      
      enhancedMessage = `Conversation context:\n${contextText}\n\nUser's current request: ${message}\n\nCRITICAL: The conversation above mentions these specific items: ${contextItems.join(', ')}. When the user says "pull up links", they want recommendations for these exact items. Do NOT recommend different items.`;
    }
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enhancedMessage }
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.8
    });
    
    let julesResponse = completion.choices[0].message.content;
    console.log('DEBUG: Generated Jules response:', julesResponse.substring(0, 200) + '...');
    
    // Strip unwanted closers
    julesResponse = stripClosers(julesResponse);
    
    // Extract products that Jules provided in her response
    const extractedProducts = extractProductsFromJulesResponse(julesResponse);
    console.log('DEBUG: Extracted products from Jules response:', extractedProducts);
    
    // Filter out women's products that might have slipped through
    const mensProductsOnly = extractedProducts.filter(product => {
      const title = product.title.toLowerCase();
      const isWomensProduct = title.includes('mom') || 
                             title.includes('high rise') || 
                             title.includes('high-rise') ||
                             title.includes('womens') ||
                             title.includes("women's") ||
                             title.includes('female') ||
                             title.includes('ladies');
      return !isWomensProduct;
    });
    
    console.log('DEBUG: After filtering women\'s products:', mensProductsOnly);
    
    let allProducts = [];
    
    // If Jules provided specific products, use Google search to find real links
    if (mensProductsOnly.length > 0) {
      console.log('DEBUG: Jules provided products, searching for real links');
      
      const apiKey = process.env.GOOGLE_API_KEY;
      const cseId = process.env.GOOGLE_CSE_ID;
      
      if (!apiKey || !cseId) {
        console.log('Missing Google API credentials - returning Jules response without products');
        return {
          response: julesResponse,
          products: [],
          allProducts: [],
          hasProducts: false,
          hasMore: false,
          totalFound: 0
        };
      }
      
      // Search for each product Jules recommended
      for (const product of mensProductsOnly) {
        // Use the proper search query function with user context
        const searchQuery = buildProductSearchQuery(product.title, message);
        console.log(`DEBUG: Searching for "${product.title}": ${searchQuery}`);
        
        try {
          const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: apiKey,
              cx: cseId,
              q: searchQuery,
              num: 10,
              safe: 'active',
              // Don't use image search - use regular search for better shopping results
// Remove siteSearch - we'll use domain filtering instead
            }
          });
          
          if (!response.data.items || response.data.items.length === 0) {
            console.log(`No results found for ${product.title}`);
            continue;
          }
          
          // DEBUG: Log what Google is returning
          console.log(`DEBUG: Google returned ${response.data.items.length} results for "${product.title}"`);
          response.data.items.forEach((item, index) => {
            console.log(`DEBUG: Result ${index + 1}: ${item.link} - ${item.title}`);
          });
          
          // Filter and process results  
          const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
          
          const productResults = response.data.items
            .filter(item => !nonProductSites.test(item.link))
            .filter(item => !nonProductSites.test(item.title + ' ' + (item.snippet || '')))
            .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
            .filter(item => {
              // Improved relevance check for the specific product
              const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
              const productName = product.title.toLowerCase();
              
              // Extract brand from product name (first word or known brand patterns)
              const productWords = product.title.split(' ');
              let productBrand = productWords[0].toLowerCase();
              
              // Handle multi-word brands
              const multiWordBrands = ['new balance', 'common projects', 'red wing', 'dr. martens', 'to boot', 'a.p.c.', 'rag & bone', 'acne studios'];
              const fullProductName = product.title.toLowerCase();
              for (const brand of multiWordBrands) {
                if (fullProductName.startsWith(brand)) {
                  productBrand = brand;
                  break;
                }
              }
              
              // Brand matching - more flexible approach
              const brandMatch = itemText.includes(productBrand) || 
                                itemText.includes(productWords[0].toLowerCase()) ||
                                // Handle brand variations (e.g., Nike vs NIKE)
                                new RegExp(`\\b${productBrand}\\b`, 'i').test(itemText);
              
              // Product type matching - ensure we're getting the right type of item
              const productType = productWords.slice(-1)[0].toLowerCase(); // last word often indicates type
              const typeMatch = itemText.includes(productType) || 
                               // Handle variations like "sneaker" vs "sneakers"
                               itemText.includes(productType.replace(/s$/, '')) ||
                               itemText.includes(productType + 's');
              
              // Overall relevance - item should contain significant words from product name
              const significantWords = productWords.filter(word => word.length > 2);
              const wordMatches = significantWords.filter(word => 
                itemText.includes(word.toLowerCase())
              ).length;
              const relevanceScore = wordMatches / Math.max(significantWords.length, 1);
              
              return brandMatch && typeMatch && relevanceScore >= 0.5;
            })
            .filter(item => {
              // Simple filtering - just exclude obvious junk sites
              const url = item.link.toLowerCase();
              const title = item.title.toLowerCase();
              
              // Filter out obvious non-shopping sites
              const junkSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr/i;
              if (junkSites.test(url)) {
                return false;
              }
              
              // Must contain shopping-related keywords
              const hasShoppingKeywords = /shop|store|buy|product|item|clothing|apparel|fashion|sneaker|shoe|nike|adidas|purchase|cart|price/i.test(title + ' ' + (item.snippet || ''));
              
              return hasShoppingKeywords;
            })
            .slice(0, 1) // Get only 1 match per product to avoid duplicates
            .map((item, index) => ({
              title: product.title, // Use Jules' product name
              link: item.link,
              image: item.pagemap?.cse_image?.[0]?.src || '',
              price: product.price || item.pagemap?.offer?.[0]?.price || '',
              description: item.snippet || '',
              brand: product.title.split(' ')[0] // Extract brand from product name
            }));
          
          allProducts.push(...productResults);
          
        } catch (error) {
          console.error(`Error searching for product ${product.title}:`, error.message);
          // Continue with other products if one fails
        }
      }
    }
    
    console.log('DEBUG: Final products array:', allProducts);
    
    return {
      response: julesResponse,
      products: allProducts.slice(0, 3), // Limit to 3 for initial display
      allProducts: allProducts,
      hasProducts: allProducts.length > 0,
      hasMore: allProducts.length > 3,
      totalFound: allProducts.length
    };
    
  } catch (error) {
    console.error('Product search error:', error);
    throw error;
  }
}

module.exports = {
  searchProductsFromJulesResponse,
  buildProductSearchQuery,
  extractProductsFromJulesResponse,
  getProductInstructions,
  stripClosers
};
