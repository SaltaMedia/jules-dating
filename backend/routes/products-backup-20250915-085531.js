const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { validateProductSearch, validatePagination } = require('../middleware/validation');
const { OpenAI } = require('openai');
const User = require('../models/User');
const { productCache } = require('../utils/productCache');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Domain blacklist for MVP - reject known bad/irrelevant domains
function isBadDomain(url) {
  const badDomains = [
    'commaction.org',
    'sarkujapan.com', // Japanese restaurant - not clothing related
    'parkavenuetavern.com', // Tavern/restaurant - not clothing related
    'realendpoints.com', // Medical/pharmaceutical company - not clothing related
    'codrington.edu.bb', // University - not clothing related
    'fixmedical.com', // Medical site - not clothing related
    'hscct.org', // Charity - not clothing related
    'greensafaris.com', // Safari/travel site - not clothing related
    // Add more bad domains as we discover them
  ];
  
  const isBad = badDomains.some(badDomain => url.toLowerCase().includes(badDomain));
  if (isBad) {
    console.log(`🚫 BLOCKED BAD DOMAIN: ${url}`);
  }
  return isBad;
}

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

// Helper function to extract brands from Jules's response using AI
async function extractBrandsFromResponse(julesResponse) {
  if (!julesResponse) return [];
  
  try {
    const prompt = `Extract all clothing, fashion, and lifestyle brand names mentioned in this text. Only return the brand names, one per line, without any additional text or formatting.

Text: "${julesResponse}"

Examples of what to extract:
- Nike, Adidas, Uniqlo, J.Crew, Lululemon
- Common Projects, Red Wing, Thursday Boots
- Patagonia, The North Face, Arc'teryx
- Suitsupply, Bonobos, Everlane

Only extract actual brand names, not generic terms like "shoes" or "clothing".`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    
    // Parse the response - split by lines and clean up
    const brands = response
      .split('\n')
      .map(brand => brand.trim())
      .filter(brand => brand.length > 0 && brand.length < 50) // Reasonable brand name length
      .map(brand => brand.toLowerCase())
      .filter((brand, index, arr) => arr.indexOf(brand) === index); // Remove duplicates
    
    console.log('DEBUG: AI extracted brands:', brands);
    return brands;
    
  } catch (error) {
    console.error('AI brand extraction failed:', error.message);
    // Fallback to empty array - let the system work without brands
    return [];
  }
}

// Helper function to build search query for a specific brand
function buildBrandSearchQuery(brand, message) {
  // Extract product type from the original message
  const productTypes = /shoes|sneakers|boots|shirt|jeans|pants|jacket|coat|sweater|hoodie|t-shirt|polo|henley|shorts|chinos|joggers|sweatpants|vest|waistcoat|loafers|vans|necklace|ring|earrings|bracelet|jewelry|pendant|chain|button-down|button down|buttonup|button-up/i;
  const productMatch = message.match(productTypes);
  const productType = productMatch ? productMatch[0] : 'clothing';
  
  return `${brand} ${productType} men buy`;
}

// Helper function to build tiered search queries for better results
function buildTieredSearchQueries(productName, userMessage) {
  // Extract brand from product name (first word or two words)
  const brandMatch = productName.match(/^([A-Za-z\s&.]+?)\s+/);
  const brand = brandMatch ? brandMatch[1].trim() : '';
  
  // Extract product type (remove brand and common descriptive words)
  const productType = productName
    .replace(/^([A-Za-z\s&.]+?)\s+/, '') // Remove brand
    .replace(/\s+(men|mens|women|womens|unisex|leather|cotton|wool|silk|denim|slim|regular|classic|vintage|modern|premium|luxury|basic|essential|perfecto|biker|moto|trialmaster|dalby|balfern|rocco)\s+/gi, ' ')
    .trim();
  
  const queries = [];
  
  // Tier 1: Brand Direct Product Page (Priority 100)
  if (brand && productType) {
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    queries.push({
      query: `site:${brandDomain}.com "${productType}" men`,
      priority: 100,
      description: 'Brand Direct Product Page'
    });
  }
  
  // Tier 2: Brand Category Page (Priority 80)
  if (brand && productType) {
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    queries.push({
      query: `site:${brandDomain}.com men "${productType}"`,
      priority: 80,
      description: 'Brand Category Page'
    });
  }
  
  // Tier 3: Legit Retailers (Priority 60)
  const legitRetailers = ['amazon.com', 'target.com', 'walmart.com', 'macys.com', 'nordstrom.com', 'zappos.com'];
  legitRetailers.forEach(retailer => {
    if (productType) {
      queries.push({
        query: `site:${retailer} "${productType}" men`,
        priority: 60,
        description: `Legit Retailer: ${retailer}`
      });
    }
  });
  
  // Tier 4: Google Search Fallback (Priority 10)
  queries.push({
    query: `${productName} men buy`,
    priority: 10,
    description: 'Google Search Fallback'
  });
  
  return queries;
}

// Helper function to build search query for a specific product with user context
function buildProductSearchQuery(productName, userMessage) {
  // Extract brand from product name (first word or two words)
  const brandMatch = productName.match(/^([A-Za-z\s&.]+?)\s+/);
  const brand = brandMatch ? brandMatch[1].trim() : '';
  
  // Extract product type (remove brand and common descriptive words)
  const productType = productName
    .replace(/^([A-Za-z\s&.]+?)\s+/, '') // Remove brand
    .replace(/\s+(men|mens|women|womens|unisex|leather|cotton|wool|silk|denim|slim|regular|classic|vintage|modern|premium|luxury|basic|essential|perfecto|biker|moto|trialmaster|dalby|balfern|rocco)\s+/gi, ' ')
    .trim();
  
  // Extract colors from user message
  const colorMatch = userMessage.toLowerCase().match(/(white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange)/);
  const color = colorMatch ? colorMatch[0] : '';
  
  // Build brand-specific search query to prioritize brand websites
  if (brand && productType) {
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    
    // Use site: search to prioritize brand's official website
    let searchQuery = `site:${brandDomain}.com "${productType}" men`;
    if (color) {
      searchQuery = `site:${brandDomain}.com "${productType}" men ${color}`;
    }
    
    console.log(`DEBUG: Using brand-specific search: ${searchQuery}`);
    return searchQuery;
  }
  
  // Fallback to original approach if brand extraction fails
  let searchQuery = productName;
  if (color) {
    searchQuery = `${productName} ${color}`;
  }
  searchQuery += ' men buy';
  
  return searchQuery;
}

// Helper function to build tiered search queries for better results
function buildTieredSearchQueries(productName, userMessage) {
  // Extract brand from product name
  const brandMatch = productName.match(/^([A-Za-z\s&.]+?)\s+/);
  const brand = brandMatch ? brandMatch[1].trim() : '';
  
  // Extract product type (remove brand and common words)
  const productType = productName
    .replace(/^([A-Za-z\s&.]+?)\s+/, '') // Remove brand
    .replace(/\s+(men|mens|women|womens|unisex|leather|cotton|wool|silk|denim|slim|regular|classic|vintage|modern|premium|luxury|basic|essential|perfecto|biker|moto|trialmaster|dalby|balfern|rocco)\s+/gi, ' ')
    .trim();
  
  // Extract colors from user message
  const colorMatch = userMessage.toLowerCase().match(/(white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange)/);
  const color = colorMatch ? colorMatch[0] : '';
  
  const queries = [];
  
  // Tier 1: Brand-specific product search (most specific)
  if (brand && productType) {
    queries.push({
      query: `site:${brand.toLowerCase().replace(/\s+/g, '')}.com "${productType}" men`,
      priority: 100,
      description: 'Brand product page'
    });
    
    // Alternative brand domains
    const brandDomain = brand.toLowerCase().replace(/\s+/g, '');
    queries.push({
      query: `"${brand} ${productType}" men site:${brandDomain}.com`,
      priority: 95,
      description: 'Brand product page (alt)'
    });
  }
  
  // Tier 2: Brand category search
  if (brand && productType) {
    queries.push({
      query: `site:${brand.toLowerCase().replace(/\s+/g, '')}.com men "${productType}"`,
      priority: 80,
      description: 'Brand category page'
    });
  }
  
  // Tier 3: General brand + product search
  if (brand && productType) {
    queries.push({
      query: `"${brand}" "${productType}" men buy`,
      priority: 70,
      description: 'General brand search'
    });
  }
  
  // Tier 4: Product type search with major retailers
  const majorRetailers = ['amazon.com', 'target.com', 'walmart.com', 'macys.com', 'nordstrom.com'];
  majorRetailers.forEach(retailer => {
    queries.push({
      query: `site:${retailer} "${productType}" men`,
      priority: 60,
      description: `Major retailer: ${retailer}`
    });
  });
  
  // Tier 5: Fallback Google search
  queries.push({
    query: `${productName} men buy`,
    priority: 10,
    description: 'Fallback Google search'
  });
  
  return queries;
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
  
  // Look for price constraints
  const priceMatch = lowerContext.match(/(under \$?\d+|less than \$?\d+|cheap|budget|affordable)/);
  if (priceMatch) {
    items.push(priceMatch[0]);
  }
  
  // Look for colors
  const colorMatch = lowerContext.match(/(white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange)/);
  if (colorMatch) {
    items.push(colorMatch[0]);
  }
  
  return items.length > 0 ? items : ['clothing'];
}

// Helper function to extract product names and brands from Jules's response for search
async function extractSearchTermsFromResponse(julesResponse) {
  const searchTerms = [];
  
  // Extract product names from the format **[Product Name]** - $XX
  const productRegex = /\*\*\[([^\]]+)\]\*\* - \$/g;
  let match;
  while ((match = productRegex.exec(julesResponse)) !== null) {
    searchTerms.push(match[1]); // Product name from the bold text
  }
  
  // Also try a simpler regex to catch any bold text that looks like product names
  const simpleBoldRegex = /\*\*([^*]+)\*\*/g;
  while ((match = simpleBoldRegex.exec(julesResponse)) !== null) {
    const text = match[1].trim();
    // Only add if it looks like a product name (contains brand names or is long enough)
    if (text.length > 5 && (text.includes(' ') || text.toLowerCase().includes('nike') || text.toLowerCase().includes('adidas'))) {
      searchTerms.push(text);
    }
  }
  
  // Debug: Log the full response to see the exact format
  console.log('DEBUG: Full Jules response for extraction:', julesResponse);
  
  // Also extract from regular bold text that looks like product names
  const boldTextRegex = /\*\*([^*]+)\*\*/g;
  while ((match = boldTextRegex.exec(julesResponse)) !== null) {
    const text = match[1].trim();
    // Only add if it looks like a product name (contains brand names or is long enough)
    if (text.length > 5 && (text.includes(' ') || text.toLowerCase().includes('nike') || text.toLowerCase().includes('adidas'))) {
      searchTerms.push(text);
    }
  }
  
  // Extract brands mentioned using AI (replaces hardcoded pattern)
  try {
    const brandExtractionPrompt = `Extract all clothing, fashion, and lifestyle brand names mentioned in this text. Focus on brands that make men's clothing, but don't exclude brands that make both men's and women's clothing.

Text: "${julesResponse}"

Examples of brands to extract: Nike, Adidas, Uniqlo, J.Crew, Lululemon, Common Projects, Red Wing, Thursday Boots, Patagonia, The North Face, Levi's, Rag & Bone, Bonobos, Everlane, Madewell, etc.

Only extract actual brand names, one per line, without any additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: brandExtractionPrompt }],
      max_tokens: 200,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    const aiBrands = response
      .split('\n')
      .map(brand => brand.trim())
      .filter(brand => brand.length > 0 && brand.length < 50)
      .map(brand => brand.toLowerCase())
      .filter((brand, index, arr) => arr.indexOf(brand) === index); // Remove duplicates
    
    if (aiBrands.length > 0) {
      searchTerms.push(...aiBrands);
      console.log('AI Brand Extraction: Found brands:', aiBrands);
    }
  } catch (error) {
    console.error('AI brand extraction failed, using fallback:', error.message);
    // Fallback to a minimal hardcoded list for essential brands only
    const essentialBrands = /(nike|adidas|converse|vans|uniqlo|patagonia|the north face|lululemon|j\.crew)/gi;
    const fallbackMatches = julesResponse.match(essentialBrands);
    if (fallbackMatches) {
      searchTerms.push(...fallbackMatches.map(brand => brand.toLowerCase()));
    }
  }
  
  console.log('DEBUG: Extracted search terms:', searchTerms);
  return [...new Set(searchTerms)]; // Remove duplicates
}

// Removed item type extraction - Jules will handle staying on topic naturally

function extractProductsFromJulesResponse(julesResponse) {
  // Extract product names from bold text format
  const productRegex = /\*\*([^*]+)\*\*\s*-\s*\$([\d,]+)/g;
  const extractedProducts = [];
  let match;
  
  while ((match = productRegex.exec(julesResponse)) !== null) {
    const productTitle = match[1].trim();
    
    // Filter out women's products
    const isWomensProduct = productTitle.toLowerCase().includes('high-rise') || 
                           productTitle.toLowerCase().includes('high rise') ||
                           productTitle.toLowerCase().includes('skinny') ||
                           productTitle.toLowerCase().includes('madewell') ||
                           productTitle.toLowerCase().includes('women') ||
                           productTitle.toLowerCase().includes('womens') ||
                           productTitle.toLowerCase().includes("women's") ||
                           // Filter out specific known women's jacket models (not the entire brand)
                           productTitle.toLowerCase().includes('allsaints balfern') ||
                           productTitle.toLowerCase().includes('allsaints rocco');
    
    // Only filter out women's products - Jules handles staying on topic
    if (!isWomensProduct) {
      extractedProducts.push({
        title: productTitle,
        link: '', // Will be filled by Google search
        price: `$${match[2]}`,
        image: '', // Will be filled by Google search
        description: '',
        brand: ''
      });
    }
  }
  
  console.log('DEBUG: Extracted products from Jules response (filtered for men\'s):', extractedProducts);
  return extractedProducts;
}

// Helper function to get product-specific personality prompt
async function getProductInstructions(message, userData = null) {
  console.log('🚨 DEBUG: getProductInstructions function called!');
  console.log('🚨 DEBUG: User data received:', userData ? 'Yes' : 'No');
  
  let userContext = '';
  
  if (userData) {
    const contexts = [];
    
    // Check onboarding data first (new system)
    if (userData.onboarding) {
      const onboarding = userData.onboarding;
      
      // Accessories preferences
      if (onboarding.wantMoreAccessories) {
        contexts.push(`Accessories preference: ${onboarding.wantMoreAccessories === 'No' ? 'Does NOT want more accessories' : 'Open to more accessories'}`);
      }
      
      if (onboarding.accessoriesWorn && onboarding.accessoriesWorn.length > 0) {
        contexts.push(`Currently wears: ${onboarding.accessoriesWorn.join(', ')}`);
      }
      
      // Style preferences
      if (onboarding.preferredStyles && onboarding.preferredStyles.length > 0) {
        contexts.push(`Preferred styles: ${onboarding.preferredStyles.join(', ')}`);
      }
      
      if (onboarding.colorsLove && onboarding.colorsLove.length > 0) {
        contexts.push(`Colors they love: ${onboarding.colorsLove.join(', ')}`);
      }
      
      if (onboarding.noGoItems && onboarding.noGoItems.length > 0) {
        contexts.push(`Items they avoid: ${onboarding.noGoItems.join(', ')}`);
      }
      
      // Budget
      if (onboarding.monthlyClothingBudget) {
        contexts.push(`Budget: ${onboarding.monthlyClothingBudget}`);
      }
      
      // Body info
      if (onboarding.bodyType) {
        contexts.push(`Body type: ${onboarding.bodyType}`);
      }
    }
    
    // Check legacy style preferences
    if (userData.stylePreferences?.brands?.length > 0) {
      contexts.push(`They like these brands: ${userData.stylePreferences.brands.join(', ')}`);
    }
    
    if (userData.stylePreferences?.budget) {
      contexts.push(`Their budget: ${userData.stylePreferences.budget}`);
    }
    
    if (contexts.length > 0) {
      userContext = `\n\nUSER CONTEXT:\n${contexts.join('\n')}`;
      console.log('🚨 DEBUG: User context built:', userContext);
    }
  }

  // Import and use Jules's authentic personality from chatController
  const { getSystemPrompt } = require('../controllers/chatController');
  
  // Get the base Jules personality (this will be async)
  let basePrompt = '';
  try {
    // For the test route, we'll use a default userId since we don't have one
    console.log('🔍 DEBUG: Attempting to get system prompt from chatController...');
    basePrompt = await getSystemPrompt(userData?._id || 'anonymous');
    console.log('✅ DEBUG: Successfully got system prompt from chatController');
    console.log('📊 DEBUG: Base prompt length:', basePrompt.length);
    console.log('🔍 DEBUG: Base prompt contains "Jules":', basePrompt.includes('Jules'));
    console.log('🔍 DEBUG: Base prompt contains "snarky":', basePrompt.includes('snarky'));
    console.log('🔍 DEBUG: Base prompt contains "flirty":', basePrompt.includes('flirty'));
    console.log('🔍 DEBUG: Base prompt contains "brutally honest":', basePrompt.includes('brutally honest'));
  } catch (error) {
    console.error('❌ DEBUG: Error getting system prompt from chatController:', error);
    // Fallback to a basic Jules personality if chatController fails
    basePrompt = `You are Jules — a confident, stylish, emotionally intelligent AI here to help men level up their dating, style, and social confidence. You speak like a clever, somewhat snarky, flirty, brutally honest older sister. Direct, sharp, and playful — never robotic.`;
    console.log('🔄 DEBUG: Using fallback personality');
  }
  
  const productSpecificInstructions = `

PRODUCT RECOMMENDATION MODE - CRITICAL FORMAT REQUIREMENTS:
- You MUST use this EXACT format for each product:
  **Product Name** - $XX
  - Why I love these: [Your opinion]
- Add TWO line breaks between each product
- ALWAYS recommend 2-3 specific products
- Be confident and specific - don't ask for clarification unless you have NO idea what they want
- Focus on men's clothing and accessories
- Use conversation context to recommend relevant items
- Be proactive: if someone asks for "white sneakers" - recommend specific white sneakers!

CRITICAL USER PREFERENCES TO RESPECT:
- If the user has said they don't want more accessories, DO NOT recommend rings, necklaces, bracelets, etc.
- If they have specific items they avoid (noGoItems), respect those preferences
- If they have a budget preference, stay within that range
- If they have preferred styles, lean into those rather than suggesting completely different aesthetics

CONTEXT AWARENESS: When the user asks for product recommendations, focus on the specific items they mentioned in the conversation. If they said "pull up links" after discussing specific items, recommend ONLY those items.

BACKGROUND: You're helping a male user with his style and wardrobe. When recommending products, naturally focus on men's clothing and accessories. Recommend men's jeans (straight fit, slim fit, regular fit, relaxed fit) rather than women's styles like mom jeans or high-rise cuts.

IMPORTANT: 
- Do NOT include links - just mention the product name in bold
- The system will automatically find real, working product links for you
- Only include your opinion in the "Why I love these" section
- Add TWO line breaks between your response and the product list
- Do NOT include "View Product" text - this will be handled by the UI
- Do NOT include "Add to Wishlist" text - this will be handled by the UI

EXAMPLE FORMAT:
White shoes are EVERYTHING right now! You're going to look so good in these!


**Nike Air Force 1 '07** - $100
- Why I love these: They're the perfect foundation for any outfit and they only get better with age


**Adidas Stan Smith** - $85
- Why I love these: The green accent gives them personality without being flashy


**Converse Chuck Taylor All Star** - $60
- Why I love these: The ultimate minimalist sneaker that goes with literally everything


You're going to rock these shoes!${userContext}

Current request: ${message}`;

  return basePrompt + productSpecificInstructions;
}

// POST /api/products - Get product recommendations with Jules's personality
router.post('/', auth, validateProductSearch, async (req, res) => {
  try {
    const { message, conversation, userId } = req.body;
    
    // Google API credentials for this route
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get user data if userId provided
    let userData = null;
    if (userId && userId !== 'anonymous' && userId !== 'test') {
      try {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userData = await User.findById(userId);
        }
      } catch (error) {
        console.log('User lookup error:', error.message);
      }
    }
    
    // Import and use Jules's authentic personality from chatController
    const { getSystemPrompt } = require('../controllers/chatController');
    
    // Get the base Jules personality (this will be async)
    let basePrompt = '';
    try {
      // For the test route, we'll use a default userId since we don't have one
      console.log('🔍 DEBUG: Attempting to get system prompt from chatController...');
      basePrompt = await getSystemPrompt(userData?._id || 'anonymous');
      console.log('✅ DEBUG: Successfully got system prompt from chatController');
      console.log('📊 DEBUG: Base prompt length:', basePrompt.length);
      console.log('🔍 DEBUG: Base prompt contains "Jules":', basePrompt.includes('Jules'));
      console.log('🔍 DEBUG: Base prompt contains "snarky":', basePrompt.includes('snarky'));
      console.log('🔍 DEBUG: Base prompt contains "flirty":', basePrompt.includes('flirty'));
      console.log('🔍 DEBUG: Base prompt contains "brutally honest":', basePrompt.includes('brutally honest'));
    } catch (error) {
      console.error('❌ DEBUG: Error getting system prompt from chatController:', error);
      // Fallback to a basic Jules personality if chatController fails
      basePrompt = `You are Jules — a confident, stylish, emotionally intelligent AI here to help men level up their dating, style, and social confidence. You speak like a clever, somewhat snarky, flirty, brutally honest older sister. Direct, sharp, and playful — never robotic.`;
      console.log('🔄 DEBUG: Using fallback personality');
    }
    
    // Generate Jules's response with personality
    const systemPrompt = await getProductInstructions(message, userData);
    
    // Build conversation context for better continuity
    let conversationContext = '';
    if (conversation && conversation.length > 0) {
      // Get the last few messages for context
      const recentMessages = conversation.slice(-6);
      console.log('DEBUG: Conversation context:', recentMessages);
      
      // Extract key information from conversation
      const conversationText = recentMessages.map(msg => msg.content).join(' ');
      const hasProductRequest = /shoes|sneakers|boots|shirt|jeans|pants|jacket|coat|sweater|hoodie|t-shirt|polo|henley|shorts|chinos|joggers|sweatpants|vest|waistcoat|loafers|vans|necklace|ring|earrings|bracelet|jewelry|pendant|chain|button-down|button down|buttonup|button-up/i.test(conversationText);
      const hasColorRequest = /white|black|blue|red|green|brown|gray|grey|navy|olive|tan|beige|cream|pink|purple|yellow|orange/i.test(conversationText);
      const isAskingForMore = /more|additional|other|different|show me|pull up|get|find/i.test(message.toLowerCase());
      
      conversationContext = '\n\nCONVERSATION CONTEXT (READ CAREFULLY):\n' + recentMessages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Jules'}: ${msg.content}`
      ).join('\n') + '\n\nCRITICAL INSTRUCTIONS:';
      
      if (isAskingForMore && hasProductRequest) {
        conversationContext += '\n- The user is asking for MORE options of the SAME type of product they previously requested';
        if (hasColorRequest) {
          conversationContext += '\n- Maintain the SAME color preference (e.g., if they asked for white shoes, recommend MORE white shoes)';
        }
        conversationContext += '\n- Do NOT recommend different product types - stay focused on their original request';
      }
      
      conversationContext += '\n- When the user asks for "more options" or "show me more", they want additional products of the SAME type they originally requested';
      conversationContext += '\n- Do NOT recommend generic items - only recommend specific products that match their original request';
      console.log('DEBUG: Conversation context string:', conversationContext);
    }
    
    // Build enhanced user message with context
    let enhancedMessage = message;
    if (conversation && conversation.length > 0) {
      const recentMessages = conversation.slice(-4);
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
    
    // Extract specific products from Jules's response
    const extractedProducts = extractProductsFromJulesResponse(julesResponse);
    console.log('DEBUG: Products extracted from Jules response:', extractedProducts);
    
    // Perform Google Custom Search for each specific product
    
    if (!apiKey || !cseId) {
      console.log('Missing Google API credentials - returning Jules response without products');
      // Return Jules's response without products for now
      return res.json({
        response: julesResponse,
        products: [],
        allProducts: [],
        hasProducts: false,
        hasMore: false,
        totalFound: 0
      });
    }
    
    let allProducts = [];
    
    // Search for each specific product Jules recommended
    for (const product of extractedProducts.slice(0, 3)) {
       const searchQuery = buildProductSearchQuery(product.title, message);
       console.log(`DEBUG: Searching for product "${product.title}": ${searchQuery}`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: cseId,
            q: searchQuery,
            num: 6, // Get more results to filter better
            safe: 'active',
          },
        });
        
        // Filter and process results for this specific product
        const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
        const excludedBrands = /men's\s*wearhouse|mens\s*wearhouse|men\s*wearhouse/i;
        
        const productResults = (response.data.items || [])
          .filter(item => !nonProductSites.test(item.link))
          .filter(item => !excludedBrands.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => {
            // Ensure the search result is relevant to the specific product
            const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
            const productName = product.title.toLowerCase();
            
            // Extract brand from product name (first word)
            const productBrand = product.title.split(' ')[0].toLowerCase();
            const itemBrand = item.title.split(' ')[0].toLowerCase();
            
            // Must match the brand
            const brandMatch = productBrand === itemBrand || 
                              itemText.includes(productBrand) || 
                              productName.includes(itemBrand);
            
            // Check if the search result contains key words from the product name
            const productWords = productName.split(' ').filter(word => word.length > 2);
            const hasRelevantWords = productWords.some(word => itemText.includes(word));
            
            return brandMatch && hasRelevantWords;
          })
          .filter(item => {
            // Exclude obvious non-product pages
            const url = item.link.toLowerCase();
            const title = item.title.toLowerCase();
            
            if (url.includes('/home') || 
                url.includes('/index') || 
                url.endsWith('.com/') || 
                url.endsWith('.com') ||
                title.includes('category') ||
                title.includes('shop all')) {
              return false;
            }
            
            // Accept any URL that looks like a product page and isn't a bad domain
            return url.includes('/') && !url.includes('/category/') && !url.includes('/home') && !isBadDomain(item.link);
          })
          .map(item => {
            // Add priority scoring for better link quality
            const url = item.link.toLowerCase();
            let priority = 0;
            
            // Extract brand from product name
            const productBrand = product.title.split(' ')[0].toLowerCase();
            const brandDomain = productBrand.replace(/\s+/g, '');
            
            // Highest priority: Brand official websites
            if (url.includes(`${brandDomain}.com`)) {
              priority = 100;
              console.log(`DEBUG: Found brand website for ${productBrand}: ${item.link} (priority: ${priority})`);
            }
            // High priority: Other brand websites
            else if (url.includes('uniqlo.com') || url.includes('gap.com') || url.includes('bananarepublic.com') || 
                     url.includes('oldnavy.com') || url.includes('hm.com') || url.includes('zara.com') ||
                     url.includes('nike.com') || url.includes('adidas.com') || url.includes('puma.com') ||
                     url.includes('allsaints.com') || url.includes('schottnyc.com')) {
              priority = 90;
              console.log(`DEBUG: Found other brand website: ${item.link} (priority: ${priority})`);
            }
            // Medium priority: Major retailers
            else if (url.includes('amazon.com') || url.includes('target.com') || url.includes('walmart.com') ||
                     url.includes('macys.com') || url.includes('nordstrom.com') || url.includes('dickssportinggoods.com')) {
              priority = 50;
              console.log(`DEBUG: Found major retailer: ${item.link} (priority: ${priority})`);
            }
            // Low priority: eBay and other marketplaces
            else if (url.includes('ebay.com')) {
              priority = 30;
              console.log(`DEBUG: Found eBay: ${item.link} (priority: ${priority})`);
            }
            // Very low priority: Other sites
            else {
              priority = 10;
              console.log(`DEBUG: Found other site: ${item.link} (priority: ${priority})`);
            }
            
            return { ...item, priority };
          })
          .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
          .slice(0, 1) // Get only the highest priority result
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
    
    console.log('DEBUG: Found total products:', allProducts.length);
    
    // Prepare response data
    const responseData = {
      response: julesResponse, // Include Jules's generated response
      products: allProducts.slice(0, 3), // First 3 products for initial display
      allProducts: allProducts, // All products for "show more"
      hasProducts: allProducts.length > 0,
      hasMore: allProducts.length > 3,
      totalFound: allProducts.length
    };
    
    // Cache the result
    const estimatedTokens = productCache.estimateTokensSaved(message, conversation);
    productCache.set(cacheKey, responseData, estimatedTokens);
    
    // Return Jules's response with products
    res.json(responseData);
    
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      error: 'Product search failed',
      products: [],
      allProducts: [],
      hasProducts: false,
      hasMore: false
    });
  }
});

// GET /api/products - Fallback route for proxy issues
router.get('/', auth, validatePagination, async (req, res) => {
  try {
    const { message, julesResponse } = req.query;
    
    if (!message || !julesResponse) {
      return res.status(400).json({ error: 'Message and Jules response are required' });
    }
    
    // Convert query string back to object for processing
    const requestBody = {
      message,
      julesResponse: julesResponse
    };
    
    // Use same product-based logic as POST route
    const extractedProducts = extractProductsFromJulesResponse(requestBody.julesResponse);
    console.log('DEBUG: Products extracted from Jules response (GET):', extractedProducts);
    
    if (extractedProducts.length === 0) {
      console.log('DEBUG: No products found in Jules response (GET), returning empty products');
      return res.json({
        products: [],
        allProducts: [],
        hasProducts: false,
        hasMore: false,
        totalFound: 0
      });
    }
    
    // Perform Google Custom Search for each specific product
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
      console.log('Missing Google API credentials - returning empty products');
      return res.json({
        products: [],
        allProducts: [],
        hasProducts: false,
        hasMore: false,
        totalFound: 0
      });
    }
    
    let allProducts = [];
    
    // Search for each specific product Jules recommended
    for (const product of extractedProducts.slice(0, 3)) {
      const searchQuery = buildProductSearchQuery(product.title, requestBody.message);
      console.log(`DEBUG: Searching for product "${product.title}" (GET): ${searchQuery}`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: cseId,
            q: searchQuery,
            num: 6, // Get more results to filter better
            safe: 'active',
          },
        });
        
        // Filter and process results for this specific product
        const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
        const excludedBrands = /men's\s*wearhouse|mens\s*wearhouse|men\s*wearhouse/i;
        
        const productResults = (response.data.items || [])
          .filter(item => !nonProductSites.test(item.link))
          .filter(item => !excludedBrands.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => {
            // Ensure the search result is relevant to the specific product
            const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
            const productName = product.title.toLowerCase();
            
            // Extract brand from product name (first word)
            const productBrand = product.title.split(' ')[0].toLowerCase();
            const itemBrand = item.title.split(' ')[0].toLowerCase();
            
            // Must match the brand
            const brandMatch = productBrand === itemBrand || 
                              itemText.includes(productBrand) || 
                              productName.includes(itemBrand);
            
            // Check if the search result contains key words from the product name
            const productWords = productName.split(' ').filter(word => word.length > 2);
            const hasRelevantWords = productWords.some(word => itemText.includes(word));
            
            return brandMatch && hasRelevantWords;
          })
          .filter(item => {
            // Exclude obvious non-product pages
            const url = item.link.toLowerCase();
            const title = item.title.toLowerCase();
            
            if (url.includes('/home') || 
                url.includes('/index') || 
                url.endsWith('.com/') || 
                url.endsWith('.com') ||
                title.includes('category') ||
                title.includes('shop all')) {
              return false;
            }
            
            // Accept any URL that looks like a product page and isn't a bad domain
            return url.includes('/') && !url.includes('/category/') && !url.includes('/home') && !isBadDomain(item.link);
          })
          .map(item => {
            // Add priority scoring for better link quality
            const url = item.link.toLowerCase();
            let priority = 0;
            
            // Extract brand from product name
            const productBrand = product.title.split(' ')[0].toLowerCase();
            const brandDomain = productBrand.replace(/\s+/g, '');
            
            // Highest priority: Brand official websites
            if (url.includes(`${brandDomain}.com`)) {
              priority = 100;
              console.log(`DEBUG: Found brand website for ${productBrand}: ${item.link} (priority: ${priority})`);
            }
            // High priority: Other brand websites
            else if (url.includes('uniqlo.com') || url.includes('gap.com') || url.includes('bananarepublic.com') || 
                     url.includes('oldnavy.com') || url.includes('hm.com') || url.includes('zara.com') ||
                     url.includes('nike.com') || url.includes('adidas.com') || url.includes('puma.com') ||
                     url.includes('allsaints.com') || url.includes('schottnyc.com')) {
              priority = 90;
              console.log(`DEBUG: Found other brand website: ${item.link} (priority: ${priority})`);
            }
            // Medium priority: Major retailers
            else if (url.includes('amazon.com') || url.includes('target.com') || url.includes('walmart.com') ||
                     url.includes('macys.com') || url.includes('nordstrom.com') || url.includes('dickssportinggoods.com')) {
              priority = 50;
              console.log(`DEBUG: Found major retailer: ${item.link} (priority: ${priority})`);
            }
            // Low priority: eBay and other marketplaces
            else if (url.includes('ebay.com')) {
              priority = 30;
              console.log(`DEBUG: Found eBay: ${item.link} (priority: ${priority})`);
            }
            // Very low priority: Other sites
            else {
              priority = 10;
              console.log(`DEBUG: Found other site: ${item.link} (priority: ${priority})`);
            }
            
            return { ...item, priority };
          })
          .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
          .slice(0, 1) // Get only the highest priority result
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
        console.error(`Error searching for product ${product.title} (GET):`, error.message);
        // Continue with other products if one fails
      }
    }
    
    console.log('DEBUG: Found total products (GET):', allProducts.length);
    
    // Return products
    res.json({
      products: allProducts.slice(0, 3), // First 3 products for initial display
      allProducts: allProducts, // All products for "show more"
      hasProducts: allProducts.length > 0,
      hasMore: allProducts.length > 3,
      totalFound: allProducts.length
    });
    
  } catch (error) {
    console.error('Product search error (GET):', error);
    res.status(500).json({
      error: 'Product search failed',
      products: [],
      allProducts: [],
      hasProducts: false,
      hasMore: false
    });
  }
});

// Cache stats endpoint
router.get('/cache-stats', (req, res) => {
  const stats = productCache.getStats();
  res.json({
    cache: stats,
    message: 'Product search cache statistics'
  });
});

// Clear cache endpoint
router.post('/clear-cache', (req, res) => {
  productCache.clear();
  res.json({
    message: 'Product search cache cleared successfully'
  });
});

// Test route without authentication
router.post('/test', async (req, res) => {
  try {
    const { message, conversation } = req.body;
    
    // Google API credentials for this route
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🚨 DEBUG: About to call getProductInstructions...');
    console.log('🚨 DEBUG: Message:', message);
    console.log('🚨 DEBUG: Conversation length:', conversation?.length || 0);
    
    // Check cache first
    const cacheKey = productCache.generateCacheKey(message, conversation);
    const cachedResult = productCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Returning cached product search result');
      return res.json(cachedResult);
    }
    
    console.log('💾 Cache miss - generating new product search result');
    
    // Get product instructions (now async)
    let systemPrompt;
    try {
      systemPrompt = await getProductInstructions(message);
      console.log('🚨 DEBUG: getProductInstructions completed, prompt length:', systemPrompt.length);
      console.log('🚨 DEBUG: Prompt contains "Jules":', systemPrompt.includes('Jules'));
      console.log('🚨 DEBUG: Prompt contains "snarky":', systemPrompt.includes('snarky'));
    } catch (error) {
      console.error('🚨 ERROR in getProductInstructions:', error);
      throw error;
    }
    
    // Build enhanced user message with context
    let enhancedMessage = message;
    if (conversation && conversation.length > 0) {
      const recentMessages = conversation.slice(-4);
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
                             title.includes('ladies') ||
                             // Filter out specific known women's jacket models (not the entire brand)
                             title.includes('allsaints balfern') ||
                             title.includes('allsaints rocco');
      return !isWomensProduct;
    });
    
    console.log('DEBUG: After filtering women\'s products:', mensProductsOnly);
    
    let allProducts = [];
    
    // If Jules provided specific products, use Google search to find real links
    if (mensProductsOnly.length > 0) {
      console.log('DEBUG: Jules provided products, searching for real links');
      
      if (!apiKey || !cseId) {
        console.log('Missing Google API credentials - returning Jules response without products');
        return res.json({
          response: julesResponse,
          products: [],
          allProducts: [],
          hasProducts: false,
          hasMore: false,
          totalFound: 0
        });
      }
      
      // Search for each product Jules recommended using tiered approach
      for (const product of mensProductsOnly) {
        const searchQueries = buildTieredSearchQueries(product.title, message);
        console.log(`DEBUG: Tiered search queries for "${product.title}":`, searchQueries.map(q => `${q.description}: ${q.query}`));
        
        let foundGoodResults = false;
        
        // Try each tier until we get good results
        for (const searchQueryObj of searchQueries) {
          if (foundGoodResults) break;
          
          console.log(`DEBUG: Trying ${searchQueryObj.description}: ${searchQueryObj.query}`);
          
          try {
            console.log(`🔍 API CALL: Making request to Google Custom Search API`);
            console.log(`🔍 API CALL: Query: "${searchQueryObj.query}"`);
            console.log(`🔍 API CALL: API Key: ${apiKey ? 'SET' : 'NOT SET'}`);
            console.log(`🔍 API CALL: CSE ID: ${cseId ? 'SET' : 'NOT SET'}`);
            
            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
              params: {
                key: apiKey,
                cx: cseId,
                q: searchQueryObj.query,
                num: 6,
                safe: 'active',
              },
            });
            
            console.log(`✅ API SUCCESS: Got ${(response.data.items || []).length} results for "${searchQueryObj.query}"`);
            if (response.data.items && response.data.items.length > 0) {
              console.log(`✅ API SUCCESS: First result: ${response.data.items[0].link}`);
              console.log(`✅ API SUCCESS: First result title: ${response.data.items[0].title}`);
            } else {
              console.log(`⚠️ API WARNING: No results returned for "${searchQueryObj.query}"`);
            }
          
          // Filter and process results for this product
          const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
          const excludedBrands = /men's\s*wearhouse|mens\s*wearhouse|men\s*wearhouse/i;
          
          const searchProducts = (response.data.items || [])
            .filter(item => !nonProductSites.test(item.link))
            .filter(item => !excludedBrands.test(item.title + ' ' + (item.snippet || '')))
            .filter(item => !isBadDomain(item.link)) // Filter out bad domains early
            .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
            .map(item => {
              // Add priority scoring for better link quality
              const url = item.link.toLowerCase();
              let priority = 0;
              
              // High priority: Brand official websites
              if (url.includes('uniqlo.com') || url.includes('gap.com') || url.includes('bananarepublic.com') || 
                  url.includes('oldnavy.com') || url.includes('hm.com') || url.includes('zara.com') ||
                  url.includes('nike.com') || url.includes('adidas.com') || url.includes('puma.com')) {
                priority = 100;
              }
              // Medium priority: Major retailers
              else if (url.includes('amazon.com') || url.includes('target.com') || url.includes('walmart.com') ||
                       url.includes('macys.com') || url.includes('nordstrom.com') || url.includes('dickssportinggoods.com')) {
                priority = 50;
              }
              // Low priority: Other sites
              else {
                priority = 10;
              }
              
              return { ...item, priority };
            })
            .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
            .filter(item => {
              // RELAXED filtering - prioritize men's clothing but don't exclude everything
              const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
              const url = item.link.toLowerCase();
              
              // Check for men's/mens indicators (preferred but not required)
              const hasMensIndicator = itemText.includes("men's") || 
                                      itemText.includes("mens") || 
                                      itemText.includes("men ") ||
                                      url.includes("/men/") ||
                                      url.includes("/mens/") ||
                                      url.includes("men-") ||
                                      url.includes("mens-");
              
              // Must NOT contain women's indicators (this is still strict)
              const isWomensFashion = itemText.includes("women's") || 
                                     itemText.includes("women") || 
                                     itemText.includes("female") || 
                                     itemText.includes("ladies") ||
                                     itemText.includes("girls") || 
                                     itemText.includes("womens") ||
                                     itemText.includes("woman") ||
                                     itemText.includes("her ") ||
                                     itemText.includes("she ") ||
                                     itemText.includes("miss ") ||
                                     itemText.includes("mrs ") ||
                                     itemText.includes("ms ") ||
                                     itemText.includes("model") || // Often indicates women's fashion photos
                                     itemText.includes("size guide") || // Often leads to women's sizing
                                     url.includes("/women/") ||
                                     url.includes("/womens/") ||
                                     url.includes("/female/") ||
                                     url.includes("/ladies/") ||
                                     url.includes("/girls/") ||
                                     url.includes("women-") ||
                                     url.includes("womens-") ||
                                     url.includes("female-") ||
                                     url.includes("ladies-") ||
                                     url.includes("girls-");
              
              // Accept if it doesn't have women's indicators (still strict about excluding women's)
              // This allows men's products even if they don't explicitly mention "men's"
              return !isWomensFashion;
            })
            .filter(item => {
              // Dynamic relevance check based on the actual product name
              const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
              const productName = product.title.toLowerCase();
              
              // Extract brand from product name (first word)
              const productBrand = product.title.split(' ')[0].toLowerCase();
              const itemBrand = item.title.split(' ')[0].toLowerCase();
              
              // Check for brand match (preferred but not required)
              const brandMatch = productBrand === itemBrand || 
                                itemText.includes(productBrand) || 
                                productName.includes(itemBrand);
              
              // Check if the search result contains key words from the product name
              const productWords = productName.split(' ').filter(word => word.length > 2);
              const hasRelevantWords = productWords.some(word => itemText.includes(word));
              
              // Accept if it has relevant words OR if it matches the brand
              // This is more flexible - allows products that are relevant even without exact brand match
              return hasRelevantWords || brandMatch;
            })
            .filter(item => {
              // Basic URL filtering - exclude obvious non-product pages and bad domains
              const url = item.link.toLowerCase();
              const title = item.title.toLowerCase();
              
              // Exclude obvious non-product pages
              if (url.includes('/home') || 
                  url.includes('/index') || 
                  url.endsWith('.com/') || 
                  url.endsWith('.com') ||
                  title.includes('category') ||
                  title.includes('shop all')) {
                return false;
              }
              
              // Reject URLs that look like tracking/redirect URLs (like realendpoints.com)
              if (url.includes('?x=') && url.includes('&mod=') && url.includes('&uri=')) {
                return false;
              }
              
              // Accept URLs that have a path and aren't bad domains
              return url.includes('/') && !isBadDomain(url);
            })
            .slice(0, 1) // Get only 1 match per product to avoid duplicates
            .map((item, index) => {
              // Generate smarter, more reliable links
              const brand = product.title.split(' ')[0].toLowerCase();
              let smartLink = item.link;
              
              // For brand websites, prefer category pages over specific products
              if (item.link.includes('uniqlo.com')) {
                smartLink = 'https://www.uniqlo.com/us/en/men/bottoms/chinos';
              } else if (item.link.includes('gap.com')) {
                smartLink = 'https://www.gap.com/browse/category.do?cid=1000001&mlink=5001,1,0,Men_Clothing_Chinos,Men_Clothing_Chinos';
              } else if (item.link.includes('oldnavy.com')) {
                smartLink = 'https://oldnavy.gap.com/browse/category.do?cid=1000001&mlink=5001,1,0,Men_Clothing_Chinos,Men_Clothing_Chinos';
              } else if (item.link.includes('bananarepublic.com')) {
                smartLink = 'https://bananarepublic.gap.com/browse/category.do?cid=1000001&mlink=5001,1,0,Men_Clothing_Chinos,Men_Clothing_Chinos';
              } else if (item.link.includes('levis.com')) {
                smartLink = 'https://www.levi.com/US/en_US/category/men/clothing/pants/chinos';
              } else if (item.link.includes('amazon.com')) {
                // For Amazon, use a search link instead of specific product
                const searchTerm = encodeURIComponent(product.title + ' men');
                smartLink = `https://www.amazon.com/s?k=${searchTerm}&ref=sr_pg_1`;
              }
              
              return {
                title: product.title,
                link: smartLink,
                image: item.pagemap?.cse_image?.[0]?.src || '',
                price: product.price,
                description: item.snippet || '',
                brand: product.title.split(' ')[0] // Use first word as brand
              };
            });
          
          allProducts.push(...searchProducts);
          
        } catch (error) {
          console.error(`❌ API ERROR: Failed to search for "${product.title}"`);
          console.error(`❌ API ERROR: Error message: ${error.message}`);
          console.error(`❌ API ERROR: Error code: ${error.code || 'N/A'}`);
          console.error(`❌ API ERROR: Error response: ${error.response?.data ? JSON.stringify(error.response.data) : 'N/A'}`);
          console.error(`❌ API ERROR: Full error:`, error);
        }
      }
      
      // Deduplicate products based on title to avoid duplicates
      const seenTitles = new Set();
      allProducts = allProducts.filter(product => {
        const normalizedTitle = product.title.toLowerCase().trim();
        if (seenTitles.has(normalizedTitle)) {
          return false;
        }
        seenTitles.add(normalizedTitle);
        return true;
      });
      
      console.log('DEBUG: Found total products:', allProducts.length);
      
      // If we don't have enough products, add fallback products with generic links
      if (allProducts.length < mensProductsOnly.length) {
        console.log('DEBUG: Not enough products found, adding fallback products...');
        
        for (let i = allProducts.length; i < mensProductsOnly.length; i++) {
          const product = mensProductsOnly[i];
          const brand = product.title.split(' ')[0];
          
          // Add a fallback product with a generic search link
          const fallbackProduct = {
            title: product.title,
            link: `https://www.google.com/search?q=${encodeURIComponent(product.title + ' men buy online')}`,
            image: '',
            price: product.price,
            description: `Shop for ${product.title} online`,
            brand: brand
          };
          
          allProducts.push(fallbackProduct);
          console.log(`DEBUG: Added fallback product for "${product.title}"`);
        }
      }
    }
    
    // Fallback to Google search if Jules didn't provide specific products
    const searchTerms = await extractSearchTermsFromResponse(julesResponse);
    const brands = await extractBrandsFromResponse(julesResponse);
    console.log('DEBUG: Fallback - search terms extracted from Jules response:', searchTerms);
    console.log('DEBUG: Fallback - brands extracted from Jules response:', brands);
    
    if (!apiKey || !cseId) {
      console.log('Missing Google API credentials - returning Jules response without products');
      return res.json({
        response: julesResponse,
        products: [],
        allProducts: [],
        hasProducts: false,
        hasMore: false,
        totalFound: 0
      });
    }
    
    // Search for specific products mentioned in Jules's response
    for (const searchTerm of searchTerms.slice(0, 3)) {
      const searchQuery = `${searchTerm} men buy`;
      console.log(`DEBUG: Searching for "${searchTerm}": ${searchQuery}`);
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: apiKey,
            cx: cseId,
            q: searchQuery,
            num: 6, // Get more results to filter better
            safe: 'active',
          },
        });
        
        // Filter and process results for this search term
        const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
        const excludedBrands = /men's\s*wearhouse|mens\s*wearhouse|men\s*wearhouse/i;
        
        const searchProducts = (response.data.items || [])
          .filter(item => !nonProductSites.test(item.link))
          .filter(item => !excludedBrands.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => !isBadDomain(item.link)) // Filter out bad domains early
          .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
          .filter(item => {
            // RELAXED filtering - prioritize men's clothing but don't exclude everything
            const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
            const url = item.link.toLowerCase();
            
            // Check for men's/mens indicators (preferred but not required)
            const hasMensIndicator = itemText.includes("men's") || 
                                    itemText.includes("mens") || 
                                    itemText.includes("men ") ||
                                    url.includes("/men/") ||
                                    url.includes("/mens/") ||
                                    url.includes("men-") ||
                                    url.includes("mens-");
            
            // Must NOT contain women's indicators (this is still strict)
            const isWomensFashion = itemText.includes("women's") || 
                                   itemText.includes("women") || 
                                   itemText.includes("female") || 
                                   itemText.includes("ladies") ||
                                   itemText.includes("girls") || 
                                   itemText.includes("womens") ||
                                   url.includes("/women/") ||
                                   url.includes("/womens/") ||
                                   url.includes("women-") ||
                                   url.includes("womens-");
            
            // Accept if it doesn't have women's indicators (still strict about excluding women's)
            // This allows men's products even if they don't explicitly mention "men's"
            return !isWomensFashion;
          })
          .filter(item => {
            // Ensure the item is actually related to the search term
            const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
            return itemText.includes(searchTerm.toLowerCase());
          })
          .filter(item => {
            // Exclude homepage links - only allow specific product pages
            const url = item.link.toLowerCase();
            const title = item.title.toLowerCase();
            
            // Exclude category pages and homepages
            if (url.includes('/home') || 
                url.includes('/index') || 
                url.endsWith('.com/') || 
                url.endsWith('.com') ||
                url.includes('/category/') ||
                title.includes('category') ||
                title.includes('shop all') ||
                title.includes('browse')) {
              return false;
            }
            
            // Must have a path and be a product page - relaxed filtering
            return url.includes('/') && !isBadDomain(url) && (
              // Accept any URL that looks like a product page
              url.includes('/product/') || 
              url.includes('/p/') || 
              url.includes('/item/') || 
              url.includes('/shoes/') || 
              url.includes('/clothing/') ||
              url.includes('/mens/') ||
              url.includes('/men/') ||
              url.includes('/sneakers/') ||
              url.includes('/footwear/') ||
              // Accept any URL that has a path and isn't obviously a homepage/category
              (url.includes('/') && !url.endsWith('.com/') && !url.endsWith('.com')) ||
              // Accept any URL with product-like patterns
              url.includes('/buy/') ||
              url.includes('/shop/') ||
              url.includes('/style/') ||
              url.includes('/collection/') ||
              // Accept URLs with product IDs or SKUs (common patterns)
              /\/([a-z0-9-]+-[a-z0-9-]+|[a-z0-9]{6,})\//i.test(url)
            );
          })
          .slice(0, 2) // Limit to 2 products per search term
          .map((item, index) => ({
            title: item.title || `${searchTerm} Product ${index + 1}`,
            link: item.link,
            image: item.pagemap?.cse_image?.[0]?.src || '',
            price: item.pagemap?.offer?.[0]?.price || '',
            description: item.snippet || '',
            brand: searchTerm
          }));
        
        allProducts.push(...searchProducts);
        
      } catch (error) {
        console.error(`Error searching for "${searchTerm}":`, error.message);
        // Continue with other search terms if one fails
      }
    }
    
    // If no specific products found, fall back to brand-based search
    if (allProducts.length === 0) {
      const recommendedBrands = await extractBrandsFromResponse(julesResponse);
      console.log('DEBUG: Fallback - brands extracted from Jules response:', recommendedBrands);
      
      for (const brand of recommendedBrands.slice(0, 2)) {
        const searchQuery = `${brand} men buy`;
        console.log(`DEBUG: Fallback search for brand "${brand}": ${searchQuery}`);
        
        try {
          const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
              key: apiKey,
              cx: cseId,
              q: searchQuery,
              num: 6,
              safe: 'active',
            },
          });
          
          const nonProductSites = /youtube\.com|youtu\.be|reddit\.com|instagram\.com|facebook\.com|twitter\.com|tiktok\.com|pinterest\.com|blog|article|news|review|quora|economist|medium|substack|linkedin|tumblr|fairfie/i;
          const excludedBrands = /men's\s*wearhouse|mens\s*wearhouse|men\s*wearhouse/i;
          
          const brandProducts = (response.data.items || [])
            .filter(item => !nonProductSites.test(item.link))
            .filter(item => !excludedBrands.test(item.title + ' ' + (item.snippet || '')))
            .filter(item => !isBadDomain(item.link)) // Filter out bad domains early
            .filter(item => /shop|store|buy|product|item|clothing|apparel|fashion/i.test(item.title + ' ' + (item.snippet || '')))
            .filter(item => {
              const itemText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
              return itemText.includes(brand.toLowerCase());
            })
            .filter(item => {
              // Exclude homepage links - only allow specific product pages
              const url = item.link.toLowerCase();
              const title = item.title.toLowerCase();
              
              // Exclude category pages and homepages
              if (url.includes('/home') || 
                  url.includes('/index') || 
                  url.endsWith('.com/') || 
                  url.endsWith('.com') ||
                  url.includes('/category/') ||
                  title.includes('category') ||
                  title.includes('shop all') ||
                  title.includes('browse')) {
                return false;
              }
              
              // Must have a path and be a product page - relaxed filtering
              return url.includes('/') && !isBadDomain(url) && (
                // Accept any URL that looks like a product page
                url.includes('/product/') || 
                url.includes('/p/') || 
                url.includes('/item/') || 
                url.includes('/shoes/') || 
                url.includes('/clothing/') ||
                url.includes('/mens/') ||
                url.includes('/men/') ||
                url.includes('/sneakers/') ||
                url.includes('/footwear/') ||
                // Accept any URL that has a path and isn't obviously a homepage/category
                (url.includes('/') && !url.endsWith('.com/') && !url.endsWith('.com')) ||
                // Accept any URL with product-like patterns
                url.includes('/buy/') ||
                url.includes('/shop/') ||
                url.includes('/style/') ||
                url.includes('/collection/') ||
                // Accept URLs with product IDs or SKUs (common patterns)
                /\/([a-z0-9-]+-[a-z0-9-]+|[a-z0-9]{6,})\//i.test(url)
              );
            })
            .slice(0, 2)
            .map((item, index) => ({
              title: item.title || `${brand} Product ${index + 1}`,
              link: item.link,
              image: item.pagemap?.cse_image?.[0]?.src || '',
              price: item.pagemap?.offer?.[0]?.price || '',
              description: item.snippet || '',
              brand: brand
            }));
          
          allProducts.push(...brandProducts);
          
        } catch (error) {
          console.error(`Error searching for brand ${brand}:`, error.message);
        }
      }
      
      // Deduplicate products based on title to avoid duplicates
      const seenTitles = new Set();
      allProducts = allProducts.filter(product => {
        const normalizedTitle = product.title.toLowerCase().trim();
        if (seenTitles.has(normalizedTitle)) {
          return false;
        }
        seenTitles.add(normalizedTitle);
        return true;
      });
    }
  }    
    console.log('DEBUG: Found total products:', allProducts.length);
    
    // Prepare response data
    const responseData = {
      response: julesResponse, // Include Jules's generated response
      products: allProducts.slice(0, 3), // First 3 products for initial display
      allProducts: allProducts, // All products for "show more"
      hasProducts: allProducts.length > 0,
      hasMore: allProducts.length > 3,
      totalFound: allProducts.length
    };
    
    // Cache the result
    const estimatedTokens = productCache.estimateTokensSaved(message, conversation);
    productCache.set(cacheKey, responseData, estimatedTokens);
    
    // Return Jules's response with products
    res.json(responseData);
    
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      error: 'Product search failed',
      products: [],
      allProducts: [],
      hasProducts: false,
      hasMore: false
    });
  }
});

// Proxy route for product images to avoid CORS issues
router.get('/proxy-image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Map image IDs to actual product image URLs
    const imageMap = {
      'nike-fleece': 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c5678f4-c28d-4862-a8d9-56750f839f12/sportswear-club-fleece-pullover-hoodie-1VnMpz.png',
      'uniqlo-jacket': 'https://image.uniqlo.com/UQ/ST3/us/imagesgoods/459244/item/usgoods_69_459244.jpg',
      'lululemon-define': 'https://images.lululemon.com/is/image/lululemon/LU9A52S_04769_1',
      'schott-leather': 'https://www.schottnyc.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/p/e/perfecto_618_black_1.jpg',
      'uniqlo-tshirt': 'https://image.uniqlo.com/UQ/ST3/us/imagesgoods/455305/item/usgoods_69_455305.jpg',
      'nike-drifit': 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c5678f4-c28d-4862-a8d9-56750f839f12/dri-fit-training-t-shirt-1VnMpz.png',
      'lululemon-vent': 'https://images.lululemon.com/is/image/lululemon/LU9A52S_04769_1',
      'vans-tshirt': 'https://images.vans.com/is/image/VansBrand/classic-t-shirt-black-1',
      'uniqlo-jeans': 'https://image.uniqlo.com/UQ/ST3/us/imagesgoods/455305/item/usgoods_69_455305.jpg',
      'nike-pants': 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c5678f4-c28d-4862-a8d9-56750f839f12/dri-fit-training-pants-1VnMpz.png',
      'lululemon-abc': 'https://images.lululemon.com/is/image/lululemon/LU9A52S_04769_1',
      'vans-chino': 'https://images.vans.com/is/image/VansBrand/classic-chino-pants-black-1',
      'nike-af1': 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c5678f4-c28d-4862-a8d9-56750f839f12/air-force-1-07-shoe-1VnMpz.png',
      'vans-oldskool': 'https://images.vans.com/is/image/VansBrand/old-skool-black-white-1',
      'uniqlo-sneakers': 'https://image.uniqlo.com/UQ/ST3/us/imagesgoods/455305/item/usgoods_69_455305.jpg',
      'common-projects': 'https://www.commonprojects.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/a/c/achilles-low-white-1.jpg',
      'nike-hat': 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/7c5678f4-c28d-4862-a8d9-56750f839f12/heritage-hat-1VnMpz.png',
      'vans-backpack': 'https://images.vans.com/is/image/VansBrand/classic-backpack-black-1',
      'uniqlo-tote': 'https://image.uniqlo.com/UQ/ST3/us/imagesgoods/455305/item/usgoods_69_455305.jpg',
      'lululemon-bag': 'https://images.lululemon.com/is/image/lululemon/LU9A52S_04769_1'
    };
    
    const imageUrl = imageMap[imageId];
    if (!imageUrl) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Fetch the image from the retailer
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the image data
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

module.exports = router; 