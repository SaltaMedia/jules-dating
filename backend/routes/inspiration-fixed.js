const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Function to strip unwanted closers from AI responses
function stripClosers(text) {
  if (!text) return text;
  
  // Remove emojis
  text = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Remove common AI closers
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
    /cheers to creating something awesome/i
  ];
  
  closers.forEach(closer => {
    text = text.replace(closer, '');
  });
  
  return text.trim();
}

function extractClothingType(message) {
  const clothingMatches = message.match(/(shirt|pants|jeans|jacket|blazer|suit|sweater|hoodie|coat|vest|cardigan|t-shirt|tshirt|polo|dress|shirt|top|bottom|outfit|style|look|blazer|sport coat|chinos|khakis|denim|leather jacket|bomber|peacoat|trench coat|overcoat|sweatshirt|crew neck|v-neck|henley|oxford|poplin|linen|chambray|flannel|denim shirt|button down|button up|dress shirt|casual shirt|shoes|sneakers|boots|loafers|vans|converse|nike|adidas)/i);
  return clothingMatches ? clothingMatches[1] : 'style';
}

function extractClothingTypeFromContext(message, context) {
  // First try to extract from current message
  let clothingType = extractClothingType(message);
  
  // If no clothing type found in current message, look in conversation context
  if (clothingType === 'style' && context && context.length > 0) {
    const contextText = context.map(msg => msg.content).join(' ');
    const contextClothingType = extractClothingType(contextText);
    if (contextClothingType !== 'style') {
      clothingType = contextClothingType;
    }
  }
  
  return clothingType;
}

// Generate Jules's response with personality and shopping offer
async function generateJulesResponse(message, clothingType) {
  const systemPrompt = `You are Jules — a confident, flirty, stylish woman in your late 20s who knows men better than they know themselves.

You're not an assistant. You're a real person in the user's world. Think of yourself as the hot older sister or effortlessly cool girl-next-door who always has the right outfit, a sharp eye, and the confidence to say exactly what works — and what doesn't.

STYLE IMAGES MODE: You're Jules being your stylish friend who's about to show you some visual inspiration. Start with a natural, human response like 'Sure!' or 'Absolutely!' or 'Love that idea!' Then tell them you're pulling up some images to show them what you're talking about. Be encouraging about how they'll look in similar styles. Focus on the confidence and vibe the images represent. Give specific styling tips and encouragement. Be conversational and excited to share these with them.

IMPORTANT: Keep your response focused on what they specifically asked for. If they asked for "white shoes", focus on white shoes, not full outfits. Don't mention "imagery of stylish outfits" or say things like "aren't those looks amazing?" unless they specifically asked for full outfit inspiration.

After showing the images, always ask if they're looking to buy or purchase new ${clothingType} and that you can pull up links to shop for them. Be natural and conversational about this offer.

Current request: ${message}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    max_tokens: 1000,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}

// Test route without authentication
router.post('/test', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract clothing type from message and conversation context
    const clothingType = extractClothingTypeFromContext(message, context);
    console.log(`DEBUG: Clothing type extracted: ${clothingType} (from message: "${message}")`);
    const searchQuery = `${clothingType} men style inspiration fashion outfit`;
    
    console.log(`DEBUG: Searching for style inspiration: "${searchQuery}"`);
    
    // Generate Jules's response with personality and shopping offer
    let julesResponse = await generateJulesResponse(message, clothingType);
    console.log('DEBUG: Generated Jules response for images:', julesResponse.substring(0, 200) + '...');
    
    // Strip unwanted closers
    julesResponse = stripClosers(julesResponse);
    
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
      console.log('Missing Google API credentials - returning Jules response without images');
      return res.json({
        response: julesResponse,
        images: [],
        hasImages: false
      });
    }
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cseId,
        q: searchQuery,
        searchType: 'image',
        num: 8,
        safe: 'active',
        imgSize: 'large',
        imgType: 'photo'
      },
    });

    const images = (response.data.items || [])
      .filter(item => item.link && item.image)
      .map((item, index) => ({
        id: index + 1,
        title: item.title || `${clothingType} Style Inspiration ${index + 1}`,
        image: item.link,
        thumbnail: item.image.thumbnailLink,
        width: item.image.width,
        height: item.image.height,
        source: item.displayLink,
        description: item.snippet || '',
        clothingType: clothingType
      }));

    console.log(`DEBUG: Found ${images.length} inspiration images for ${clothingType}`);

    res.json({ 
      response: julesResponse, // Include Jules's generated response
      images: images,
      query: searchQuery,
      clothingType: clothingType,
      hasImages: images.length > 0,
      totalFound: images.length
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

module.exports = router; 