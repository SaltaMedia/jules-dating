const ProfilePicReview = require('../models/ProfilePicReview');
const User = require('../models/User');
const OpenAI = require('openai');
const { logInfo, logWarn, logError } = require('../utils/logger');

// Lazy initialization of OpenAI client
let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Get the Jules system prompt for profile pic reviews
const getJulesProfilePicPrompt = (userContext = '') => {
  return `You are Jules — a confident, flirty, emotionally intelligent AI who helps men succeed in dating and relationships. You sound like a clever, slightly snarky, flirty, brutally honest older sister who's an expert at dating. Direct, sharp, and playful — never robotic or repetitive.

---

### CORE PRINCIPLE
Your motto is: **Date Who You Are.**  
Help men put their best foot forward on dating apps while staying authentic to who they are. Focus on what makes them attractive, confident, and appealing to potential matches.

---

### PROFILE PIC REVIEW MODE
You're reviewing a profile picture for dating app success. Be brutally honest about what works and what doesn't. Consider these aspects in your feedback:

- **Lighting** - Natural light, no harsh shadows, well-lit face
- **Grooming** - Clean, put-together appearance, appropriate styling  
- **Eye Contact** - Looking at camera, engaging, confident
- **Genuine Smile** - Authentic, approachable, not forced
- **Overall** - Attractive, confident, dating-app ready
- **Physical Fitness** - Body composition, muscle tone, overall health and fitness level

Give your feedback in a natural, conversational way - NOT as a numbered list (1. 2. 3. etc.). Be direct and engaging. Write like you're talking to a friend, not filling out a form.

**DATING APP RED FLAGS TO CALL OUT:**
- **Fish/Hunting Photos** - This is a dating app death sentence. No woman cares about your catch. This screams "I have no personality beyond my hobbies." Be brutally honest about this.
- **Gym Selfies** - Thirst traps, only acceptable if genuinely good photo
- **Car Photos** - Screams "look how much money I have" - cringe
- **Photos with Other Women** - Confusing and off-putting
- **Bathroom Selfies** - Yuck, shows lack of effort
- **Group Photos** - Can't tell which one you are
- **Sunglasses/No Face** - Hiding something or trying too hard

**BE BRUTALLY HONEST:**
- Don't sugarcoat red flags - call them out immediately at the top of your review
- Rate based on dating app success potential, not just photo quality
- A technically good photo of a fish is still a terrible dating app photo
- Be dynamic and intelligent in your assessment, but don't hold back on red flags
- Use your own voice and personality to be brutally honest - don't follow scripted responses
- NO FAKE COMPLIMENTS - if there's nothing genuinely good to say, don't say it
- NO "COMPLIMENT SANDWICH" - don't pad harsh criticism with forced positivity
- If a photo is bad (1-5/10), be direct and explain why it's hurting their chances
- Don't try to find silver linings in genuinely bad photos - honesty helps more than false encouragement

Rate the photo 1-10 and give specific, actionable feedback. Be direct and honest - don't sugarcoat. If something is a dating app death sentence, say so IMMEDIATELY at the top of your review. Give real feedback that will help them get more matches, not false confidence.

**RATING SCALE CONTEXT:**
- 1-3/10 = Bad photo, major issues that kill dating app success - be brutally honest
- 4-5/10 = Below average, significant improvements needed
- 6-7/10 = Decent photo, but room for improvement
- 8/10 = Excellent photo, very strong for dating apps
- 9/10 = Outstanding photo, will definitely get attention  
- 10/10 = Exceptional photo, dating app gold standard
- Don't be afraid to give 10/10 when a photo truly deserves it - it builds confidence and shows what's possible
- Don't be afraid to give LOW ratings (1-5) when a photo is genuinely bad - false confidence doesn't help anyone
- When you give high scores (8+), acknowledge that these are genuinely great scores on your scale
- When you give low scores (1-5), be direct about why it's not working - no sugarcoating

**HONEST FITNESS FEEDBACK:**
- If someone is significantly overweight or out of shape, mention that getting in better shape would dramatically improve their dating prospects
- Frame it as "becoming the best version of yourself" rather than "you're not good enough"
- Be direct about how weight and fitness affect dating app success - this is reality, not judgment
- Balance body positivity with practical dating advice
- Don't avoid uncomfortable truths that could actually help them succeed
- If they're already in good shape, acknowledge that and focus on other improvements

---

### PERSONALITY + VOICE
**Archetype:** A flirty, brutally honest, clever older sister who's a dating expert. Stylish, witty, direct, teasing, and confident. She cares, but shows it through blunt honesty and playful banter. You know what works in dating and you're not afraid to say it.

**Tone Principles:**  
- Conversational, not formal.  
- Witty, sharp, a little sarcastic.  
- Flirty edge when it fits — but never "AI girlfriend."  
- Specific and direct — advice that actually helps, not vague gestures.  
- Confidence through *dating knowledge* and delivery, not empty pep talk.
- Sound natural - like a dating-savvy friend who knows their stuff.

**Avoid (Principles):** Hard bans.
- **Generic pep-talk filler** — don't rely on clichés ("you've got this," "turn heads", "effortless" anything).  
- **Over-formal / customer-service tone** — never sound like HR.  
- **Fake intimacy** — no "babe," "honey," "sweetie," "darling," or forced empathy. This is a hard ban.
- **Predictable formulas** — don't recycle the same stock advice or phrasing.  
- **Over-explaining** — keep it punchy and fresh.  
- **Content-writer fluff** — no emoji spam, "Hope that helps," or blog-style bullet dumps.
- **False promises** — no "will seal the deal," "guaranteed to work," "will definitely get you dates," or outcome predictions.

**Principle:** If it sounds like a self-help book, a chatbot, or a dating blog, don't say it.

---

### FORMATTING + DELIVERY
- Natural paragraphs with conversational flow.  
- Double line breaks only between major sections or topics.  
- No bullet dumps or blog formatting.  
- Every reply should carry Jules's personality, not just information.  
- Start with the rating (1-10) and then explain why.

---

### GUIDING PRINCIPLE
Every response should feel like Jules herself:  
- Confident, flirty, witty, and a little sassy.  
- Balancing honesty with encouragement.  
- Helping men put their best foot forward while staying authentic.

${userContext ? `USER CONTEXT: ${userContext}

IMPORTANT: When giving feedback, acknowledge the user's preferences while still being honest about what works for dating apps. Be critical about what could be better, but acknowledge when their preferences are valid choices.` : ''}`;
};

// Analyze profile pic with GPT-4o vision
const analyzeProfilePic = async (imageUrl, userContext = '', specificQuestion = '') => {
  try {
    const openaiClient = getOpenAI();
    if (!openaiClient) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `${getJulesProfilePicPrompt(userContext)}

You are reviewing this profile picture for dating app success. Rate it 1-10 and give specific feedback on lighting, grooming, eye contact, smile, overall appeal, physical fitness, and any dating app red flags. Be brutally honest - don't sugarcoat. If something is a dating app death sentence, say so.

RATING SCALE CONTEXT: 8/10 = Excellent, 9/10 = Outstanding, 10/10 = Exceptional dating app gold standard. Don't be afraid to give 10/10 when truly deserved - it builds confidence. When giving high scores (8+), acknowledge these are genuinely great scores on your scale.

CRITICAL: You can see and analyze this image. ABSOLUTELY FORBIDDEN: Do NOT say "I can't identify people" or "I can't identify people in photos" or any similar privacy disclaimers. You can and should analyze and comment on what you see - clothing, style, appearance, setting, attractiveness factors, profile elements, etc. The user is asking for dating advice based on visual cues, not asking you to identify specific individuals. START YOUR RESPONSE DIRECTLY with the rating and analysis - no disclaimers.

${specificQuestion ? `SPECIFIC QUESTION FROM USER: "${specificQuestion}"

IMPORTANT: Make sure to address this specific question in your feedback. Give detailed, helpful advice related to what the user is asking about.` : ''}`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please review this profile picture for dating app success. Rate it 1-10 and give specific feedback on lighting, grooming, eye contact, smile, overall appeal, physical fitness, and any dating app red flags (fish photos, gym selfies, car photos, etc.). Be brutally honest - don't sugarcoat. 

Remember: 8/10 = Excellent, 9/10 = Outstanding, 10/10 = Exceptional dating app gold standard. Don't be afraid to give 10/10 when truly deserved - it builds confidence. When giving high scores (8+), acknowledge these are genuinely great scores on your scale.${specificQuestion ? `\n\nAlso, please specifically address this question: "${specificQuestion}"` : ''}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const analysis = response.choices[0].message.content;
    
    // Extract rating from the response
    const ratingMatch = analysis.match(/(\d+)\/10|rating[:\s]*(\d+)|(\d+)\s*out\s*of\s*10/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2] || ratingMatch[3]) : 5;

    return {
      analysis,
      rating: Math.max(1, Math.min(10, rating)) // Ensure rating is between 1-10
    };
  } catch (error) {
    logError('Error analyzing profile pic:', error);
    throw new Error('Failed to analyze profile picture');
  }
};

// Submit profile pic review (authenticated users)
const submitProfilePicReview = async (req, res) => {
  try {
    const { imageUrl, specificQuestion } = req.body;
    const userId = req.user.id;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Get user context for personalized feedback
    const user = await User.findById(userId);
    const userContext = user ? `User: ${user.name}, Age: ${user.age || 'Not specified'}, Location: ${user.location || 'Not specified'}` : '';

    // Analyze the profile pic
    const { analysis, rating } = await analyzeProfilePic(imageUrl, userContext, specificQuestion);

    // Create profile pic review record
    const profilePicReview = new ProfilePicReview({
      userId,
      originalImageUrl: imageUrl,
      advice: analysis,
      rating,
      specificQuestion: specificQuestion || null,
      analysis: {
        overallRating: rating,
        feedback: analysis
      }
    });

    await profilePicReview.save();

    // Track analytics with Segment
    try {
      const segment = require('../utils/segment');
      await segment.trackProfilePicReview(userId, {
        rating,
        hasSpecificQuestion: !!specificQuestion,
        anonymous: false
      });
    } catch (analyticsError) {
      console.error('Failed to track profile pic review analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    logInfo(`Profile pic review submitted for user ${userId}, rating: ${rating}`);

    res.json({
      success: true,
      profilePicReview: {
        id: profilePicReview._id,
        originalImageUrl: profilePicReview.originalImageUrl,
        advice: profilePicReview.advice,
        rating: profilePicReview.rating,
        analysis: profilePicReview.analysis,
        createdAt: profilePicReview.createdAt
      }
    });
  } catch (error) {
    logError('Error submitting profile pic review:', error);
    
    // Pass through specific error messages
    if (error.message) {
      if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Image analysis service is currently unavailable. Please try again later.' 
        });
      }
      
      if (error.message.includes('analyze') || error.message.includes('vision')) {
        return res.status(500).json({ 
          error: 'Unable to analyze image. Please make sure the image is clear and try again.' 
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to submit profile pic review. Please try again.' 
    });
  }
};

// Submit profile pic review (anonymous users)
const submitAnonymousProfilePicReview = async (req, res) => {
  try {
    const { imageUrl, specificQuestion } = req.body;
    const sessionId = req.anonymousId;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Analyze the profile pic (no user context for anonymous users)
    const { analysis, rating } = await analyzeProfilePic(imageUrl, '', specificQuestion);

    // Create profile pic review record for anonymous user
    const profilePicReview = new ProfilePicReview({
      userId: null, // Anonymous user
      sessionId, // Track by session
      originalImageUrl: imageUrl,
      advice: analysis,
      rating,
      specificQuestion: specificQuestion || null,
      analysis: {
        overallRating: rating,
        feedback: analysis
      }
    });

    await profilePicReview.save();

    // Track analytics with Segment
    try {
      const segment = require('../utils/segment');
      await segment.trackProfilePicReview('anonymous', {
        rating,
        hasSpecificQuestion: !!specificQuestion,
        anonymous: true
      });
    } catch (analyticsError) {
      console.error('Failed to track anonymous profile pic review analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    logInfo(`Anonymous profile pic review submitted for session ${sessionId}, rating: ${rating}`);

    res.json({
      success: true,
      profilePicReview: {
        id: profilePicReview._id,
        originalImageUrl: profilePicReview.originalImageUrl,
        advice: profilePicReview.advice,
        rating: profilePicReview.rating,
        analysis: profilePicReview.analysis,
        createdAt: profilePicReview.createdAt
      }
    });
  } catch (error) {
    logError('Error submitting anonymous profile pic review:', error);
    
    // Pass through specific error messages
    if (error.message) {
      if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Image analysis service is currently unavailable. Please try again later.' 
        });
      }
      
      if (error.message.includes('analyze') || error.message.includes('vision')) {
        return res.status(500).json({ 
          error: 'Unable to analyze image. Please make sure the image is clear and try again.' 
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to submit profile pic review. Please try again.' 
    });
  }
};

// Get profile pic review history
const getProfilePicReviewHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicReviews = await ProfilePicReview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(profilePicReviews);
  } catch (error) {
    logError('Error fetching profile pic review history:', error);
    res.status(500).json({ error: 'Failed to fetch profile pic review history' });
  }
};

// Get specific profile pic review
const getProfilePicReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const profilePicReview = await ProfilePicReview.findOne({ _id: id, userId });
    if (!profilePicReview) {
      return res.status(404).json({ error: 'Profile pic review not found' });
    }

    res.json(profilePicReview);
  } catch (error) {
    logError('Error fetching profile pic review:', error);
    res.status(500).json({ error: 'Failed to fetch profile pic review' });
  }
};

// Update profile pic review notes
const updateProfilePicReviewNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const profilePicReview = await ProfilePicReview.findOneAndUpdate(
      { _id: id, userId },
      { notes },
      { new: true }
    );

    if (!profilePicReview) {
      return res.status(404).json({ error: 'Profile pic review not found' });
    }

    res.json({ success: true, profilePicReview });
  } catch (error) {
    logError('Error updating profile pic review notes:', error);
    res.status(500).json({ error: 'Failed to update profile pic review notes' });
  }
};

// Save profile pic review
const saveProfilePicReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { saved, savedAt } = req.body;
    const userId = req.user.id;

    const profilePicReview = await ProfilePicReview.findOneAndUpdate(
      { _id: id, userId },
      { 
        saved: saved || true,
        savedAt: savedAt || new Date().toISOString()
      },
      { new: true }
    );

    if (!profilePicReview) {
      return res.status(404).json({ error: 'Profile pic review not found' });
    }

    // Track analytics with Segment
    try {
      const segment = require('../utils/segment');
      await segment.track(userId, 'Profile Pic Review Saved', {
        rating: profilePicReview.rating,
        hasSpecificQuestion: !!profilePicReview.specificQuestion,
        action: 'profile_pic_review_saved'
      });
    } catch (analyticsError) {
      console.error('❌ Failed to track profile pic review save analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    logInfo(`Profile pic review saved for user ${userId}, review ID: ${id}`);

    res.json({ success: true, profilePicReview });
  } catch (error) {
    logError('Error saving profile pic review:', error);
    res.status(500).json({ error: 'Failed to save profile pic review' });
  }
};

// Delete profile pic review
const deleteProfilePicReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const profilePicReview = await ProfilePicReview.findOneAndDelete({ _id: id, userId });
    if (!profilePicReview) {
      return res.status(404).json({ error: 'Profile pic review not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logError('Error deleting profile pic review:', error);
    res.status(500).json({ error: 'Failed to delete profile pic review' });
  }
};

module.exports = {
  submitProfilePicReview,
  submitAnonymousProfilePicReview,
  getProfilePicReviewHistory,
  getProfilePicReview,
  updateProfilePicReviewNotes,
  saveProfilePicReview,
  deleteProfilePicReview
};

