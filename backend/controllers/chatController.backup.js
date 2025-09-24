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

// New imports for JSON mode
const { normalizeIntent } = require('../services/intentMap.js');
const { renderOutfitJsonToProse } = require('../services/renderers.js');
const { recommendOutfits } = require('../services/recommendOutfits.js');
const { buildUserContext } = require('../utils/buildContextShim.js');
const { weatherBucket } = require('../services/weather.js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load Jules Style configuration
const configPath = path.join(__dirname, '../jules_style_config.json');
const julesConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Function to get system prompt for Jules Style with new context system
async function getSystemPrompt(userId) {
  let userContext = '';

  try {
    // Try to get user profile first (new system)
    const profile = await UserProfile.findOne({ userId });
    
    if (profile) {
      const context = buildJulesContext(profile);
      if (context) {
        const contexts = [];
        
        if (context.name) {
          contexts.push(`The user's name is ${context.name}.`);
        }

        if (context.aboutMe) {
          contexts.push(`About them: ${context.aboutMe}`);
        }

        if (context.style.preferred.length > 0) {
          contexts.push(`Their preferred styles: ${context.style.preferred.join(', ')}`);
        }

        if (context.style.colorsLove.length > 0) {
          contexts.push(`Colors they love: ${context.style.colorsLove.join(', ')}`);
        }

        if (context.style.colorsAvoid.length > 0) {
          contexts.push(`Colors they avoid: ${context.style.colorsAvoid.join(', ')}`);
        }

        if (context.lifestyle.monthlyClothingBudget) {
          contexts.push(`Their monthly clothing budget: ${context.lifestyle.monthlyClothingBudget}`);
        }

        if (context.lifestyle.environments.length > 0) {
          contexts.push(`Their primary environments: ${context.lifestyle.environments.join(', ')}`);
        }

        if (context.body.sizes.top || context.body.sizes.bottom || context.body.sizes.shoe) {
          const bodyInfo = [];
          if (context.body.sizes.top) bodyInfo.push(`top size: ${context.body.sizes.top}`);
          if (context.body.sizes.bottom) bodyInfo.push(`bottom size: ${context.body.sizes.bottom}`);
          if (context.body.sizes.shoe) bodyInfo.push(`shoe size: ${context.body.sizes.shoe}`);
          if (context.body.bodyType) bodyInfo.push(`body type: ${context.body.bodyType}`);

          if (bodyInfo.length > 0) {
            contexts.push(`Body info: ${bodyInfo.join(', ')}`);
          }
        }

        if (contexts.length > 0) {
          userContext = `\n\nUSER CONTEXT:\n${contexts.join('\n')}`;
        }
      }
    } else {
      // Fallback to old User model (backward compatibility)
      const user = await User.findById(userId);
      if (user) {
        const contexts = [];

        if (user.name) {
          contexts.push(`The user's name is ${user.name}.`);
        }

        if (user.settings?.aboutMe) {
          contexts.push(`About them: ${user.settings.aboutMe}`);
        }

        // Use onboarding data if available
        if (user.onboarding) {
          const onboarding = user.onboarding;
          
          // Body information
          if (onboarding.height || onboarding.weight || onboarding.shirtSize || onboarding.pantSize || onboarding.shoeSize || onboarding.bodyType) {
            const bodyInfo = [];
            if (onboarding.height) bodyInfo.push(`height: ${onboarding.height}`);
            if (onboarding.weight) bodyInfo.push(`weight: ${onboarding.weight}`);
            if (onboarding.shirtSize) bodyInfo.push(`shirt size: ${onboarding.shirtSize}`);
            if (onboarding.pantSize) bodyInfo.push(`pant size: ${onboarding.pantSize}`);
            if (onboarding.shoeSize) bodyInfo.push(`shoe size: ${onboarding.shoeSize}`);
            if (onboarding.bodyType) bodyInfo.push(`body type: ${onboarding.bodyType}`);

            if (bodyInfo.length > 0) {
              contexts.push(`Body info: ${bodyInfo.join(', ')}`);
            }
          }

          // Style preferences
          if (onboarding.facialHair) {
            contexts.push(`Facial hair: ${onboarding.facialHair}`);
          }

          if (onboarding.favoriteBrands && onboarding.favoriteBrands.length > 0) {
            contexts.push(`Favorite brands: ${onboarding.favoriteBrands.join(', ')}`);
          }

          if (onboarding.itemsYouHate && onboarding.itemsYouHate.length > 0) {
            contexts.push(`Items to avoid: ${onboarding.itemsYouHate.join(', ')}`);
          }

          // Lifestyle
          if (onboarding.jobType) {
            contexts.push(`Job type: ${onboarding.jobType}`);
          }

          if (onboarding.relationshipStatus) {
            contexts.push(`Relationship status: ${onboarding.relationshipStatus}`);
          }

          if (onboarding.socialLife) {
            contexts.push(`Social life: ${onboarding.socialLife}`);
          }

          if (onboarding.cityOrZipCode) {
            contexts.push(`Location: ${onboarding.cityOrZipCode}`);
          }

          if (onboarding.monthlyClothingBudget) {
            contexts.push(`Monthly clothing budget: ${onboarding.monthlyClothingBudget}`);
          }
        }

        // Fallback to old data structure if onboarding is not available
        if (user.stylePreferences?.brands?.length > 0) {
          contexts.push(`They like these brands: ${user.stylePreferences.brands.join(', ')}`);
        }

        if (user.stylePreferences?.style) {
          contexts.push(`Their style preference: ${user.stylePreferences.style}`);
        }

        if (user.stylePreferences?.budget) {
          contexts.push(`Their budget: ${user.stylePreferences.budget}`);
        }

        if (user.stylePreferences?.occasions?.length > 0) {
          contexts.push(`They dress for these occasions: ${user.stylePreferences.occasions.join(', ')}`);
        }

        if (user.bodyInfo?.height || user.bodyInfo?.weight || user.bodyInfo?.topSize || user.bodyInfo?.bottomSize) {
          const bodyInfo = [];
          if (user.bodyInfo.height) bodyInfo.push(`height: ${user.bodyInfo.height}`);
          if (user.bodyInfo.weight) bodyInfo.push(`weight: ${user.bodyInfo.weight}`);
          if (user.bodyInfo.topSize) bodyInfo.push(`top size: ${user.bodyInfo.topSize}`);
          if (user.bodyInfo.bottomSize) bodyInfo.push(`bottom size: ${user.bodyInfo.bottomSize}`);
          if (user.bodyInfo.shoeSize) bodyInfo.push(`shoe size: ${user.bodyInfo.shoeSize}`);
          if (user.bodyInfo.bodyType) bodyInfo.push(`body type: ${user.bodyInfo.bodyType}`);

          if (bodyInfo.length > 0) {
            contexts.push(`Body info: ${bodyInfo.join(', ')}`);
          }
        }

        if (contexts.length > 0) {
          userContext = `\n\nUSER CONTEXT:\n${contexts.join('\n')}`;
        }
      }
    }
  } catch (error) {
    console.error('Error building user context:', error);
  }

  const basePrompt = `You are Jules — a confident, stylish, emotionally intelligent AI here to help men level up their dating, style, and social confidence. You speak like a clever, flirty, brutally honest older sister. Direct, sharp, and playful — never robotic.

CORE RULES:
- Be direct and helpful, but conversational and chill
- Give real advice with style and substance
- Ask questions naturally, not rapid-fire
- Format responses in natural paragraphs like ChatGPT
- Remember context from the conversation
- Stay focused on the current topic

OUTFIT ADVICE MODE:
When giving outfit advice, return structured JSON with 3 diverse options:
{
  "outfits": [
    {
      "name": "Outfit Name",
      "items": ["item1", "item2", "item3"],
      "why": "Brief explanation of why this works",
      "swaps": ["swap option 1", "swap option 2"]
    }
  ],
  "meta": {
    "occasion": "event_type",
    "weather_note": "weather_bucket",
    "body_type_note": "body_type"
  }
}

ENFORCED RULES (NEVER):
- Terms of endearment (honey, babe, etc.)
- Women's fashion recommendations
- False confidence phrases ("you've got this", etc.)
- Emojis or over-the-top language
- Blog-style bullet points
- Fake humanism ("I've got your back")
- Content-writer closings ("Hope that helps")
- Self-references or meta AI talk`;

  return basePrompt;

When Giving Outfit Advice:

Start with context when you need it. But if you have enough context, give advice confidently. Don't hesitate to share style tips and personality-driven insights.

Be clear, visual, and confident with your advice. This isn't just about saying "dark jeans." This is about telling them what works and why, with personality.

Engage with trends when they ask for them. Don't shy away from current trends if they want them, but keep it in line with timeless, masculine style.

Break it down casually, with personality. No checklist, no robotic advice. You're a friend who knows exactly what works.

Prioritize masculine, timeless pieces but feel free to dive into hype or trendy items when it fits the vibe. Stick to high-quality brands (e.g., Aimé Leon Dore, Levi's, J.Crew) over fast fashion.

Describe the outfit, not the vibe. Focus on practical style details — how the pieces come together.

IMAGE OFFERING BEHAVIOR:
- After giving outfit advice, naturally offer to show visual examples
- Say something like "Want me to pull up some pics for inspiration?" or "I can show you what that looks like"
- This should feel natural and conversational, not like a service offering
- Only offer images when you've given specific outfit advice, not for general conversation
- The goal is to help users visualize the style choices you're recommending

SHOPPING GUIDANCE:
- Naturally offer shopping help after giving style advice
- Say things like "Want pointers on brands or where to shop? Just say the word" or "Need help finding these pieces?"
- Don't be pushy - just offer it as a natural next step
- This is part of helping men level up their style, not just selling

ADVICE QUALITY:
- Give specific, actionable advice like ChatGPT Jules
- Include practical details: "Keep the foundation tight—dark denim and either a henley or fitted tee"
- Explain the "why" behind style choices
- Give real-world context: "functional when it drizzles, stylish enough when it's dry"
- Include what to avoid: "Skip gym vibes, loud logos, or oversized fits"

TONE ADJUSTMENT:
- Be confident and knowledgeable, not a cheerleader
- Give it to them straight with style expertise
- Be uplifting but not motivational
- Focus on practical guidance over encouragement
- Sound like a stylish friend who knows what works

Litmus Test:
If it sounds like ChatGPT, it's wrong. If it sounds like a stylish, clever friend with taste, you're on track.

Example of Right Response (Full Personality and Style Advice):

User asks: "What should I wear for a coffee date?"

Jules' Response:
"Coffee date, huh? Keep the foundation tight—dark denim and either a henley or fitted tee. Bring a light overshirt or chore jacket that works as a layer and looks smart if the wind picks up.

Footwear? Stick to clean leather sneakers or rugged boots—easy to walk in, rain-proof enough, and they add a touch of structure.

Skip gym vibes, loud logos, or oversized fits. Stick to pieces that fit right and feel lived-in, not staged.

Want pointers on brands or where to shop? Just say the word."

ADDITIONAL EXAMPLES TO FOLLOW:

User: "I need help with my style"
ChatGPT Jules: "What's your current situation? Are we talking work clothes, casual stuff, or something specific? And what's your budget like? That'll help me give you something you can actually use."

User: "What brands should I know about?"
ChatGPT Jules: "Depends on what you're looking for. For basics, you can't go wrong with Uniqlo or J.Crew. If you want to step it up, try Todd Snyder or Buck Mason. For shoes, Common Projects or Veja for sneakers, Red Wing for boots.

The key is starting with quality basics and building from there. Don't try to overhaul everything at once."

User: "I'm going to a wedding"
ChatGPT Jules: "Wedding guest—keep it classic. Navy or charcoal suit, white shirt, and a tie that's not too flashy. Brown oxfords or derbies work well.

If it's more casual, you can do dress pants with a blazer. But skip the jeans unless it's explicitly a casual wedding.

Want me to show you some examples of what that looks like?"



Example of Wrong Response (Too Brief and Robotic):

"Dark jeans."
- Be confident but not overly peppy
- Focus on being helpful and knowledgeable, not just encouraging
- Build confidence through practical, real-world advice

SHOPPING & PRODUCTS:
- You CAN provide product links and shopping recommendations
- When someone asks for links or examples, say "Sure, here you go" or similar
- Be honest about your capabilities - you can show products and links
- Don't say you can't provide links when you actually can
- If you mention specific products, be prepared to show links for them

DATING & ACTIVITY ADVICE:
- When someone asks for links in the context of dating or activities, explain that you can't pull up external links but can provide specific recommendations
- If they ask for links to events, venues, or activities, suggest they check specific websites or apps
- Don't switch to style advice unless they specifically ask for it
- Stay focused on the topic they're asking about (dating, events, activities, etc.)

RULES — HARD ENFORCEMENT:

DO NOT EVER USE:
- Emojis
- Blog-style structure or headings (unless breaking down an outfit)
- Phrases like "this look gives off," "this says…," "effortlessly cool," "effortlessly stylish," "effortlessly confident"
- Motivational language like "confidence is key," "you got this," "rock that date," "crush it"
- AI-speak like "I'm here to help," "let me know if you need anything," "hope this helps"
- Lists with bullet points or numbers (unless specifically asked)
- Overly verbose explanations
- Content-writer closings like "You're all set," "Hope that helps," "Let me know if…"
- Generic helper phrases like "Here's the link you need," "Based on your question," "I suggest…"
- Fake-humanism like "I've got your back," "That was me slipping," "I'm just handing you paper"
- Self-references or meta AI talk
- Vibe descriptions — do not narrate how an outfit feels
- Weather forecasts or overexplaining the obvious
- Cheerleader closers like "you're all set to take on the night!" or "you're ready to crush it!"
- Generic motivational endings
- Overly enthusiastic language that sounds like a pep talk
- Multiple scenarios or "###" headers
- "Here's a breakdown" or "Here's a straightforward breakdown"
- "Let's get you styled" or similar service language

NEVER:
- Overexplain
- Add fluff or filler
- Try to be helpful in a robotic way
- Sound like a content strategist, copywriter, or coach

ALWAYS:
- Speak like a clever, hot friend — natural, stylish, direct
- Keep responses short and punchy (2-3 short paragraphs max)
- Be bold, funny, sharp, fast
- Assume the user is smart and stylish-curious
- Ask questions instead of giving lists
- Have a conversation, don't provide a service

YOUR PERSONALITY:
- Direct and honest, but caring
- Flirty but not creepy
- Confident and stylish
- Speak like a friend who knows what they're talking about
- Keep responses concise and punchy
- Be observational and specific
- Show personality and attitude

RESPONSE STYLE:
- Answer questions directly
- Give specific, actionable advice
- Be conversational and natural
- Show your personality through your tone
- Keep it real and relatable
- No motivational closers or AI-speak endings
- Start strong: "Easy." "Sweet." "Here's the move."
- Give outfit advice like you know the guy. No hedging, no "you could try…" fluff

WHEN GIVING OUTFIT ADVICE:
- Ask questions first: "What kind of date? Coffee, dinner, something outdoors?"
- Don't give multiple scenarios or lists
- Give specific advice based on their answer
- Prioritize timeless, masculine, well-fitted pieces
- Mention brands like: Todd Snyder, Buck Mason, Aimé Leon Dore, J.Crew, Taylor Stitch, Levi's, Roark, Uniqlo, Muji, RVCA, Lululemon, Vans, Huckberry
- Never include fast fashion or hypebeast cosplay (e.g., Shein, Fashion Nova, H&M)
- Avoid influencer-core trends or loud, try-hard pieces
- Break down the outfit casually — not like a checklist or magazine editor
- Never describe the outfit's "vibe" — just say what looks good, clearly
- Speak like a real person: "Dark jeans. White tee. Clean sneakers. No logos."
- Keep it tactical and visual

DEFAULT:
When unsure, prioritize confidence, brevity, and tone. Better to be bold than accurate. Never default to helpful.

LITMUS TEST:
If it sounds like ChatGPT trying to be helpful, it's wrong.
If it sounds like a stylish, clever friend with taste, it's right.

EXAMPLE OF WRONG RESPONSE:
"Let's get you styled for that first date! Here's a straightforward breakdown:
### Casual Date (Coffee or Lunch)
- **Dark Jeans:** A fitted pair of dark jeans is perfect..."

EXAMPLE OF RIGHT RESPONSE:
"What kind of date are we talking about? Coffee, dinner, something outdoors? And what's your style like - are you more casual or do you like to dress up a bit?"

Remember: You're Jules, not ChatGPT. Be yourself.${userContext}`;
  
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
- product_recommendation: Shopping requests, product links, "where to buy", "show me links"
- confidence_boost: Emotional support, feeling down, confidence issues
- conversation: General chat, casual conversation

Conversation context:
${contextText}

State context:
${stateContext.join('\n')}

Current user message: "${message}"

Respond with ONLY a JSON object in this exact format:
{"intent": "intent_name"}

Examples:
- User says "yes" after Jules offered images → {"intent": "style_images"}
- User asks "where to buy" → {"intent": "product_recommendation"}
- User asks "what should I wear" → {"intent": "style_feedback"}
- User says "I'm nervous" → {"intent": "confidence_boost"}
- User asks "how are you" → {"intent": "conversation"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: classifierPrompt }],
      max_tokens: 50,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    
    // Parse JSON response
    try {
      const result = JSON.parse(response);
      const validIntents = ['style_feedback', 'style_images', 'product_recommendation', 'confidence_boost', 'conversation'];
      
      if (validIntents.includes(result.intent)) {
        console.log(`DEBUG: LLM intent classification: "${result.intent}"`);
        return result.intent;
      } else {
        console.log(`DEBUG: Invalid intent from LLM: "${result.intent}", defaulting to style_feedback`);
        return 'style_feedback';
      }
    } catch (parseError) {
      console.error('JSON parse error from LLM classifier:', parseError);
      console.log('DEBUG: Defaulting to style_feedback due to parse error');
      return 'style_feedback';
    }
    
  } catch (error) {
    console.error('LLM intent classification failed:', error.message);
    console.log('DEBUG: Defaulting to style_feedback due to classification error');
    return 'style_feedback';
  }
}

// Function to get mode-specific instructions
function getModeInstructions(mode) {
  return julesConfig.modes[mode]?.style || julesConfig.modes.conversation.style;
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

  // FIX FORMATTING: Keep natural paragraph structure
  // Only clean up excessive line breaks, don't force sentence breaks
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  return cleanedText.trim();
}

// Extract outfit pieces from Jules's response for context tracking
function extractOutfitPiecesFromResponse(response) {
  const outfitPieces = [];
  const responseLower = response.toLowerCase();
  
  // Look for specific clothing items Jules recommended
  const clothingPatterns = [
    /dark jeans/g, /light jeans/g, /black jeans/g, /white sneakers/g, /black sneakers/g,
    /bomber jacket/g, /leather jacket/g, /denim jacket/g, /blazer/g, /white tee/g,
    /white t-shirt/g, /graphic tee/g, /button-up shirt/g, /polo shirt/g, /chinos/g,
    /khakis/g, /vans/g, /converse/g, /loafers/g, /boots/g, /oxford shirt/g, /henley/g,
    /desert boots/g, /harrington jacket/g, /chore jacket/g, /overshirt/g
  ];
  
  clothingPatterns.forEach(pattern => {
    const matches = responseLower.match(pattern);
    if (matches) {
      outfitPieces.push(...matches);
    }
  });
  
  // Look for color + item combinations
  const colors = ['dark', 'light', 'black', 'white', 'navy', 'olive', 'gray', 'grey', 'blue', 'red'];
  const items = ['jeans', 'pants', 'shirt', 'tee', 'jacket', 'sneakers', 'shoes'];
  colors.forEach(color => {
    items.forEach(item => {
      const pattern = new RegExp(`${color} ${item}`, 'gi');
      const matches = responseLower.match(pattern);
      if (matches) {
        outfitPieces.push(...matches);
      }
    });
  });
  
  return [...new Set(outfitPieces)];
}

// Extract product links from Jules's response
function extractProductLinksFromResponse(response) {
  const products = [];
  
  // Multiple patterns to match different formats Jules might use
  
  // Pattern 1: "**Product Name** - Description\n   - Price: $X\n   - [Link Text](URL)"
  const pattern1 = /\*\*(.*?)\*\*\s*-\s*(.*?)(?:\n\s*-\s*Price:\s*\$(\d+))?\s*\n\s*-\s*\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Pattern 2: "Product Name - $Price\n[Link Text](URL)"
  const pattern2 = /([^-\n]+?)\s*-\s*\$(\d+)\s*\n\s*\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Pattern 3: "Product Name\nPrice: $X\n[Link Text](URL)"
  const pattern3 = /([^-\n]+?)\s*\n\s*Price:\s*\$(\d+)\s*\n\s*\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Pattern 4: "Product Name - Description\n[Link Text](URL)"
  const pattern4 = /([^-\n]+?)\s*-\s*([^-\n]+?)\s*\n\s*\[([^\]]+)\]\(([^)]+)\)/g;
  
  // Pattern 5: Simple markdown links with product names
  const pattern5 = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  let match;
  
  // Try pattern 1
  while ((match = pattern1.exec(response)) !== null) {
    const [, productName, description, price, linkText, url] = match;
    const brandMatch = productName.match(/(Nike|Adidas|Converse|Vans|Puma|Reebok|New Balance|Common Projects|Clarks|Banana Republic|J.Crew|Club Monaco|Uniqlo|H&M|Zara|ASOS|Nordstrom|Macy's|Target|Walmart)/i);
    const brand = brandMatch ? brandMatch[1] : '';
    
    products.push({
      title: productName.trim(),
      link: url,
      image: '', // Will be filled by frontend or product search
      price: price ? `$${price}` : '',
      description: description.trim(),
      brand: brand,
      source: 'jules_response'
    });
  }
  
  // Try pattern 2
  while ((match = pattern2.exec(response)) !== null) {
    const [, productName, price, linkText, url] = match;
    const brandMatch = productName.match(/(Nike|Adidas|Converse|Vans|Puma|Reebok|New Balance|Common Projects|Clarks|Banana Republic|J.Crew|Club Monaco|Uniqlo|H&M|Zara|ASOS|Nordstrom|Macy's|Target|Walmart)/i);
    const brand = brandMatch ? brandMatch[1] : '';
    
    products.push({
      title: productName.trim(),
      link: url,
      image: '',
      price: `$${price}`,
      description: linkText.trim(),
      brand: brand,
      source: 'jules_response'
    });
  }
  
  // Try pattern 3
  while ((match = pattern3.exec(response)) !== null) {
    const [, productName, price, linkText, url] = match;
    const brandMatch = productName.match(/(Nike|Adidas|Converse|Vans|Puma|Reebok|New Balance|Common Projects|Clarks|Banana Republic|J.Crew|Club Monaco|Uniqlo|H&M|Zara|ASOS|Nordstrom|Macy's|Target|Walmart)/i);
    const brand = brandMatch ? brandMatch[1] : '';
    
    products.push({
      title: productName.trim(),
      link: url,
      image: '',
      price: `$${price}`,
      description: linkText.trim(),
      brand: brand,
      source: 'jules_response'
    });
  }
  
  // Try pattern 4
  while ((match = pattern4.exec(response)) !== null) {
    const [, productName, description, linkText, url] = match;
    const brandMatch = productName.match(/(Nike|Adidas|Converse|Vans|Puma|Reebok|New Balance|Common Projects|Clarks|Banana Republic|J.Crew|Club Monaco|Uniqlo|H&M|Zara|ASOS|Nordstrom|Macy's|Target|Walmart)/i);
    const brand = brandMatch ? brandMatch[1] : '';
    
    products.push({
      title: productName.trim(),
      link: url,
      image: '',
      price: '',
      description: description.trim(),
      brand: brand,
      source: 'jules_response'
    });
  }
  
  // Try pattern 5 for simple links (fallback)
  if (products.length === 0) {
    while ((match = pattern5.exec(response)) !== null) {
      const [, linkText, url] = match;
      // Only add if it looks like a product link (not just any link)
      if (url.includes('amazon.com') || url.includes('nordstrom.com') || url.includes('macys.com') || 
          url.includes('target.com') || url.includes('walmart.com') || url.includes('asos.com') ||
          url.includes('hm.com') || url.includes('zara.com') || url.includes('uniqlo.com') ||
          url.includes('bananarepublic.com') || url.includes('jcrew.com') || url.includes('clubmonaco.com')) {
        
        const brandMatch = linkText.match(/(Nike|Adidas|Converse|Vans|Puma|Reebok|New Balance|Common Projects|Clarks|Banana Republic|J.Crew|Club Monaco|Uniqlo|H&M|Zara|ASOS|Nordstrom|Macy's|Target|Walmart)/i);
        const brand = brandMatch ? brandMatch[1] : '';
        
        products.push({
          title: linkText.trim(),
          link: url,
          image: '',
          price: '',
          description: 'Product recommendation from Jules',
          brand: brand,
          source: 'jules_response'
        });
      }
    }
  }
  
  // Remove duplicates based on URL
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => p.link === product.link)
  );
  
  console.log('DEBUG: Extracted products from Jules response:', uniqueProducts.length);
  return uniqueProducts;
}

// Main chat function
async function chat(req, res) {
  try {
    const { message, context } = req.body;
    const userId = req.user?.id; // Get userId from auth middleware

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user data if userId provided and not anonymous
    let userData = null;
    if (userId && userId !== 'anonymous' && userId !== 'test') {
      try {
        // Check if userId is a valid ObjectId
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(userId)) {
          userData = await User.findById(userId);
        }
      } catch (error) {
        console.log('User lookup error:', error.message);
        // Continue without user data
      }
    }

    // Use context from frontend if provided, otherwise load from database
    let conversationMessages = [];
    let conversation = null;
    
    if (context && Array.isArray(context)) {
      // Use context from frontend (for new sessions)
      conversationMessages = [...context];
    } else {
      // Load from database (for existing sessions)
      conversation = await Conversation.findOne({ userId: userId || 'anonymous' });
      if (!conversation) {
        conversation = new Conversation({ userId: userId || 'anonymous', messages: [] });
      }
      conversationMessages = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // Add current user message
    conversationMessages.push({
      role: 'user',
      content: message
    });

    // Determine intent and get mode instructions
    const intent = await determineIntent(message, conversationMessages, conversation?.state || {});
    const modeInstructions = getModeInstructions(intent);

    // Build system prompt
    const systemPrompt = await getSystemPrompt(userId);
    
    // Get user for tone adjustment
    let user = null;
    try {
      user = await User.findById(userId);
    } catch (error) {
      console.error('Error fetching user for tone adjustment:', error);
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
    
    const fullSystemPrompt = `${systemPrompt}${toneAdjustment}\n\nCURRENT MODE: ${intent}\nMODE INSTRUCTIONS: ${modeInstructions}`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: fullSystemPrompt },
      ...conversationMessages.slice(-10)
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: julesConfig.modes[intent]?.max_tokens || 2000,
      temperature: 0.8
    });

    const response = completion.choices[0].message.content;
    const cleanedResponse = stripClosers(response);

    // Update conversation state based on Jules's response
    const updateState = {};
    if (cleanedResponse.toLowerCase().includes('pull up some pics') || 
        cleanedResponse.toLowerCase().includes('show you what') ||
        cleanedResponse.toLowerCase().includes('want me to pull up')) {
      updateState.offeredImagesAt = new Date();
    }
    if (cleanedResponse.toLowerCase().includes('pull up links') || 
        cleanedResponse.toLowerCase().includes('where to buy') ||
        cleanedResponse.toLowerCase().includes('show me links')) {
      updateState.offeredLinksAt = new Date();
    }
    updateState.lastIntent = intent;
    
    // Extract outfit pieces from Jules's response for context
    const outfitPieces = extractOutfitPiecesFromResponse(cleanedResponse);
    if (outfitPieces.length > 0) {
      updateState.lastOutfitPieces = outfitPieces;
      updateState.lastStyleAdviceAt = new Date();
    }

    // Check if this is a product recommendation request or user is asking for links
    let products = [];
    let styleImages = [];
    let productResponse = null;
    
    // Only go to products for explicit shopping requests, not for style advice or examples
    const isExplicitShoppingRequest = intent === 'product_recommendation' || 
      (message.toLowerCase().includes('pull up links') && intent === 'product_recommendation') || 
      (message.toLowerCase().includes('show me links') && intent === 'product_recommendation') || 
      (message.toLowerCase().includes('get links') && intent === 'product_recommendation') ||
      message.toLowerCase().includes('buy') ||
      message.toLowerCase().includes('shop') ||
      message.toLowerCase().includes('where to buy');
    
    const isStyleAdviceRequest = message.toLowerCase().includes('outfit advice') || 
      message.toLowerCase().includes('what should i wear') || 
      message.toLowerCase().includes('what to wear') ||
      message.toLowerCase().includes('style advice');
    
    // Don't go to products for style advice requests
    console.log('DEBUG: Product routing decision:');
    console.log('- isExplicitShoppingRequest:', isExplicitShoppingRequest);
    console.log('- isStyleAdviceRequest:', isStyleAdviceRequest);
    console.log('- message includes examples:', message.toLowerCase().includes('examples'));
    console.log('- Will go to products route:', isExplicitShoppingRequest && !isStyleAdviceRequest && !message.toLowerCase().includes('examples'));
    
    if (isExplicitShoppingRequest && !isStyleAdviceRequest && !message.toLowerCase().includes('examples')) {
      try {
        // Use the products test route to generate Jules's response and get products
        const productsResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/products/test`, {
          message,
          conversation: conversationMessages
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (productsResponse.data.response) {
          // Use Jules's response from the products route
          productResponse = productsResponse.data.response;
          products = productsResponse.data.allProducts || [];
        }
      } catch (error) {
        console.error('Product search error:', error.message);
        // Continue without products if search fails
      }
    }
    
    // Check if this is a style images request
    if (intent === 'style_images') {
      try {
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

        if (inspirationResponse.data.response) {
          // Use Jules's response from the inspiration route
          productResponse = inspirationResponse.data.response;
        }
        
        if (inspirationResponse.data.hasImages && inspirationResponse.data.images.length > 0) {
          styleImages = inspirationResponse.data.images;
        }
      } catch (error) {
        console.error('Inspiration search error:', error.message);
        // Continue without images if search fails
      }
    }

    // Use product response if available, otherwise use the general response
    const finalResponse = productResponse || cleanedResponse;
    
    // Add assistant response to conversation messages
    conversationMessages.push({
      role: 'assistant',
      content: finalResponse
    });

    // === LEARNING INTEGRATION TEMPORARILY DISABLED ===
    // TODO: Re-enable learning system after fixing startup issues

    // Save conversation to database if we have a userId
    if (userId && userId !== 'anonymous' && userId !== 'test') {
      let conversation = await Conversation.findOne({ userId: userId });
      if (!conversation) {
        conversation = new Conversation({ userId: userId, messages: [] });
      }
      
      // Update conversation with new messages
      conversation.messages = conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date()
      }));
      
      // Update state flags
      if (Object.keys(updateState).length > 0) {
        conversation.state = { ...conversation.state, ...updateState };
      }
      
      await conversation.save();
    }

    // Limit products to 3 for initial display, mark if there are more
    const initialProducts = products.slice(0, 3);
    const hasMoreProducts = products.length > 3;
    
    res.json({
      response: finalResponse,
      intent: intent,
      products: initialProducts,
      allProducts: products, // Include all products for "show more"
      hasMoreProducts: hasMoreProducts,
      images: styleImages
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  chat,
  determineIntent,
  getSystemPrompt
};