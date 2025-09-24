require('dotenv').config();
const { OpenAI } = require('openai');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const ChatSession = require('../models/ChatSession');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { brands, brandHelpers } = require('../config/brands');
const { buildJulesContext } = require('../utils/contextBuilder');
const ConversationLearning = require('../utils/conversationLearning');
const AIContextAnalyzer = require('../utils/aiContextAnalyzer');
const UserContextCache = require('../utils/userContextCache');
// Removed getRemainingUsage import - using direct calculation instead



const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Load Jules Dating configuration
const configPath = path.join(__dirname, '../jules_dating_config.json');
let julesConfig = {};
try {
  julesConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.warn('⚠️ Could not load jules_dating_config.json, using default config:', error.message);
  // Use default configuration if file is not found
  julesConfig = {
    // Add default configuration here if needed
  };
}

// Function to get system prompt for Jules Style with new context system
async function getSystemPrompt(userId) {
  let userContext = '';

  try {
    // Use the user context cache for performance
    userContext = await UserContextCache.getUserContext(userId);
  } catch (error) {
    console.error('Error building user context:', error);
  }

  const basePrompt = `You are Jules — a confident, flirty, emotionally intelligent AI who helps men succeed in dating and relationships. You sound like a clever, slightly snarky, flirty, brutally honest older sister who's an expert at dating. Direct, sharp, and playful — never robotic or repetitive.

---

### CORE PRINCIPLE
Your motto is: **Date Who You Are.**  
Style builds confidence when it's true to the person.  It helps men get the most out of themsleves and helps them level up their dating life and dating profile perception — not a costume, not blind trend-chasing. Jules helps men look sharp, current, and authentic to their life stage.

---

### CONTEXT AWARENESS
- Always reference the user's age, lifestyle, budget, body type, and past conversations.  
- Use name naturally in conversation
- Adapt outfit advice so it feels authentic. A man in his 40s should look confident and current, not like he borrowed from a 22-year-old.  
- Balance **on-trend elements** (cuts, colors, textures, seasonal pieces) with **timeless staples** (clean tailoring, neutral basics, classic footwear).  
- Keep advice fresh — don't default to the same formulas. Outfit ideas should feel specific to the question and context, reflecting current trends, diverse options, and user preferences.                                                                                                                                                                       
- Respect the user's preferences but don't be limited by them. Push horizons when it makes sense, but always keep recommendations wearable and true to the person.

**REALISTIC EXPECTATIONS:**
- Focus on how clothes look and fit, not on what they'll achieve
- Style is one factor among many in dating/social situations
- Give advice about looking good, not about getting specific outcomes
- Be encouraging about style choices without over-promising results  

---

### PERSONALITY + VOICE
**Archetype:** A flirty, brutally honest, clever older sister. Stylish, witty, direct, teasing, and confident. She cares, but shows it through blunt honesty and playful banter.  Style: You know your stuff and you're not afraid to show it. You give advice with attitude and personality. You're bold, authentic, and sometimes a little sassy. You don't sugarcoat things. You're the friend who will tell you that outfit makes you look like a dad at a barbecue when you're trying to be cool. Vibe: Like that friend who's got your back but will also call you out on your BS. Flirty but not creepy, confident but not overbearing. You're direct and to the point — no fluff, just real talk. You're the one who says "that's not it" when something's off, but you'll also be the first to hype you up when you actually look good.

**Tone Principles:**  
- Conversational, not formal.  
- Witty, sharp, a little sarcastic.  
- Flirty edge when it fits — but never "AI girlfriend."  
- Specific and stylish — advice that actually helps, not vague gestures.  
- Confidence through *style knowledge* and delivery, not empty pep talk.
- Sound natural - like a stylish friend who knows their stuff, not like you're trying to be cool.  

**Avoid (Principles):**  Hard bans.
- **Generic pep-talk filler** — don't rely on clichés ("you've got this," "turn heads", "effortless" anything).  
- **Over-formal / customer-service tone** — never sound like HR.  
- **Fake intimacy** — no "babe," "honey," "sweetie," "darling," or forced empathy.  This is a hard ban.
- **Predictable formulas** — don't recycle the same stock outfits or phrasing.  
- **Over-explaining** — keep it punchy and fresh.  
- **Content-writer fluff** — no emoji spam, "Hope that helps," or blog-style bullet dumps.
- **False promises** — no "will seal the deal," "guaranteed to work," "will definitely get you dates," or outcome predictions.
- **Corny casual phrases** — no "spill the beans," "what's the tea," "spill it," or forced slang.  

**Principle:** If it sounds like a self-help book, a chatbot, or a style blog, don't say it.  

---

### STYLE EXAMPLES (Guides — not scripts)
These are **illustrations of tone and pacing**. They show how Jules balances wit, blunt honesty, and practical style advice. Always generate original, in-context responses — never reuse wording.

- **When something doesn't work:** Call it out directly but keep it playful (e.g., point out if it feels outdated, mismatched, or not right for the vibe).  
- **When something does work:** Highlight *why* it's strong — clean fit, current cut, right for the occasion — without exaggeration or clichés.  
- **When recommending:** Mix timeless staples (tailored shirt, clean sneakers, classic chinos) with on-trend accents (color, cut, detail) that suit the user's age and lifestyle.  

---

### PRODUCT + FUNCTION
Jules is part of the Jules Style App. Core features:  
1. **Chat with Jules (active):** Talk about style, dating, confidence, and life advice.  
2. **Fit Check (active):** Direct users to the Fit Check section to upload outfit photos for feedback.  
3. **Closet (active):** Build/manage wardrobe items and base recommendations on what users own.  
4. **Personalized Recommendations (active):** Suggest products and outfits based on preferences, budget, and body type.  
5. **Outfit Building (active):** Create complete outfits for different occasions.  
6. **Community (coming soon):** Share and get outfit feedback.  

When asked "what can you do," explain these naturally in conversation. Always mention Fit Check for outfit feedback.  

---

### BEHAVIORAL STYLE
- Keep responses specific and actionable — no vague advice.  
- Ask 1–2 natural questions when context is missing, not interrogations.  
- Respect user satisfaction: if they say they're good with an outfit, acknowledge it and offer tweaks only if invited.  
- Use style to build confidence — advice should make them feel capable, not dependent.  
- Push users beyond comfort zones when appropriate, but never dress them out of character.

**Conversation Starters:**
- Keep greetings simple and natural: "Hey [name]" or "What's up?" 
- Avoid over-enthusiastic phrases like "elevate your style game" or "sprinkle some style magic"
- Don't try to be a "cool friend" - just be a knowledgeable, direct style advisor
- Let the user lead the conversation direction rather than assuming what they want  

---

### FORMATTING + DELIVERY
- Natural paragraphs with conversational flow.  
- Double line breaks only between major sections or topics.  
- No bullet dumps or blog formatting.  
- Every reply should carry Jules's personality, not just information.  

---

### GUIDING PRINCIPLE
Every response should feel like Jules herself:  
- Confident, stylish, witty, and a little flirty.  
- Balancing timeless and current style.  
- Helping men "wear who they are" while pushing them to show up sharper, bolder, and more confident.`;
  
  return basePrompt;
}

// Function to determine intent using LLM classifier with context
async function determineIntent(message, conversationContext = [], conversationState = {}) {
  try {
    // Build context for the classifier
    const recentMessages = conversationContext.slice(-6); // Last 6 messages for context
    const contextText = recentMessages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Jules'}: ${msg.content}`
    ).join('\n');
    
    // Build state context
    const stateContext = [];
    if (conversationState.offeredImagesAt) {
      const timeDiff = Date.now() - new Date(conversationState.offeredImagesAt).getTime();
      if (timeDiff < 300000) { // Within 5 minutes
        stateContext.push('Jules recently offered to show images');
      }
    }
    if (conversationState.offeredLinksAt) {
      const timeDiff = Date.now() - new Date(conversationState.offeredLinksAt).getTime();
      if (timeDiff < 300000) { // Within 5 minutes
        stateContext.push('Jules recently offered to show product links');
      }
    }
    if (conversationState.lastOutfitPieces && conversationState.lastOutfitPieces.length > 0) {
      stateContext.push(`Recently discussed: ${conversationState.lastOutfitPieces.join(', ')}`);
    }
    
    const classifierPrompt = `You are an intent classifier for Jules, a men's style assistant. Analyze the user's message and conversation context to determine the appropriate response mode.

Available intents:
- style_feedback: General style advice, outfit recommendations, fashion guidance
- style_images: Visual inspiration requests, "show me pics", "examples", "inspiration"
- product_recommendation: Shopping requests, product links, "where to buy", "show me links", specific product requests, OR follow-up requests for more product options after Jules has already recommended products
- confidence_boost: Emotional support, feeling down, confidence issues
- user_satisfaction: User expresses satisfaction with outfit/style, feeling good, confident, happy with current look
- conversation: General chat, casual conversation, responses to suggestions, clarifications, requests for response variations or refinements

Conversation context:
${contextText}

State context:
${stateContext.join('\n')}

Current user message: "${message}"

Analyze the user's message and conversation context to determine their intent. Consider:

1. **Context from previous messages** - What was discussed before? If Jules just recommended products and user is asking for "more options", "other options", "different ones", etc., this is product_recommendation
2. **User's emotional state** - Are they satisfied, frustrated, asking for help?
3. **Specific requests** - Are they asking for products, advice, images, or just chatting?
4. **Conversation flow** - Does this message follow up on something specific?
5. **Tone and language** - What does the way they're speaking tell us about their intent?
6. **Refinement requests** - If the user is asking for variations, improvements, or refinements to Jules's previous response (like "smoother", "better", "different version"), classify based on the ORIGINAL context, not as a new request

IMPORTANT: 
- If Jules recently recommended products and the user is asking for more/different/other options, this should be classified as product_recommendation, not conversation.
- If the user is asking for refinements or variations to Jules's previous response, maintain the same intent as the original conversation context.

Focus on understanding the user's actual needs from the conversation context, not just matching keywords. Consider the natural flow of conversation and what would be most helpful for Jules to provide.

Respond with just the intent name (e.g., "style_feedback", "product_recommendation", "conversation", "user_satisfaction").`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: classifierPrompt }],
      max_tokens: 50,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    
    // Parse direct response (no JSON)
    const validIntents = ['style_feedback', 'style_images', 'product_recommendation', 'confidence_boost', 'user_satisfaction', 'conversation'];
    
    if (validIntents.includes(response)) {
      return response;
    } else {
      return 'style_feedback';
    }
    
  } catch (error) {
    console.error('LLM intent classification failed:', error.message);
    return 'style_feedback';
  }
}

// Function to get mode-specific instructions
function getModeInstructions(mode) {
  return julesConfig.modes[mode]?.style || julesConfig.modes.conversation.style;
}

// Function to strip closers from responses
function stripClosers(text) {
  const closers = [
    'Hope that helps!',
    'Let me know if you need anything else!',
    'Feel free to ask if you have more questions!',
    'Happy to help!',
    'Hope this helps!',
    'Let me know if you need more help!',
    'Feel free to reach out if you need anything else!',
    'Happy styling!',
    'Hope that gives you some ideas!',
    'Let me know if you need any clarification!',
    'Feel free to ask if you need more advice!',
    'Hope this gives you what you need!',
    'Let me know if you have any other questions!',
    'Feel free to ask if you need anything else!',
    'Hope that answers your question!',
    'Let me know if you need more guidance!',
    'Feel free to reach out if you need help!',
    'Hope this helps you out!',
    'Let me know if you need any other advice!',
    'Feel free to ask if you need more help!'
  ];

  let cleanedText = text;
  closers.forEach(closer => {
    const regex = new RegExp(closer, 'gi');
    cleanedText = cleanedText.replace(regex, '');
  });

  // Remove emojis
  cleanedText = cleanedText.replace(/[💖✨❤️💕💗💓💞💝💘💟💌💋💍💎💐🌸🌺🌷🌹🌻🌼🌻🌿🍀☘️🌱🌲🌳🌴🌵🌾🌿🍃🍂🍁🍄🌰🎃🎄🎋🎍🎎🎏🎐🎑🎀🎁🎂🎃🎄🎅🎆🎇🎈🎉🎊🎋🎌🎍🎎🎏🎐🎑🎒🎓🎔🎕🎖️🎗️🎘️🎙️🎚️🎛️🎜️🎝️🎞️🎟️🎠🎡🎢🎣🎤🎥🎦🎧🎨🎩🎪🎫🎬🎭🎮🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋️🏌️🏍️🏎️🏏🏐🏑🏒🏓🏔️🏕️🏖️🏗️🏘️🏙️🏚️🏛️🏜️🏝️🏞️🏟️🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏱🏲🏳️🏴🏵️🏶🏷️🏸🏹🏺🏻🏼🏽🏾🏿]/g, '');

  // FIX FORMATTING: Keep natural paragraph structure
  // Only clean up excessive line breaks, don't force sentence breaks
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  return cleanedText.trim();
}

// Main chat function with JSON mode integration
async function chat(req, res) {
  console.log('🚨 DEBUG: CHAT FUNCTION CALLED - This should appear for follow-up messages');
  try {
    
    const { message, context, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not set');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Use authenticated user ID if available, otherwise fall back to request body
    const actualUserId = req.user?.id || userId || 'anonymous';
    
    // Check if this is an anonymous user and get remaining usage
    let remainingUsage = null;
    if (actualUserId === 'anonymous' && req.anonymousSession) {
      const session = req.anonymousSession;
      const currentUsage = session.usageCounts.chatMessages || 0;
      const limit = 5; // FREE_LIMITS.chatMessages
      remainingUsage = {
        current: currentUsage,
        limit: limit,
        remaining: Math.max(0, limit - currentUsage)
      };
    }
    
    // Load conversation from database for authenticated users to preserve imageContext
    let conversationMessages = [];
    let conversation = null;
    
    if (actualUserId && actualUserId !== 'anonymous' && actualUserId !== 'test') {
      try {
        conversation = await Conversation.findOne({ userId: actualUserId });
        if (!conversation) {
          conversation = new Conversation({ userId: actualUserId, messages: [] });
        }
        
        // Load messages with proper imageContext preservation
        conversationMessages = conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.imageContext && { imageContext: msg.imageContext })
        }));
        
        console.log(`📝 Loaded ${conversationMessages.length} messages from database`);
        console.log(`🖼️ Messages with image context: ${conversationMessages.filter(msg => msg.imageContext?.hasImage).length}`);
      } catch (dbError) {
        console.error('❌ Database error loading conversation:', dbError);
        conversationMessages = context && Array.isArray(context) ? [...context] : [];
        conversation = null;
      }
    } else if (context && Array.isArray(context)) {
      // For anonymous users, use frontend context
      conversationMessages = [...context];
    }

    // Add current user message with image context if available
    const userMessage = {
      role: 'user',
      content: message
    };
    
    // Check for image context in conversation for follow-up messages
    const hasImageContext = conversationMessages.some(msg => msg.imageContext?.hasImage);
    
    let shouldUseVisionModel = false;
    let imageUrlForVision = null;
    
    if (hasImageContext) {
      // Find the most recent message with image context
      const recentImageMessage = conversationMessages
        .filter(msg => msg.imageContext?.hasImage)
        .slice(-1)[0];
      
      if (recentImageMessage?.imageContext?.thumbnailUrl) {
        // Add image context to current user message
        userMessage.imageContext = {
          hasImage: true,
          thumbnailUrl: recentImageMessage.imageContext.thumbnailUrl,
          analysis: recentImageMessage.imageContext.analysis
        };
        
        // Convert thumbnail URL to full resolution for vision model
        imageUrlForVision = recentImageMessage.imageContext.thumbnailUrl
          .replace('/upload/w_150,h_150,c_fill,q_auto,f_auto/', '/upload/');
        shouldUseVisionModel = true;
        
        console.log('🖼️ Adding image context to follow-up message');
      }
    }
    
    conversationMessages.push(userMessage);

    // Sanitize messages to prevent API errors
    conversationMessages = conversationMessages.filter(msg => {
      const isValid = typeof msg === 'object' && msg && msg.role && msg.content;
      if (!isValid) {
        console.warn('⚠️ Filtering out malformed message:', msg);
      }
      return isValid;
    });

    console.log(`💬 Processing ${conversationMessages.length} conversation messages`);

    // PARALLEL API CALLS - Start intent classification and context building simultaneously
    const [intent, userContext] = await Promise.all([
      determineIntent(message, conversationMessages, conversation?.state || {}),
      UserContextCache.getUserContext(actualUserId)
    ]);

    const modeInstructions = getModeInstructions(intent);

    // Special handling for user satisfaction intent
    let satisfactionInstructions = '';
    if (intent === 'user_satisfaction') {
      satisfactionInstructions = `

USER SATISFACTION MODE - CRITICAL INSTRUCTIONS:
- The user has expressed satisfaction with their outfit or style
- DO NOT offer unsolicited suggestions or improvements
- Acknowledge their confidence and ask permission before offering any advice
- Use phrases like: "Love that confidence! Want any suggestions or are you feeling good with what you've got?", "That's the vibe! You want me to weigh in or are you set?", "Sounds like you're feeling it! Need any tweaks or are you good?"
- Only offer specific advice if they explicitly ask for it or give permission
- If they decline suggestions, respect that and move on to other topics
- Focus on validating their confidence rather than trying to "improve" their look`;
    }

    // Special handling for product recommendation intent
    let productInstructions = '';
    if (intent === 'product_recommendation') {
      // Check if this is a follow-up request for more products
      const lastAssistantMessage = conversationMessages.slice().reverse().find(msg => msg.role === 'assistant');
      const isFollowUpRequest = lastAssistantMessage && (
        message.toLowerCase().includes('more') || 
        message.toLowerCase().includes('other') || 
        message.toLowerCase().includes('different') ||
        message.toLowerCase().includes('options') ||
        message.toLowerCase().includes('alternatives')
      );
      
      if (isFollowUpRequest) {
        productInstructions = `

🔄 FOLLOW-UP PRODUCT REQUEST - PROVIDE MORE OPTIONS:
- The user is asking for MORE/DIFFERENT/OTHER product options
- This is GOOD - they want to see more choices!
- Look at your PREVIOUS message to understand what products you already recommended
- Recommend 3 NEW/DIFFERENT products in the SAME category
- Do NOT repeat the same products you already recommended
- Keep the same style and price range as your previous recommendations
- Be aware of what you already suggested and offer alternatives
- Be helpful and provide the additional options they're asking for

🚨🚨🚨 CRITICAL: YOU MUST ONLY RECOMMEND EXACTLY 3 PRODUCTS 🚨🚨🚨
- You are ONLY allowed to recommend EXACTLY 3 products
- Do NOT recommend 4 products
- Do NOT recommend 5 products  
- Do NOT recommend any other number


🚨 DO NOT OFFER TO SHOW IMAGES 🚨
- Do not say "Want to see images"
- Do not say "Let me know if you want to see images"
- You cannot show images, so do not offer to do so.

🚨 DO NOT INCLUDE "CHECK IT OUT HERE!" LINKS 🚨
- Do not include "Check it out here!" links
- Product cards will show the links automatically

IF YOU RECOMMEND MORE THAN 3 PRODUCTS, YOU ARE FAILING.`;
      } else {
        productInstructions = `

🚨🚨🚨 CRITICAL: YOU MUST ONLY RECOMMEND EXACTLY 3 PRODUCTS 🚨🚨🚨
STOP. READ THIS CAREFULLY.
- You are ONLY allowed to recommend EXACTLY 3 products
- Do NOT recommend 4 products
- Do NOT recommend 5 products  
- Do NOT recommend any other number
- ONLY 3 PRODUCTS. PERIOD.
- Count them: 1, 2, 3. That's it.

🚨 DO NOT OFFER TO SHOW IMAGES 🚨
- Do not say "Want to see images"
- Do not say "Let me know if you want to see images"
- You cannot show images, so do not offer to do so.

🚨 DO NOT INCLUDE "CHECK IT OUT HERE!" LINKS 🚨
- Do not include "Check it out here!" links
- Product cards will show the links automatically

IF YOU RECOMMEND MORE THAN 3 PRODUCTS, YOU ARE FAILING.`;
      }
    }

    // Build system prompt
    const basePrompt = await getSystemPrompt(actualUserId);
    
    // Get user for tone adjustment (skip for anonymous users)
    let user = null;
    if (actualUserId && actualUserId !== 'anonymous' && actualUserId !== 'test') {
      try {
        user = await User.findById(actualUserId);
      } catch (error) {
        console.error('Error fetching user for tone adjustment:', error);
      }
    }
    
    // Add tone adjustment based on user preference
    const tone = user?.julesTone || 3; // Default to flirty (3)
    let toneAdjustment = '';
    switch(tone) {
      case 1:
        toneAdjustment = "\n\nTONE ADJUSTMENT: Supportive and encouraging. Be warm, understanding, and build confidence through positive reinforcement. Still direct and honest, but with a nurturing approach.";
        break;
      case 2:
        toneAdjustment = "\n\nTONE ADJUSTMENT: Honest and straightforward. Be direct, clear, and authentic. Give it to them straight with confidence and style.";
        break;
      case 3:
        toneAdjustment = "\n\nTONE ADJUSTMENT: Snarky and sarcastic. Be witty, sharp, and playfully sarcastic. Use clever humor and light teasing while still being helpful and stylish.";
        break;
      default:
        toneAdjustment = "\n\nTONE ADJUSTMENT: Snarky and sarcastic. Be witty, sharp, and playfully sarcastic. Use clever humor and light teasing while still being helpful and stylish.";
    }
    
    // Enhanced context integration with balanced instructions
    const contextInstructions = userContext ? `

CONTEXT INTEGRATION INSTRUCTIONS:
- Reference the user's preferences when relevant, but don't be limited by them
- Use their name naturally in conversation
- Consider their budget and preferences when making recommendations
- Factor in their body type and lifestyle when suggesting fits
- Respect their style boundaries (colors/items they avoid)
- Use their relationship status and goals when relevant
- Feel free to suggest new styles, brands, or approaches beyond their current preferences
- Don't force-fit every recommendation to their existing preferences
- Be open to expanding their style horizons while respecting their comfort zone

${userContext}` : '';

    // Add image context instructions if we have image context
    let imageInstructions = '';
    if (shouldUseVisionModel && imageUrlForVision) {
      imageInstructions = `

### IMAGE CONTEXT MODE - CRITICAL INSTRUCTIONS:
- You CAN see and analyze the image in this message
- The user is asking about the same image from earlier in the conversation
- You have full vision capabilities - analyze the image content directly
- Provide specific visual details based on what you can see in the image
- Do NOT say "I can't see the image" or "I can't determine from the image"
- You are looking at the same image the user uploaded earlier`;
    }

    const fullSystemPrompt = `${basePrompt}${toneAdjustment}${satisfactionInstructions}${productInstructions}${imageInstructions}\n\nCURRENT MODE: ${intent}\nMODE INSTRUCTIONS: ${modeInstructions}${contextInstructions}`;
    
    // Debug: Log user context for troubleshooting
    console.log(`DEBUG: User context for ${userId}:`, fullSystemPrompt.includes('USER CONTEXT:') ? 'User context loaded' : 'No user context found');
    if (fullSystemPrompt.includes('USER CONTEXT:')) {
      console.log(`DEBUG: User context details for ${userId}:`, userContext);
    }

    // Prepare messages for OpenAI API
    let messages = [
      { role: 'system', content: fullSystemPrompt },
      ...conversationMessages.slice(-10).map(msg => ({ ...msg }))
    ];

    // Add image to the last user message if we have image context
    if (shouldUseVisionModel && imageUrlForVision) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        lastUserMessage.content = [
          {
            type: 'text',
            text: lastUserMessage.content
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrlForVision
            }
          }
        ];
        console.log('✅ CRITICAL FIX: Added actual image to user message for vision model');
        console.log(`📸 Image URL being sent to vision model: ${imageUrlForVision}`);
      }
    }

    // Select appropriate model based on image context
    const modelToUse = shouldUseVisionModel ? 'gpt-4o' : 'gpt-4o-mini';
    console.log(`🤖 Using ${modelToUse} model${shouldUseVisionModel ? ' with vision' : ''}`);
    
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: messages,
      max_tokens: julesConfig.modes[intent]?.max_tokens || 3000,
      temperature: 0.8
    });

    const response = completion.choices[0].message.content;

    // Check if this is a product recommendation request
    let products = [];
    let styleImages = [];
    let productResponse = null;
    
    if (intent === 'product_recommendation') {
      try {
        console.log('🔍 Product recommendation detected, searching for products...');
        
        // Check if this is a follow-up request for more products
        const lastAssistantMessage = conversationMessages.slice().reverse().find(msg => msg.role === 'assistant');
        const isFollowUpRequest = lastAssistantMessage && (
          message.toLowerCase().includes('more') || 
          message.toLowerCase().includes('other') || 
          message.toLowerCase().includes('different') ||
          message.toLowerCase().includes('options') ||
          message.toLowerCase().includes('alternatives')
        );
        
        if (isFollowUpRequest) {
          console.log('🔄 Follow-up product request detected, using NEW response context...');
          // For follow-up requests, use Jules's NEW response as context
          const conversationWithNewResponse = [
            ...conversationMessages,
            { role: 'assistant', content: response } // Use Jules's NEW response
          ];
          
          // Call the products endpoint with NEW response context
          const productsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/products/test`, {
            message,
            conversation: { messages: conversationWithNewResponse },
            isFollowUp: true,
            previousRecommendations: lastAssistantMessage.content
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (productsResponse.data.products && productsResponse.data.products.length > 0) {
            console.log(`✅ Found ${productsResponse.data.products.length} follow-up products`);
            products = productsResponse.data.products;
          } else {
            console.log('❌ No follow-up products found');
          }
        } else {
          // Regular product recommendation
          const conversationWithResponse = [
            ...conversationMessages,
            { role: 'assistant', content: response }
          ];
          
          // Call the products endpoint with Jules's complete response
          const productsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/products/test`, {
            message,
            conversation: { messages: conversationWithResponse }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (productsResponse.data.products && productsResponse.data.products.length > 0) {
            console.log(`✅ Found ${productsResponse.data.products.length} products`);
            products = productsResponse.data.products;
          } else {
            console.log('❌ No products found');
          }
        }
      } catch (error) {
        console.error('Product search error:', error.message);
        // Continue without products if search fails
      }
    }
    
    // Check if this is a style images request
    if (intent === 'style_images') {
      try {
        console.log('DEBUG: Style images intent detected, calling inspiration route...');
        // Call the inspiration test route to get style images and Jules's response
        const inspirationResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/inspiration/test`, {
          message,
          context: conversationMessages,
          userId: userId
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('DEBUG: Inspiration route response received');
        console.log('DEBUG: Inspiration response data:', JSON.stringify(inspirationResponse.data, null, 2));
        console.log('DEBUG: Has response:', !!inspirationResponse.data.response);
        console.log('DEBUG: Has images:', !!inspirationResponse.data.images);
        console.log('DEBUG: Images length:', inspirationResponse.data.images?.length);
        console.log('DEBUG: Has images flag:', inspirationResponse.data.hasImages);

        if (inspirationResponse.data.response) {
          // Use Jules's response from the inspiration route
          productResponse = inspirationResponse.data.response;
          console.log('DEBUG: Using inspiration response:', productResponse);
        }
        
        if (inspirationResponse.data.hasImages && inspirationResponse.data.images.length > 0) {
          styleImages = inspirationResponse.data.images;
          console.log('DEBUG: Setting style images:', styleImages.length, 'images');
          console.log('DEBUG: First image:', styleImages[0]);
        } else {
          console.log('DEBUG: No images found in inspiration response');
        }
      } catch (error) {
        console.error('Inspiration search error:', error.message);
        console.error('Inspiration search error details:', error.response?.data);
        // Continue without images if search fails
      }
    }

    // Use product response if available, otherwise use the general response
    const finalResponse = productResponse || response;
    
    // Add assistant response to conversation messages
    conversationMessages.push({
      role: 'assistant',
      content: finalResponse
    });

    const cleanedFinalResponse = stripClosers(finalResponse);

    // Add conversion prompt for anonymous users after 5th message
    let finalResponseWithConversion = cleanedFinalResponse;
    let showConversionPrompt = false;
    
    if (actualUserId === 'anonymous' && remainingUsage && remainingUsage.remaining <= 1) {
      // This is the 5th message (or last allowed message)
      showConversionPrompt = true;
      finalResponseWithConversion = `${cleanedFinalResponse}

---

**🎯 Ready to unlock the full Jules experience?**

You've used all 5 of your free messages! Sign up to continue chatting with Jules and get unlimited access to all features.

[**Sign up to continue**](/register)`;
    }

    // Update conversation state based on Jules's response
    const updateState = {};
    if (cleanedFinalResponse.toLowerCase().includes('pull up some pics') || 
        cleanedFinalResponse.toLowerCase().includes('show you what') ||
        cleanedFinalResponse.toLowerCase().includes('want me to pull up')) {
      updateState.offeredImagesAt = new Date();
    }
    if (cleanedFinalResponse.toLowerCase().includes('pull up links') || 
        cleanedFinalResponse.toLowerCase().includes('where to buy') ||
        cleanedFinalResponse.toLowerCase().includes('show me links')) {
      updateState.offeredLinksAt = new Date();
    }
    updateState.lastIntent = intent;

    // === BACKGROUND PROCESSING - Move learning system to background ===
    if (userId && userId !== 'anonymous' && userId !== 'test') {
      // Process learning in background (non-blocking)
      setImmediate(async () => {
        try {
          const insights = await ConversationLearning.extractInsights(userId, message, conversationMessages);
          if (insights) {
            const profileUpdated = await ConversationLearning.updateProfileWithInsights(userId, insights);
            if (profileUpdated) {
              console.log(`Learning system: Profile updated for user ${userId}`);
              
              // Clear user context cache when learning occurs to ensure fresh data
              const UserContextCache = require('../utils/userContextCache');
              UserContextCache.clearUserCache(userId);
              console.log(`Cache cleared for user ${userId} due to learning`);
            }
          }
        } catch (error) {
          console.error('Learning system error (non-blocking):', error.message);
        }
      });
    }

    // Save conversation to database if we have a userId
    if (actualUserId && actualUserId !== 'anonymous' && actualUserId !== 'test') {
      // Use the conversation loaded earlier (no additional database query needed)
      if (!conversation) {
        conversation = new Conversation({ userId: actualUserId, messages: [] });
      }
      
      // Update conversation with new messages, preserving image context
      conversation.messages = conversationMessages.map(msg => {
        // Handle both string content and vision model array format
        let content = msg.content;
        if (Array.isArray(content)) {
          // Extract text from vision model format
          const textPart = content.find(part => part.type === 'text');
          content = textPart ? textPart.text : JSON.stringify(content);
        }
        
        return {
          role: msg.role,
          content: content,
          timestamp: new Date(),
          ...(msg.imageContext && { imageContext: msg.imageContext })
        };
      });
      
      // Update state flags
      if (Object.keys(updateState).length > 0) {
        conversation.state = { ...conversation.state, ...updateState };
      }
      
      await conversation.save();

      // Also create/update ChatSession for Chat History feature
      try {
        // Generate a title from the first user message
        const firstUserMessage = conversationMessages.find(msg => msg.role === 'user');
        const title = firstUserMessage ? 
          firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') :
          'New Chat';

        // Always create a new ChatSession for each conversation
        // This allows users to access all their previous conversations
        const chatSession = new ChatSession({
          userId: actualUserId,
          title: title,
          messages: conversationMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date()
          }))
        });
        
        await chatSession.save();
        console.log(`New ChatSession created for user ${actualUserId}: ${title}`);
      } catch (chatSessionError) {
        console.error('Error updating ChatSession:', chatSessionError);
        // Don't fail the main chat if ChatSession update fails
      }
    }

    // Limit products to 3 for initial display, mark if there are more
    const initialProducts = products.slice(0, 3);
    const hasMoreProducts = false; // Always false since we only show 3 products
    
    const finalResponseData = {
      response: finalResponseWithConversion,
      intent: intent,
      products: initialProducts,
      allProducts: products, // Include all products for "show more"
      hasMoreProducts: hasMoreProducts,
      images: styleImages || [],
      // Anonymous user specific data
      isAnonymous: actualUserId === 'anonymous',
      remainingUsage: remainingUsage,
      showConversionPrompt: showConversionPrompt
    };
    
    console.log('DEBUG: Final response data being sent to frontend:');
    console.log('DEBUG: Response length:', cleanedFinalResponse?.length);
    console.log('DEBUG: Images in final response:', finalResponseData.images?.length);
    console.log('DEBUG: Has images flag:', finalResponseData.images?.length > 0);
    console.log('DEBUG: First image in final response:', finalResponseData.images?.[0]);
    
    res.json(finalResponseData);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function chatWithImage(req, res) {
  try {
    
    const { message, imageUrl, context, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not set');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Use authenticated user ID if available, otherwise fall back to request body
    const actualUserId = req.user?.id || userId || 'anonymous';
    
    // Load existing conversation from database for authenticated users
    let conversationMessages = [];
    let conversation = null;
    
    if (actualUserId && actualUserId !== 'anonymous' && actualUserId !== 'test') {
      try {
        conversation = await Conversation.findOne({ userId: actualUserId });
        if (!conversation) {
          conversation = new Conversation({ userId: actualUserId, messages: [] });
        }
        
        // Load existing messages with image context preservation
        conversationMessages = conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.imageContext && { imageContext: msg.imageContext })
        }));
        
        console.log(`📝 Loaded ${conversationMessages.length} existing messages from database`);
        console.log(`🖼️ Existing messages with image context: ${conversationMessages.filter(msg => msg.imageContext?.hasImage).length}`);
        
        // Debug: Log all existing messages
        conversationMessages.forEach((msg, i) => {
          console.log(`📝 Existing Message ${i}: role=${msg.role}, hasImageContext=${!!msg.imageContext?.hasImage}`);
          if (msg.imageContext?.hasImage) {
            console.log(`🖼️ Existing Message ${i} image context:`, {
              hasImage: msg.imageContext.hasImage,
              thumbnailUrl: msg.imageContext.thumbnailUrl,
              analysis: msg.imageContext.analysis?.substring(0, 50) + '...'
            });
          }
        });
      } catch (dbError) {
        console.error('❌ Database error loading conversation:', dbError);
        // Fall back to frontend context if database fails
        conversationMessages = context && Array.isArray(context) ? [...context] : [];
        conversation = null;
      }
    } else if (context && Array.isArray(context)) {
      // For anonymous users, use frontend context
      conversationMessages = [...context];
    }

    // Get system prompt
    const systemPrompt = await getSystemPrompt(actualUserId);
    const fullSystemPrompt = `${systemPrompt}

### IMAGE ANALYSIS MODE
You CAN see and analyze images. When a user uploads an image, you MUST analyze it visually and provide specific, actionable dating advice based on what you see. Focus on:
- Visual details: clothing, colors, styles, appearance, setting
- Dating profile analysis: photos, bio text, interests, lifestyle cues
- Specific recommendations based on what you observe in the image
- How to respond to or approach the person shown
- Dating strategy based on visual and textual cues

IMPORTANT: You have full vision capabilities. Analyze the image content directly, not just text extraction. In this dating app context, you should provide direct style feedback without privacy disclaimers like "I can't tell who this is" - focus on the style analysis the user is asking for.`;

    // Prepare messages for OpenAI with image
    const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...conversationMessages.slice(-10),
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    // Debug: Log the image URL and messages being sent to OpenAI
    console.log('🚨 DEBUG: Image URL being sent to OpenAI:', imageUrl);
    console.log('🚨 DEBUG: Messages being sent to OpenAI:', JSON.stringify(messages, null, 2));
    
    // Test if the image URL is accessible
    try {
      const axios = require('axios');
      const imageTest = await axios.head(imageUrl, { timeout: 5000 });
      console.log('🚨 DEBUG: Image URL is accessible, status:', imageTest.status);
    } catch (urlError) {
      console.error('🚨 DEBUG: Image URL is NOT accessible:', urlError.message);
    }

    // Call OpenAI with Vision
    let cleanedResponse;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 3000,
        temperature: 0.8
      });

      const response = completion.choices[0].message.content;
      cleanedResponse = stripClosers(response);
      
      // Debug: Log Jules's response to see if she's actually analyzing the image
      console.log('🚨 DEBUG: Jules response:', cleanedResponse);
      console.log('🚨 DEBUG: OpenAI API call successful');
    } catch (openaiError) {
      console.error('🚨 DEBUG: OpenAI API Error:', openaiError);
      throw openaiError;
    }

    // Add current user message with image context
    const userMessage = {
      role: 'user',
      content: message,
      imageContext: {
        hasImage: true,
        thumbnailUrl: req.body.thumbnailUrl,
        analysis: null // Will be set after assistant responds
      }
    };
    
    conversationMessages.push(userMessage);
    
    // Add assistant response to conversation messages with image analysis
    const assistantMessage = {
      role: 'assistant',
      content: cleanedResponse,
      imageContext: {
        hasImage: true,
        thumbnailUrl: req.body.thumbnailUrl,
        analysis: cleanedResponse
      }
    };
    
    conversationMessages.push(assistantMessage);
    
    console.log('📸 Image context saved for future reference');

    // Save conversation for authenticated users
    if (actualUserId && actualUserId !== 'anonymous') {
      try {
        // Save conversation with proper image context preservation
        const messagesToSave = conversationMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(),
          ...(msg.imageContext && { imageContext: msg.imageContext })
        }));
        
        const conversation = await Conversation.findOneAndUpdate(
          { userId: actualUserId },
          { 
            messages: messagesToSave,
            lastMessageAt: new Date()
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Conversation saved for user: ${actualUserId}`);
        console.log(`📸 Messages with image context saved: ${messagesToSave.filter(msg => msg.imageContext?.hasImage).length}`);
        
        // Debug: Log what's being saved
        console.log('🔍 DEBUGGING WHAT IS BEING SAVED:');
        messagesToSave.forEach((msg, i) => {
          console.log(`💾 Saving Message ${i}: role=${msg.role}, hasImageContext=${!!msg.imageContext?.hasImage}`);
          if (msg.imageContext?.hasImage) {
            console.log(`💾 Saving Message ${i} image context:`, {
              hasImage: msg.imageContext.hasImage,
              thumbnailUrl: msg.imageContext.thumbnailUrl,
              analysis: msg.imageContext.analysis?.substring(0, 50) + '...'
            });
          }
        });
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }

    const responseData = {
      response: cleanedResponse,
      products: [], // Dating app doesn't need product recommendations
      hasProducts: false,
      totalFound: 0
    };

    console.log('✅ Chat with image response sent');
    res.json(responseData);

  } catch (error) {
    console.error('🚨 CHAT WITH IMAGE ERROR:', error);
    console.error('🚨 ERROR MESSAGE:', error.message);
    console.error('🚨 ERROR STACK:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports = {
  chat,
  chatWithImage,
  determineIntent,
  getSystemPrompt
};
