const express = require('express');
const router = express.Router();
const axios = require('axios');
const pinterestTokenManager = require('../utils/pinterestTokenManager');

// Dynamic configuration - no hardcoded values
const config = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.INSPIRATION_MAX_TOKENS) || 600,
    temperature: parseFloat(process.env.INSPIRATION_TEMPERATURE) || 0.7
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    cseId: process.env.GOOGLE_CSE_ID,
    numResults: parseInt(process.env.GOOGLE_NUM_RESULTS) || 8,
    imgSize: process.env.GOOGLE_IMG_SIZE || 'large',
    imgType: process.env.GOOGLE_IMG_TYPE || 'photo'
  },
  pinterest: {
    clientId: process.env.PINTEREST_CLIENT_ID,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET,
    accessToken: process.env.PINTEREST_ACCESS_TOKEN,
    refreshToken: process.env.PINTEREST_REFRESH_TOKEN,
    numResults: parseInt(process.env.PINTEREST_NUM_RESULTS) || 20
  },
  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
    numResults: parseInt(process.env.UNSPLASH_NUM_RESULTS) || 20,
    orientation: 'portrait' // Better for fashion photos
  },
  filtering: {
    minImageWidth: parseInt(process.env.MIN_IMAGE_WIDTH) || 400,
    minImageHeight: parseInt(process.env.MIN_IMAGE_HEIGHT) || 400,
    maxImagesReturned: parseInt(process.env.MAX_IMAGES_RETURNED) || 4
  },
  bannedPhrases: process.env.BANNED_PHRASES ? process.env.BANNED_PHRASES.split(',') : [
    'Oh darling', 'darling', 'fashion gods', 'gods', 'Not to worry', 'don\'t worry', 'fear not',
    'effortlessly', 'screams style', 'that look is classic', 'timeless classic',
    'imagine a sleek silhouette', 'imagine yourself', 'picture yourself', 'envision',
    'elevate your style', 'elevate your look', 'step up your game', 'level up',
    'make a statement', 'make waves', 'turn heads', 'get noticed',
    'confidence booster', 'confidence builder', 'versatile piece', 'versatile option',
    'investment piece', 'wardrobe staple', 'sophisticated elegance', 'refined style',
    'polished look', 'polished appearance'
  ]
};

// Dynamic function to extract outfit pieces using AI
async function extractOutfitPieces(context, userMessage) {
  if (!context || context.length === 0) return [];
  
  try {
    // Prioritize the current user message over context
    const prompt = `Extract the key clothing items and style elements from this user request. Focus on what they specifically asked for.

User Request: "${userMessage}"

Recent conversation context:
${context.slice(-3).map(msg => msg.content).join('\n')}

Extract ONLY the specific clothing items, colors, and style elements that the user is asking for. Return as a simple comma-separated list, no explanations.

Examples:
- User: "Show me inspiration for dark jeans and a button-up shirt" → "dark jeans, button-up shirt"
- User: "I need some style inspiration" → "casual outfit, style inspiration"
- User: "Show me some looks" → "outfit inspiration, style looks"

Return only the items they're asking for, not generic advice.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim();
    
    if (extractedText) {
      const outfitPieces = extractedText.split(',').map(item => item.trim()).filter(item => item.length > 0);
      console.log('DEBUG: AI extracted outfit pieces from user request:', outfitPieces);
      return outfitPieces;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting outfit pieces with AI:', error);
    return [];
  }
}

// Dynamic clothing type extraction from context (from working version)
function extractClothingTypeFromContext(message, context) {
  // Check if this is a general trends request
  const isTrendsRequest = message.toLowerCase().includes('trends') || message.toLowerCase().includes('trend');
  
  // First try to extract from current message
  let clothingType = extractClothingType(message);
  console.log(`DEBUG: Clothing type from message: ${clothingType}`);
  
  // If this is a trends request and no specific clothing type found, keep it as 'style'
  if (isTrendsRequest && clothingType === 'style') {
    console.log('DEBUG: General trends request detected - keeping as style');
    return 'style';
  }
  
  // If no clothing type found in current message, look in conversation context
  if (clothingType === 'style' && context && context.length > 0) {
    // Look through context messages in reverse order (most recent first)
    for (let i = context.length - 1; i >= 0; i--) {
      const msg = context[i];
      console.log(`DEBUG: Checking message ${i}: ${msg.content.substring(0, 100)}...`);
      
      // Check for color + clothing combinations dynamically
      const colors = [
        'olive green', 'light blue', 'dark blue', 'forest green', 'emerald green', 'royal blue', 'navy blue',
        'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey',
        'navy', 'olive', 'beige', 'cream', 'tan', 'burgundy', 'maroon', 'coral', 'teal', 'turquoise', 'lime',
        'gold', 'silver', 'bronze', 'copper', 'rose', 'lavender', 'mint', 'sage', 'forest', 'emerald', 'royal',
        'light', 'dark', 'bright', 'muted', 'pastel', 'neon', 'vintage', 'faded', 'distressed'
      ];
      
      const clothingItems = [
        'pants', 'jeans', 'shorts', 'chinos', 'khakis', 'trousers', 'leggings', 'joggers',
        'shirt', 'tshirt', 't-shirt', 'tee', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'blazer',
        'coat', 'vest', 'cardigan', 'sweatshirt', 'dress', 'skirt', 'shoes', 'sneakers', 'boots',
        'loafers', 'sandals', 'heels', 'flats', 'hat', 'cap', 'scarf', 'belt', 'bag', 'purse'
      ];
      
      // Look for color + clothing combinations in context
      // Check longer color names first to avoid partial matches
      const sortedColors = colors.sort((a, b) => b.length - a.length); // Sort by length descending
      
      for (const color of sortedColors) {
        for (const item of clothingItems) {
          const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'i');
          if (pattern.test(msg.content)) {
            clothingType = `${color} ${item}`;
            console.log(`DEBUG: Found color + clothing combination from message ${i}: ${clothingType}`);
            return clothingType;
          }
        }
      }
      
      // Check for specific clothing items that don't follow color + item pattern
      const specificItems = [
        'crew neck', 'crewneck', 'v-neck', 'button up', 'button-up', 'denim shirt',
        'leather jacket', 'bomber jacket', 'suit jacket', 'trench coat', 'sport coat'
      ];
      
      for (const item of specificItems) {
        if (msg.content.toLowerCase().includes(item)) {
          clothingType = item;
          console.log(`DEBUG: Found specific clothing item from message ${i}: ${clothingType}`);
          return clothingType;
        }
      }
      
      // Extract all clothing types from this message - check multi-word first, then single words
      const multiWordMatches = [...msg.content.matchAll(/(smart casual|business casual|dress shirt|casual shirt|button down|button up|denim shirt|leather jacket|trench coat|sport coat|crew neck|v-neck|t-shirt|streetwear|ath leasure)/gi)];
      const singleWordMatches = [...msg.content.matchAll(/(jacket|jackets|bomber|peacoat|overcoat|blazer|coat|vest|cardigan|sweater|hoodie|sweatshirt|shirt|tshirt|polo|flannel|chambray|linen|oxford|poplin|henley|pants|jeans|chinos|khakis|denim|shoes|sneakers|boots|loafers|vans|converse|nike|adidas|dress|top|bottom|outfit|style|look|formal|casual|dressy|elegant|sophisticated|laid back|relaxed|chic|trendy|classic|modern|vintage|minimalist)/gi)];

      const allMatches = [...multiWordMatches, ...singleWordMatches];
      
      if (allMatches.length > 0) {
        // Prioritize specific clothing types over generic ones
        const specificTypes = ['smart casual', 'business casual', 'jacket', 'jackets', 'leather jacket', 'bomber', 'peacoat', 'trench coat', 'overcoat', 'blazer', 'sport coat', 'coat', 'vest', 'cardigan', 'sweater', 'hoodie', 'sweatshirt', 'shirt', 't-shirt', 'tshirt', 'polo', 'dress shirt', 'casual shirt', 'button down', 'button up', 'denim shirt', 'flannel', 'chambray', 'linen', 'oxford', 'poplin', 'henley', 'crew neck', 'v-neck', 'pants', 'jeans', 'chinos', 'khakis', 'denim', 'shoes', 'sneakers', 'boots', 'loafers', 'vans', 'converse', 'nike', 'adidas', 'dress', 'formal', 'casual', 'dressy', 'elegant', 'sophisticated', 'laid back', 'relaxed', 'chic', 'trendy', 'classic', 'modern', 'vintage', 'minimalist'];

        
        // Find the first specific type in this message
        for (const match of allMatches) {
          const matchedType = match[1].toLowerCase();
          if (specificTypes.includes(matchedType)) {
            clothingType = matchedType;
            console.log(`DEBUG: Found specific clothing type from message ${i}: ${clothingType}`);
            return clothingType;
          }
        }
        
        // If no specific type found in this message, use the first match
        clothingType = allMatches[0][1].toLowerCase();
        console.log(`DEBUG: Using first clothing type from message ${i}: ${clothingType}`);
        return clothingType;
      }
    }
  }
  
  return clothingType;
}

// Helper function to extract clothing type from message
function extractClothingType(message) {
  const messageLower = message.toLowerCase();
  
  // First, try to match color + clothing combinations dynamically
  const colors = [
    'olive green', 'light blue', 'dark blue', 'forest green', 'emerald green', 'royal blue', 'navy blue',
    'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey',
    'navy', 'olive', 'beige', 'cream', 'tan', 'burgundy', 'maroon', 'coral', 'teal', 'turquoise', 'lime',
    'gold', 'silver', 'bronze', 'copper', 'rose', 'lavender', 'mint', 'sage', 'forest', 'emerald', 'royal',
    'light', 'dark', 'bright', 'muted', 'pastel', 'neon', 'vintage', 'faded', 'distressed'
  ];
  
  const clothingItems = [
    'pants', 'jeans', 'shorts', 'chinos', 'khakis', 'trousers', 'leggings', 'joggers',
    'shirt', 'tshirt', 't-shirt', 'tee', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'blazer',
    'coat', 'vest', 'cardigan', 'sweatshirt', 'dress', 'skirt', 'shoes', 'sneakers', 'boots',
    'loafers', 'sandals', 'heels', 'flats', 'hat', 'cap', 'scarf', 'belt', 'bag', 'purse'
  ];
  
  // Look for color + clothing combinations (e.g., "orange pants", "red shirt", "blue jeans")
  // Check longer color names first to avoid partial matches
  const sortedColors = colors.sort((a, b) => b.length - a.length); // Sort by length descending
  
  for (const color of sortedColors) {
    for (const item of clothingItems) {
      const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'i');
      if (pattern.test(message)) {
        return `${color} ${item}`;
      }
    }
  }
  
  // Check for specific clothing items that don't follow color + item pattern
  const specificItems = [
    'crew neck', 'crewneck', 'v-neck', 'button up', 'button-up', 'denim shirt',
    'leather jacket', 'bomber jacket', 'suit jacket', 'trench coat', 'sport coat'
  ];
  
  for (const item of specificItems) {
    if (messageLower.includes(item)) {
      return item;
    }
  }
  
  // Check for multi-word style descriptors
  const multiWordMatches = message.match(/(smart casual|business casual|dress shirt|casual shirt|button down|button up|denim shirt|leather jacket|trench coat|sport coat|crew neck|v-neck|t-shirt|street wear|ath leasure)/i);

  if (multiWordMatches) {
    return multiWordMatches[1];
  }
  
  // Then check for single word clothing types
  const clothingMatches = message.match(/(jacket|jackets|bomber|peacoat|overcoat|blazer|coat|vest|cardigan|sweater|hoodie|sweatshirt|shirt|tshirt|polo|flannel|chambray|linen|oxford|poplin|henley|pants|jeans|chinos|khakis|denim|shoes|sneakers|boots|loafers|vans|converse|nike|adidas|dress|top|bottom|outfit|style|look|formal|casual|dressy|elegant|sophisticated|laid back|relaxed|chic|trendy|classic|modern|vintage|minimalist)/i);

  return clothingMatches ? clothingMatches[1] : 'style';
}

// Extract specific outfit pieces from Jules's advice (from working version)
function extractOutfitPiecesFromAdvice(context) {
  if (!context || context.length === 0) return { outfitPieces: [], styleDescriptors: [] };
  
  const outfitPieces = [];
  const contextText = context.map(msg => msg.content).join(' ').toLowerCase();
  
  console.log(`DEBUG: Extracting outfit pieces from context: "${contextText.substring(0, 200)}..."`);
  
  // Extract clothing items dynamically from context
  const clothingKeywords = [
    'suit', 'jacket', 'blazer', 'shirt', 'pants', 'jeans', 'chinos', 'shoes', 'sneakers', 'boots', 'loafers',
    'dress', 'outfit', 'top', 'bottom', 'accessories', 'tie', 'belt', 'watch'
  ];
  
  const recommendedItems = [];
  
  // Look for clothing items mentioned in context
  for (const keyword of clothingKeywords) {
    if (contextText.includes(keyword)) {
      recommendedItems.push(keyword);
    }
  }
  
  for (const item of recommendedItems) {
    if (contextText.includes(item)) {
      outfitPieces.push(item);
      console.log(`DEBUG: Found recommended item: ${item}`);
    }
  }
  
  // PRIORITY 2: Look for color + clothing combinations
  const colors = [
    'olive green', 'light blue', 'dark blue', 'forest green', 'emerald green', 'royal blue', 'navy blue',
    'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey',
    'navy', 'olive', 'beige', 'cream', 'tan', 'burgundy', 'maroon', 'coral', 'teal', 'turquoise', 'lime',
    'gold', 'silver', 'bronze', 'copper', 'rose', 'lavender', 'mint', 'sage', 'forest', 'emerald', 'royal',
    'light', 'dark', 'bright', 'muted', 'pastel', 'neon', 'vintage', 'faded', 'distressed'
  ];
  
  const clothingItems = [
    'pants', 'jeans', 'shorts', 'chinos', 'khakis', 'trousers', 'leggings', 'joggers',
    'shirt', 'tshirt', 't-shirt', 'tee', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'blazer',
    'coat', 'vest', 'cardigan', 'sweatshirt', 'dress', 'skirt', 'shoes', 'sneakers', 'boots',
    'loafers', 'sandals', 'heels', 'flats', 'hat', 'cap', 'scarf', 'belt', 'bag', 'purse'
  ];
  
  // Look for color + clothing combinations in context
  // Check longer color names first to avoid partial matches
  const sortedColors = colors.sort((a, b) => b.length - a.length); // Sort by length descending
  
  for (const color of sortedColors) {
    for (const item of clothingItems) {
      const pattern = new RegExp(`\\b${color}\\s+${item}\\b`, 'gi');
      const matches = contextText.match(pattern);
      if (matches) {
        outfitPieces.push(...matches);
        console.log(`DEBUG: Found color + item combination: ${matches.join(', ')}`);
      }
    }
  }
  
  // PRIORITY 3: Check for specific clothing items that don't follow color + item pattern
  const specificItems = [
    'crew neck', 'crewneck', 'v-neck', 'button up', 'button-up', 'button up shirt', 'button-up shirt', 'denim shirt',
    'leather jacket', 'bomber jacket', 'suit jacket', 'trench coat', 'sport coat',
    'well-fitted jeans', 'dark jeans', 'fitted jeans', 'slim jeans',
    'pattern shirt', 'textured shirt', 'rolled sleeves', 'oversized shirt'
  ];
  
  // Add specific items found in context
  for (const item of specificItems) {
    if (contextText.includes(item)) {
      outfitPieces.push(item);
      console.log(`DEBUG: Found specific item: ${item}`);
    }
  }
  
  // PRIORITY 4: If no specific items found, then look for general clothing items
  if (outfitPieces.length === 0) {
    const clothingItems = [
      'shorts', 'jeans', 'pants', 'chinos', 'khakis',
      't-shirt', 'tshirt', 'tee', 'shirt', 'button-up', 'button up', 'henley', 'polo',
      'sneakers', 'shoes', 'boots', 'sandals', 'vans', 'converse',
      'jacket', 'blazer', 'cardigan', 'sweater', 'hoodie',
      'hat', 'cap', 'sunglasses'
    ];
    
    for (const item of clothingItems) {
      if (contextText.includes(item)) {
        outfitPieces.push(item);
        console.log(`DEBUG: Found general item: ${item}`);
      }
    }
  }
  
  // Look for style descriptors
  const styleDescriptors = [];
  if (contextText.includes('baggy') || contextText.includes('baggier')) styleDescriptors.push('baggy');
  if (contextText.includes('fitted') || contextText.includes('slim')) styleDescriptors.push('fitted');
  if (contextText.includes('casual')) styleDescriptors.push('casual');
  if (contextText.includes('relaxed')) styleDescriptors.push('relaxed');
  if (contextText.includes('clean')) styleDescriptors.push('clean');
  if (contextText.includes('polished')) styleDescriptors.push('polished');
  
  console.log(`DEBUG: Final outfit pieces: ${outfitPieces.join(', ')}`);
  console.log(`DEBUG: Final style descriptors: ${styleDescriptors.join(', ')}`);
  
  return { outfitPieces, styleDescriptors };
}

// Generate Jules's response with personality and context awareness (from working version)
async function generateJulesResponse(message, clothingType, context = null, userId = 'test') {
  let contextInfo = '';
  let occasion = '';
  let stylePreference = '';
  
  if (context && context.length > 0) {
    // Focus on the most recent user message for context
    const userMessages = context.filter(msg => msg.role === 'user');
    const mostRecentUserMessage = userMessages[userMessages.length - 1];
    const contextText = mostRecentUserMessage ? mostRecentUserMessage.content : context.map(msg => msg.content).join(' ');

    
    contextInfo = `\n\nMOST RECENT USER REQUEST: ${contextText}\n\nThe user is asking for examples of ${clothingType} based on this request.`;

    
    // Extract context for better responses from the most recent message
    const contextLower = contextText.toLowerCase();
    
    // Extract occasion from the most recent user message
    if (contextLower.includes('wedding') || contextLower.includes('marriage') || contextLower.includes('ceremony')) {
      occasion = 'wedding';
    } else if (contextLower.includes('job interview') || contextLower.includes('interview')) {
      occasion = 'job interview';
    } else if (contextLower.includes('concert') || contextLower.includes('show') || contextLower.includes('music')) {
      occasion = 'concert';
    } else if (contextLower.includes('coffee date') || contextLower.includes('coffee')) {
      occasion = 'coffee date';
    } else if (contextLower.includes('dinner date') || contextLower.includes('dinner')) {
      occasion = 'dinner date';
    } else if (contextLower.includes('night out') || contextLower.includes('bar')) {
      occasion = 'night out';
    } else if (contextLower.includes('work') || contextLower.includes('office')) {
      occasion = 'work';
    } else if (contextLower.includes('casual') || contextLower.includes('weekend')) {
      occasion = 'casual';
    }
    
    // Extract style preference
    if (contextLower.includes('smart casual')) {
      stylePreference = 'smart casual';
    } else if (contextLower.includes('formal') || contextLower.includes('dressy')) {
      stylePreference = 'formal';
    } else if (contextLower.includes('casual')) {
      stylePreference = 'casual';
    } else if (contextLower.includes('baggy') || contextLower.includes('baggier')) {
      stylePreference = 'relaxed';
    } else if (contextLower.includes('fitted') || contextLower.includes('slim')) {
      stylePreference = 'fitted';
    }
  }

  const isTrendsRequest = message.toLowerCase().includes('trends') || message.toLowerCase().includes('trend');
  const isInspirationRequest = message.toLowerCase().includes('inspiration');
  const isImageRequest = message.toLowerCase().includes('image') || message.toLowerCase().includes('show') || message.toLowerCase().includes('picture') || message.toLowerCase().includes('photo') || message.toLowerCase().includes('pic');

  // Use the proper system prompt from chatController
  const { getSystemPrompt } = require('../controllers/chatController');
  const systemPrompt = await getSystemPrompt(userId);
  
  // Add inspiration-specific context
  const inspirationContext = `\n\nINSPIRATION MODE: The user is asking for MEN'S outfit inspiration. Give specific, contextual recommendations for men's fashion based on the occasion. Remember to maintain Jules's snarky, direct personality - don't sound like a customer service agent. Be witty, specific, and give real talk about what works and what doesn't.\n\nCurrent request: ${message}${contextInfo}`;

  // IMPROVEMENT: Add specific context for trip requests
  let additionalContext = '';
  if (message.toLowerCase().includes('trip') || message.toLowerCase().includes('travel')) {
    if (message.toLowerCase().includes('sf') || message.toLowerCase().includes('san francisco')) {
      additionalContext = `\n\nTRIP CONTEXT: The user is asking for outfit inspiration for a trip to San Francisco with friends. Focus on casual, comfortable outfits that work well for walking around the city, exploring, and hanging out with friends. Consider SF's weather (can be cool/foggy) and the casual, tech-friendly vibe of the city. Give specific, actionable advice about what actually works for SF weather and activities.`;
    } else if (message.toLowerCase().includes('vacation') || message.toLowerCase().includes('holiday')) {
      additionalContext = `\n\nTRIP CONTEXT: The user is asking for outfit inspiration for a vacation/trip. Focus on comfortable, versatile outfits that work well for travel and exploring. Be specific about what actually works for travel vs what looks good but isn't practical.`;
    } else {
      additionalContext = `\n\nTRIP CONTEXT: The user is asking for outfit inspiration for a trip. Focus on comfortable, versatile outfits that work well for travel. Give real talk about what's practical vs what just looks good in photos.`;
    }
  }

  // Build messages array with full conversation context
  const messages = [
    { role: 'system', content: systemPrompt + inspirationContext + additionalContext }
  ];
  
  // Add conversation context if available
  if (context && context.length > 0) {
    // Add the last few messages for context (limit to avoid token limits)
    const recentContext = context.slice(-4); // Last 4 messages
    recentContext.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }
  
  // Add current user message
  messages.push({ role: 'user', content: message });

  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: config.openai.model,
    messages: messages,
    max_tokens: config.openai.maxTokens,
    temperature: config.openai.temperature
  });

  let response = completion.choices[0].message.content;
  
  // Clean and format the response
  response = stripClosers(response);
  response = formatResponse(response);
  
  return response;
}

// Function to strip unwanted closers from AI responses (from working version)
function stripClosers(text) {
  if (!text) return text;
  
  // Remove emojis
  text = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

  
  // Remove common AI closers and banned phrases
  const closers = [
    /hope this helps/i,
    /let me know if you need anything else/i,
    /feel free to ask if you have more questions/i,
    /hope that helps/i,
    /you're all set/i,
    /got any more style questions\? just ask/i,
    /crush that date with confidence/i,
    /if you need more tips/i,
    /enjoy getting drinks/i,
    /have a fantastic time on the date/i,
    /cheers to creating something awesome/i,
    /effortlessly stylish/i,
    /effortlessly cool/i,
    /effortlessly chic/i,
    /effortlessly fashionable/i,
    /effortlessly trendy/i,
    /effortlessly put together/i,
    /effortlessly polished/i,
    /effortlessly sophisticated/i,
    /effortlessly elegant/i,
    /effortlessly refined/i,
    /effortlessly dapper/i,
    /effortlessly sharp/i,
    /effortlessly handsome/i,
    /effortlessly attractive/i,
    /effortlessly appealing/i,
    /effortlessly alluring/i,
    /effortlessly magnetic/i,
    /effortlessly irresistible/i,
    /effortlessly stunning/i,
    /effortlessly gorgeous/i,
    /effortlessly beautiful/i,
    /effortlessly perfect/i,
    /effortlessly flawless/i,
    /effortlessly impeccable/i,
    /effortlessly spotless/i,
    /effortlessly pristine/i,
    /effortlessly immaculate/i,
    /effortlessly clean/i,
    /effortlessly neat/i,
    /effortlessly tidy/i,
    /effortlessly organized/i,
    /effortlessly structured/i,
    /effortlessly balanced/i,
    /effortlessly harmonious/i,
    /effortlessly cohesive/i,
    /effortlessly unified/i,
    /effortlessly integrated/i,
    /effortlessly seamless/i,
    /effortlessly smooth/i,
    /effortlessly fluid/i,
    /effortlessly natural/i,
    /effortlessly organic/i,
    /effortlessly authentic/i,
    /effortlessly genuine/i,
    /effortlessly real/i,
    /effortlessly honest/i,
    /effortlessly true/i,
    /effortlessly pure/i,
    /effortlessly simple/i,
    /effortlessly basic/i,
    /effortlessly minimal/i,
    /effortlessly clean/i,
    /effortlessly fresh/i,
    /effortlessly crisp/i,
    /effortlessly sharp/i,
    /effortlessly defined/i,
    /effortlessly clear/i,
    /effortlessly obvious/i,
    /effortlessly apparent/i,
    /effortlessly visible/i,
    /effortlessly noticeable/i,
    /effortlessly prominent/i,
    /effortlessly striking/i,
    /effortlessly bold/i,
    /effortlessly confident/i,
    /effortlessly assured/i,
    /effortlessly certain/i,
    /effortlessly definite/i,
    /effortlessly clear/i,
    /effortlessly obvious/i,
    /effortlessly apparent/i,
    /effortlessly evident/i,
    /effortlessly plain/i,
    /effortlessly straightforward/i,
    /effortlessly direct/i,
    /effortlessly honest/i,
    /effortlessly candid/i,
    /effortlessly frank/i,
    /effortlessly blunt/i,
    /effortlessly upfront/i,
    /effortlessly open/i,
    /effortlessly transparent/i
  ];
  
  closers.forEach(closer => {
    text = text.replace(closer, '');
  });
  
  return text.trim();
}

function formatResponse(text) {
  // FIX: Keep natural paragraph structure
  let formattedText = text;
  
  // Only clean up excessive line breaks, preserve paragraph structure
  formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
  
  // Clean up multiple spaces within lines
  formattedText = formattedText.replace(/[ ]+/g, ' ');
  
  return formattedText.trim();
}

// Search Google for fashion inspiration images
async function searchGoogleImages(searchQuery, apiKey, cseId) {
  try {
    console.log(`DEBUG: Searching Google for: "${searchQuery}"`);
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cseId,
        q: searchQuery,
        searchType: 'image',
        num: 16,
        safe: 'active',
        imgSize: 'large',
        imgType: 'photo'
      },
    });

    console.log(`DEBUG: Raw Google response has ${response.data.items?.length || 0} items`);
    console.log(`DEBUG: First item structure:`, JSON.stringify(response.data.items?.[0], null, 2));
    
    const googleImages = (response.data.items || [])
      .filter(item => {
        const hasLink = !!item.link;
        const hasImage = !!item.image;
        console.log(`DEBUG: Item has link: ${hasLink}, has image: ${hasImage}`);
        return item.link && item.image;
      })
      .filter(item => {
        const title = (item.title || '').toLowerCase();
        const snippet = (item.snippet || '').toLowerCase();
        const url = (item.link || '').toLowerCase();
        const allText = `${title} ${snippet} ${url}`;
        
        // Filter out women's fashion
        const isWomensFashion = allText.includes("women's") || allText.includes("female") ||
                               allText.includes("woman") || allText.includes("ladies") ||
                               allText.includes("women") || allText.includes("girl") ||
                               allText.includes("she") || allText.includes("her") ||
                               allText.includes("dress") || allText.includes("skirt") ||
                               allText.includes("blouse") || allText.includes("heels") ||
                               allText.includes("purse") || allText.includes("handbag") ||
                               allText.includes("makeup") || allText.includes("beauty");
        
        // Ensure we get men's fashion content - make this less restrictive
        const isMensFashion = allText.includes("men") || allText.includes("male") || 
                             allText.includes("guy") || allText.includes("dude") ||
                             allText.includes("men's") || allText.includes("male") ||
                             title.includes("men") || title.includes("male") ||
                             snippet.includes("men") || snippet.includes("male") ||
                             allText.includes("jeans") || allText.includes("shirt") ||
                             allText.includes("button-up") || allText.includes("button up") ||
                             allText.includes("pants") || allText.includes("outfit") ||
                             allText.includes("style") || allText.includes("fashion") ||
                             allText.includes("casual") || allText.includes("style"); // Allow more general fashion content
        
        // Filter out product shots and shopping sites
        const isProductShot = url.includes("shop") || url.includes("store") || 
                             url.includes("buy") || url.includes("product") ||
                             title.includes("product") || title.includes("shop") ||
                             url.includes("thursdayboots") || url.includes("nordstrom") ||
                             url.includes("nordstrommedia") || url.includes("etsy") || 
                             url.includes("amazon") || url.includes("cdn.shop") || 
                             url.includes("shopify") || url.includes("cdn/shop") || 
                             url.includes("shop/files") || url.includes("files/") ||
                             title.includes("buy") || title.includes("shop") ||
                             snippet.includes("buy") || snippet.includes("shop");
        
        // Filter out blog articles
        const isBlog = url.includes("blog") || url.includes("article") || 
                      url.includes("post") || url.includes("guide") ||
                      title.includes("blog") || title.includes("article") ||
                      title.includes("how to") || title.includes("guide");
        
        // Filter out small images
        const isTooSmall = item.image && (item.image.width < 400 || item.image.height < 400);
        
        // Filter out low quality images
        const isLowQuality = title.includes("stock") || title.includes("placeholder") ||
                            title.includes("template") || title.includes("mockup") ||
                            title.includes("icon") || title.includes("logo") ||
                            url.includes("stock") || url.includes("placeholder") ||
                            url.includes("template") || url.includes("mockup");
        
        // Temporarily disable strict filtering to test
        return true; // Accept all images for testing
      })
      .map((item, index) => ({
        id: index + 1,
        title: item.title || `Fashion Inspiration ${index + 1}`,
        image: item.link,
        thumbnail: item.image?.thumbnailLink || item.image?.link,
        width: item.image?.width || 500,
        height: item.image?.height || 500,
        source: 'Google Images',
        description: item.snippet || ''
      }))
      .slice(0, config.filtering.maxImagesReturned);

    console.log(`DEBUG: Google returned ${googleImages.length} images`);
    return googleImages;

  } catch (error) {
    console.error('Google API error:', error.message);
    return [];
  }
}

// Search Pinterest for fashion inspiration images
async function searchPinterestImages(searchQuery) {
  try {
    // Get a valid access token (automatically refreshes if needed)
    const accessToken = await pinterestTokenManager.getAccessToken();
    
    if (!accessToken) {
      console.log('DEBUG: No Pinterest access token available');
      return [];
    }

    console.log(`DEBUG: Searching Pinterest for: "${searchQuery}"`);
    
    // Search Pinterest pins using v5 API
    const response = await axios.get('https://api.pinterest.com/v5/pins', {
      params: {
        query: searchQuery,
        page_size: config.pinterest.numResults,
        bookmark: ''
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const pinterestImages = (response.data.items || [])
      .filter(item => item.media && item.media.images && item.media.images.original)
      .map((item, index) => ({
        id: index + 1,
        title: item.title || item.description || `Fashion Inspiration ${index + 1}`,
        image: item.media.images.original.url,
        thumbnail: item.media.images.thumbnail?.url || item.media.images.original.url,
        width: item.media.images.original.width || 500,
        height: item.media.images.original.height || 500,
        source: 'Pinterest',
        description: item.description || '',
        link: item.link || '',
        board: item.board?.name || ''
      }))
      .slice(0, config.filtering.maxImagesReturned);

    console.log(`DEBUG: Pinterest returned ${pinterestImages.length} images`);
    return pinterestImages;

  } catch (error) {
    console.error('Pinterest API error:', error.message);
    if (error.response?.status === 401) {
      console.log('DEBUG: Pinterest token expired, attempting refresh...');
      try {
        await pinterestTokenManager.refreshAccessToken();
        // Retry the search with new token
        return await searchPinterestImages(searchQuery);
      } catch (refreshError) {
        console.error('Failed to refresh Pinterest token:', refreshError.message);
      }
    }
    return [];
  }
}

// Dynamic search query building using AI
async function buildSearchQuery(outfitPieces, userMessage, context) {
  try {
    const recentMessages = context.slice(-3);
    const contextText = recentMessages.map(msg => msg.content).join('\n');
    
    const prompt = `Based on this conversation context and the extracted outfit pieces, create a simple, effective search query for finding relevant style inspiration images.

Context:
${contextText}

Extracted outfit pieces: ${outfitPieces.join(', ')}

Create a search query that will find inspirational MALE style photos (NOT product shots). Focus on:
- The specific fit and style mentioned (e.g., "well-fitted", "clean lines", "not skin-tight")
- The exact clothing items and colors mentioned
- The occasion or setting if mentioned
- Avoid styles that contradict the advice (e.g., if advice says "clean lines", avoid "ripped" or "distressed")

IMPORTANT REQUIREMENTS:
- Must include "men" to ensure male fashion
- Must include "outfit" or "style" to avoid product shots
- Must include specific items mentioned (e.g., "dark jeans", "button-up shirt")
- Must include "clean" or "well-fitted" to avoid distressed items

Examples of good queries:
- "men dark jeans button-up shirt outfit style clean fit"
- "men casual sophisticated dark jeans button-up jacket outfit"
- "men San Francisco night out dark jeans button-up clean style"
- "men relaxed fit jeans button-up shirt sophisticated outfit"

Return only the search query, no explanations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.3
      })
    });

    const data = await response.json();
    let searchQuery = data.choices?.[0]?.message?.content?.trim();
    
    // Remove quotes if the AI added them
    if (searchQuery && searchQuery.startsWith('"') && searchQuery.endsWith('"')) {
      searchQuery = searchQuery.slice(1, -1);
    }
    
    if (searchQuery) {
      console.log('DEBUG: AI generated search query:', searchQuery);
      return searchQuery;
    }
    
    // Fallback if AI fails
    if (outfitPieces.length > 0) {
      const pieces = outfitPieces.slice(0, 3).join(' '); // Use fewer pieces
      return `men ${pieces} outfit style clean fit`;
    }
    
    return "men casual sophisticated outfit style clean fit";
  } catch (error) {
    console.error('Error building search query with AI:', error);
    // Fallback if AI fails
    if (outfitPieces.length > 0) {
      const pieces = outfitPieces.slice(0, 4).join(' ');
      return `men ${pieces} outfit style clean fit`;
    }
    return "men casual sophisticated outfit style clean fit";
  }
}

// Main inspiration search route
router.post('/search', async (req, res) => {
  try {
    const { message, context, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract outfit pieces from context using AI
    const outfitPieces = await extractOutfitPieces(context, message);
    
    // Build search query using AI
    const searchQuery = await buildSearchQuery(outfitPieces, message, context);
    
    // Search for images
    let images = [];
    
    if (config.pinterest.accessToken) {
      console.log(`DEBUG: Using Pinterest for image search`);
      images = await searchPinterestImages(searchQuery);
    } else if (config.google.apiKey && config.google.cseId) {
      console.log(`DEBUG: Using Google as fallback for image search`);
      images = await searchGoogleImages(searchQuery);
    }
    
    // Generate Jules's response
    const julesResponse = await generateJulesResponse(message, context, images, userId);
    
    res.json({
      response: julesResponse,
      images: images,
      hasImages: images.length > 0
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      response: 'Sorry, I\'m having trouble finding inspiration right now.',
      images: [],
      hasImages: false
    });
  }
});

// Test route without authentication
router.post('/test', async (req, res) => {
  console.log('DEBUG: Test endpoint called');
  console.log('DEBUG: Request body:', req.body);
  console.log('DEBUG: Environment variables check:');
  console.log('DEBUG: GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET');
  console.log('DEBUG: GOOGLE_CSE_ID:', process.env.GOOGLE_CSE_ID ? 'SET' : 'NOT SET');
  

  try {
    const { message, context, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract clothing type from message and conversation context
    const clothingType = extractClothingTypeFromContext(message, context);
    console.log(`DEBUG: Clothing type extracted: ${clothingType} (from message: "${message}")`);
    console.log(`DEBUG: Raw clothing type: "${clothingType}"`);
    
    // Check if user is asking for specific clothing items mentioned in context
    let specificClothingRequest = '';
    if (context && context.length > 0) {
      const contextText = context.map(msg => msg.content).join(' ').toLowerCase();
      
      // Look for specific clothing items that were discussed
      const clothingItems = ['olive green pants', 'olive pants', 'green pants', 'black pants', 'blue pants', 'white pants', 'jeans', 'shorts', 'shirt', 'tee', 'sweater', 'jacket', 'blazer', 'sneakers', 'boots', 'shoes'];

      
      for (const item of clothingItems) {
        if (contextText.includes(item)) {
          specificClothingRequest = item;
          console.log(`DEBUG: Found specific clothing request: ${specificClothingRequest}`);
          break;
        }
      }
    }
    
    // Build highly specific and context-aware search queries
    
    // Extract specific outfit pieces from Jules's advice
    const { outfitPieces, styleDescriptors } = extractOutfitPiecesFromAdvice(context);
    console.log(`DEBUG: Extracted outfit pieces: ${outfitPieces.join(', ')}`);
    console.log(`DEBUG: Extracted style descriptors: ${styleDescriptors.join(', ')}`);
    console.log(`DEBUG: Outfit pieces length: ${outfitPieces.length}`);
    console.log(`DEBUG: Style descriptors length: ${styleDescriptors.length}`);
    
    // Build search query directly based on what we extracted
    let searchQuery = "men casual outfit"; // Default fallback
    
    if (outfitPieces.length > 0) {
      const specificItems = outfitPieces.slice(0, 3).join(" ");
      searchQuery = `men ${specificItems} casual outfit street style inspiration`;
      console.log(`DEBUG: Built specific search query: "${searchQuery}"`);
    } else if (message.toLowerCase().includes('jeans') && message.toLowerCase().includes('shirt')) {
      searchQuery = "men dark jeans button-up shirt casual outfit street style inspiration";
      console.log(`DEBUG: Built jeans+shirt search query: "${searchQuery}"`);
    } else {
      searchQuery = "men casual outfit";
      console.log(`DEBUG: Built fallback search query: "${searchQuery}"`);
    }
    
    // Check for specific context in the conversation
    let occasion = '';
    let stylePreference = '';
    
    if (context && context.length > 0) {
      // Look for occasion and style context in the MOST RECENT user message first
      const userMessages = context.filter(msg => msg.role === 'user');
      const mostRecentUserMessage = userMessages[userMessages.length - 1];
      const contextText = mostRecentUserMessage ? mostRecentUserMessage.content.toLowerCase() : '';
      
      console.log(`DEBUG: Analyzing most recent user message: "${contextText}"`);
      
      // Extract occasion - be more comprehensive and prioritize specific occasions
      console.log(`DEBUG: Extracting occasion from context: "${contextText.substring(0, 100)}..."`);
      
      if (contextText.includes('wedding') || contextText.includes('marriage') || contextText.includes('ceremony')) {
        occasion = 'wedding';
        console.log(`DEBUG: Found occasion: wedding`);
      } else if (contextText.includes('coffee date') || contextText.includes('coffee')) {
        occasion = 'coffee date';
        console.log(`DEBUG: Found occasion: coffee date`);
      } else if (contextText.includes('dinner date') || contextText.includes('dinner')) {
        occasion = 'dinner date';
        console.log(`DEBUG: Found occasion: dinner date`);
      } else if (contextText.includes('concert') || contextText.includes('show') || contextText.includes('music')) {
        occasion = 'concert';
        console.log(`DEBUG: Found occasion: concert`);
      } else if (contextText.includes('night out') || contextText.includes('bar')) {
        occasion = 'night out';
        console.log(`DEBUG: Found occasion: night out`);
      } else if (contextText.includes('work') || contextText.includes('office')) {
        occasion = 'work';
        console.log(`DEBUG: Found occasion: work`);
      } else if (contextText.includes('casual') || contextText.includes('weekend')) {
        occasion = 'casual';
        console.log(`DEBUG: Found occasion: casual`);
      }
      
      // Extract style preference
      if (contextText.includes('smart casual')) {
        stylePreference = 'smart casual';
      } else if (contextText.includes('formal') || contextText.includes('dressy')) {
        stylePreference = 'formal';
      } else if (contextText.includes('casual')) {
        stylePreference = 'casual';
      } else if (contextText.includes('baggy') || contextText.includes('baggier')) {
        stylePreference = 'relaxed';
      } else if (contextText.includes('fitted') || contextText.includes('slim')) {
        stylePreference = 'fitted';
      }
    }
    
    // Additional context-based search query refinement
    if (context && context.length > 0) {
      // Override search query based on specific context if needed
      if (occasion === 'work' || occasion === 'office') {
        searchQuery = "men work office outfit style inspiration";
      } else if (occasion === 'casual' || occasion === 'weekend') {
        // Don't override the specific search query we already built
        if (!searchQuery || searchQuery === "men's fashion outfit" || searchQuery.includes("men's fashion")) {
          searchQuery = "men casual outfit";
        }
      }
      
      console.log(`DEBUG: Context - occasion: "${occasion}", style: "${stylePreference}"`);
      console.log(`DEBUG: Final search query: "${searchQuery}"`);

    } else if (specificClothingRequest) {
      // If user is asking for specific clothing items mentioned in context
      searchQuery = `men's fashion ${specificClothingRequest} outfit`;
      console.log(`DEBUG: Using specific clothing request query: "${searchQuery}"`);
    } else if (clothingType && clothingType !== 'style') {
      // If we have a specific clothing type, search for that specifically
      searchQuery = `men's fashion ${clothingType} outfit`;
      console.log(`DEBUG: Using clothing type query: "${searchQuery}"`);
    } else {
      // Build dynamic search query based on actual conversation context
      const queryParts = ["men's fashion"];
      
      // Add occasion if detected from context
      if (occasion) {
        queryParts.push(occasion);
      }
      
      // Add clothing type if available
      if (clothingType && clothingType !== 'outfit') {
        queryParts.push(clothingType);
      }
      
      // Add style preference if detected
      if (stylePreference) {
        queryParts.push(stylePreference);
      }
      
      // Add "outfit" to make it clear we want complete looks
      queryParts.push("outfit");
      
      searchQuery = queryParts.join(' ');
    }
    
    // IMPROVEMENT: Make search query shorter to avoid 400 errors
    // If user asks for specific items, make the search more targeted
    if (message.toLowerCase().includes('dark jeans') && message.toLowerCase().includes('button-up shirt')) {
      searchQuery = "men dark jeans shirt";
    } else if (message.toLowerCase().includes('jeans') && message.toLowerCase().includes('shirt')) {
      searchQuery = "men jeans shirt";
    } else if (message.toLowerCase().includes('pants') && message.toLowerCase().includes('shirt')) {
      searchQuery = "men pants shirt";
    }
    
    // IMPROVEMENT: Handle trip-specific requests
    if (message.toLowerCase().includes('trip') || message.toLowerCase().includes('travel')) {
      if (message.toLowerCase().includes('sf') || message.toLowerCase().includes('san francisco')) {
        searchQuery = "men jeans shirt San Francisco";
      } else if (message.toLowerCase().includes('vacation') || message.toLowerCase().includes('holiday')) {
        searchQuery = "men jeans shirt casual";
      } else {
        searchQuery = "men jeans shirt casual";
      }
    }
    
    // IMPROVEMENT: Handle occasion-specific requests
    if (message.toLowerCase().includes('date') || message.toLowerCase().includes('dinner')) {
      searchQuery = "men date night outfit style inspiration";
    } else if (message.toLowerCase().includes('work') || message.toLowerCase().includes('office')) {
      searchQuery = "men work office outfit style inspiration";
    } else if (message.toLowerCase().includes('casual') || message.toLowerCase().includes('weekend')) {
      // Don't override the specific search query we already built
      if (!searchQuery || searchQuery === "men's fashion outfit" || searchQuery.includes("men's fashion")) {
        searchQuery = "men casual outfit";
      }
    }
    
    console.log(`DEBUG: Context - occasion: "${occasion}", style: "${stylePreference}"`);
    console.log(`DEBUG: Searching for style inspiration: "${searchQuery}"`);
    
    // Fix context-aware responses for common cases before AI generation
    let julesResponse;
    console.log(`DEBUG: Checking conditions - message includes 'examples': ${message.toLowerCase().includes('examples')}, clothingType: ${clothingType}, clothingType !== 'style': ${clothingType !== 'style'}`);

    
    // Check if this is an inspiration request without context
    const isInspirationRequest = message.toLowerCase().includes('inspiration');
    const hasContext = context && context.length > 0;
    const isImageRequest = message.toLowerCase().includes('image') || message.toLowerCase().includes('show') || message.toLowerCase().includes('picture') || message.toLowerCase().includes('photo') || message.toLowerCase().includes('pic');

    
    // If asking for images and we have context, give direct response with images
    if (isImageRequest && hasContext) {
      console.log('DEBUG: Image request with context - giving direct response');

      // Always use context-aware response generation instead of hardcoded responses
      julesResponse = await generateJulesResponse(message, clothingType, context, userId);

      console.log('DEBUG: Generated Jules response for images:', julesResponse.substring(0, 200) + '...');

      // Strip unwanted closers
      julesResponse = stripClosers(julesResponse);
    } else if (isInspirationRequest && !hasContext) {
      console.log('DEBUG: Inspiration request without context - providing direct response with images');
      // For direct inspiration requests, provide images immediately
      julesResponse = await generateJulesResponse(message, clothingType, context, userId);
      console.log('DEBUG: Generated Jules response for direct inspiration:', julesResponse.substring(0, 200) + '...');

      
      // Strip unwanted closers
      julesResponse = stripClosers(julesResponse);
    } else if (message.toLowerCase().includes('examples') || message.toLowerCase().includes('show me') || message.toLowerCase().includes('pictures') || message.toLowerCase().includes('images')) {
      console.log('DEBUG: Using AI-generated response for image requests');
      // Generate Jules's response with personality and shopping offer
      julesResponse = await generateJulesResponse(message, clothingType, context, userId);
      console.log('DEBUG: Generated Jules response for images:', julesResponse.substring(0, 200) + '...');
      
      // Strip unwanted closers
      julesResponse = stripClosers(julesResponse);
    } else {
      console.log('DEBUG: Using AI-generated response');
      // Generate Jules's response with personality and shopping offer
      julesResponse = await generateJulesResponse(message, clothingType, context, userId);
      console.log('DEBUG: Generated Jules response for images:', julesResponse.substring(0, 200) + '...');
      
      // Strip unwanted closers
      julesResponse = stripClosers(julesResponse);
    }
    
    // Re-enable Google image search
    let images = [];
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    if (apiKey && cseId) {
      console.log(`DEBUG: Searching Google for: "${searchQuery}"`);
      console.log(`DEBUG: Using API key: ${apiKey.substring(0, 10)}...`);
      console.log(`DEBUG: Using CSE ID: ${cseId.substring(0, 10)}...`);
      console.log(`DEBUG: About to make Google API call...`);
      console.log(`DEBUG: Calling searchGoogleImages function...`);
      images = await searchGoogleImages(searchQuery, apiKey, cseId);
      console.log(`DEBUG: searchGoogleImages returned ${images.length} images`);
    } else {
      console.log('DEBUG: No Google API keys available');
      console.log('DEBUG: apiKey:', apiKey ? 'SET' : 'NOT SET');
      console.log('DEBUG: cseId:', cseId ? 'SET' : 'NOT SET');
      images = [];
    }

    console.log(`DEBUG: Found ${images.length} inspiration images for ${clothingType}`);
    const finalImages = images;

    // Keep natural paragraph structure
    const formattedResponse = julesResponse
      .replace(/\n{3,}/g, '\n\n') // Only clean up excessive line breaks
      .replace(/[ ]+/g, ' ') // Clean up multiple spaces within lines
      .trim();

    res.json({ 
      response: formattedResponse, // Include Jules's formatted response
      images: finalImages,
      query: searchQuery,
      clothingType: clothingType,
      hasImages: finalImages.length > 0,
      totalFound: finalImages.length
    });
    
  } catch (error) {
    console.error('Inspiration search error:', error);
    res.status(500).json({ 
      error: 'Inspiration search failed',
      images: [],
      hasImages: false
    });
  }
});

// Show more images route
router.post('/show-more', async (req, res) => {
  try {
    const { message, context, userId, existingImages = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract outfit pieces from context using AI
    const outfitPieces = await extractOutfitPieces(context, message);
    
    // Build search query using AI
    const searchQuery = await buildSearchQuery(outfitPieces, message, context);
    
    // Search for additional images
    let images = [];
    
    if (config.unsplash.accessKey) {
      console.log(`DEBUG: Show more - using Unsplash for additional images`);
      images = await searchUnsplashImages(searchQuery);
      
      // Filter out duplicates with existing images
      const existingUrls = existingImages.map(img => img.image);
      images = images.filter(img => !existingUrls.includes(img.image));
      
      console.log(`Show more - found ${images.length} new images from Pinterest`);
    } else if (config.google.apiKey && config.google.cseId) {
      try {
        // Add random start position to get different results
        const randomStart = Math.floor(Math.random() * 10) + 5; // Start between 5-15
        
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: config.google.apiKey,
            cx: config.google.cseId,
            q: searchQuery,
            searchType: 'image',
            num: config.google.numResults,
            safe: 'active',
            imgSize: config.google.imgSize,
            imgType: config.google.imgType,
            start: randomStart // Random start position for diversity
          },
        });

        const allImages = (response.data.items || [])
          .filter(item => item.link && item.image)
          .filter(item => {
            const title = (item.title || '').toLowerCase();
            const snippet = (item.snippet || '').toLowerCase();
            const url = (item.link || '').toLowerCase();
            
            // Filter out women's fashion
            const isWomensFashion = title.includes("women's") || snippet.includes("women's") || 
                                   title.includes("female") || snippet.includes("female") ||
                                   title.includes("dress") || snippet.includes("dress");
            
            // Filter out product shots and shopping sites
            const isProductShot = url.includes("shop") || url.includes("store") || 
                                 url.includes("buy") || url.includes("product") ||
                                 title.includes("product") || title.includes("shop") ||
                                 url.includes("thursdayboots") || url.includes("nordstrom") ||
                                 url.includes("nordstrommedia") || url.includes("etsy") || 
                                 url.includes("amazon") || url.includes("cdn.shop") || 
                                 url.includes("shopify") || url.includes("cdn/shop") || 
                                 url.includes("shop/files") || url.includes("files/") ||
                                 title.includes("buy") || title.includes("shop") ||
                                 snippet.includes("buy") || snippet.includes("shop") ||
                                 url.includes("cdn/shop") || url.includes("shop/files");
            
            // Filter out trendy/ripped items
            const isTrendy = title.includes("ripped") || snippet.includes("ripped") ||
                            title.includes("distressed") || snippet.includes("distressed") ||
                            title.includes("oversized") || snippet.includes("oversized") ||
                            title.includes("baggy") || snippet.includes("baggy") ||
                            title.includes("streetwear") || snippet.includes("streetwear");
            
            // Filter out blog articles
            const isBlog = url.includes("blog") || url.includes("article") || 
                          url.includes("post") || url.includes("guide") ||
                          title.includes("blog") || title.includes("article") ||
                          title.includes("how to") || title.includes("guide");
            
            // Filter out small images
            const isTooSmall = item.image && (item.image.width < config.filtering.minImageWidth || item.image.height < config.filtering.minImageHeight);
            
            return !isWomensFashion && !isProductShot && !isTrendy && !isBlog && !isTooSmall;
          })
          .map((item, index) => ({
            id: index + 1,
            image: item.link,
            width: item.image?.width || 500,
            height: item.image?.height || 500
          }));

        // Filter out duplicates with existing images
        const existingUrls = existingImages.map(img => img.image);
        images = allImages
          .filter(img => !existingUrls.includes(img.image))
          .slice(0, config.filtering.maxImagesReturned); // Return configured number of images
        
        console.log(`Show more - found ${images.length} new images for query: "${searchQuery}"`);
      } catch (error) {
        console.error('Show more - Google API error:', error.message);
      }
    }

    res.json({ 
      images: images,
      hasImages: images.length > 0,
      isShowMore: true
    });
    
  } catch (error) {
    console.error('Show more error:', error);
    res.status(500).json({ 
      error: 'Show more failed',
      images: [],
      hasImages: false
    });
  }
});

module.exports = router; 