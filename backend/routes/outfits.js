const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateOutfits,
  getOutfits,
  getOutfit,
  saveOutfit,
  updateOutfit,
  deleteOutfit,
  addOutfitFeedback,
  getOutfitStats
} = require('../controllers/outfitController');
const WardrobeItem = require('../models/WardrobeItem');
const ClosetItem = require('../models/ClosetItem');
const FitCheck = require('../models/FitCheck');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate outfits based on context and user profile
router.post('/generate', auth, generateOutfits);

// Generate visual outfits for a specific occasion
router.post('/generate-visual', auth, async (req, res) => {
  try {
    const { event, vibe, season, formality, count = 3 } = req.body;
    const userId = req.user.id;

    // Call the generateOutfits function
    const generateReq = {
      ...req,
      body: { event, vibe, season, formality, count, userId }
    };

    await generateOutfits(generateReq, res);
  } catch (error) {
    console.error('Error generating visual outfits:', error);
    res.status(500).json({ error: 'Failed to generate visual outfits' });
  }
});

// Get all outfits with filters
router.get('/', auth, getOutfits);

// Get outfit statistics
router.get('/stats', auth, getOutfitStats);

// Save a new outfit
router.post('/', auth, saveOutfit);

// Get specific outfit
router.get('/:id', auth, getOutfit);

// Update outfit
router.put('/:id', auth, updateOutfit);

// Add feedback to outfit
router.post('/:id/feedback', auth, addOutfitFeedback);

// Delete outfit
router.delete('/:id', auth, deleteOutfit);

// Legacy routes for backward compatibility
router.post('/create', auth, async (req, res) => {
  try {
    const { occasion, season, style, budget, userId } = req.body;
    
    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    // Redirect to new generate endpoint
    const generateReq = {
      ...req,
      body: {
        event: occasion,
        season: season,
        vibe: style ? [style] : [],
        formality: 'smart-casual',
        count: 3,
        userId
      }
    };

    const { generateOutfits } = require('../controllers/outfitController');
    await generateOutfits(generateReq, res);
    
  } catch (error) {
    console.error('Legacy outfit creation error:', error);
    res.status(500).json({ error: 'Outfit creation failed' });
  }
});

router.post('/analyze', auth, async (req, res) => {
  try {
    const { outfitDescription, imageUrl, userId } = req.body;
    
    if (!outfitDescription) {
      return res.status(400).json({ error: 'Outfit description is required' });
    }

    // Use chat controller for analysis
    const { chat } = require('../controllers/chatController');
    const enhancedMessage = `[OUTFIT ANALYSIS REQUEST] Analyze this outfit: ${outfitDescription}${imageUrl ? ' [IMAGE PROVIDED]' : ''}`;
    
    const chatReq = {
      ...req,
      body: {
        message: enhancedMessage,
        userId
      }
    };

    await chat(chatReq, res);
    
  } catch (error) {
    console.error('Outfit analysis error:', error);
    res.status(500).json({ error: 'Outfit analysis failed' });
  }
});

router.post('/seasonal', auth, async (req, res) => {
  try {
    const { season, style, budget, userId } = req.body;
    
    if (!season) {
      return res.status(400).json({ error: 'Season is required' });
    }

    // Redirect to new generate endpoint
    const generateReq = {
      ...req,
      body: {
        season: season,
        vibe: style ? [style] : [],
        formality: 'smart-casual',
        count: 5,
        userId
      }
    };

    const { generateOutfits } = require('../controllers/outfitController');
    await generateOutfits(generateReq, res);
    
  } catch (error) {
    console.error('Seasonal outfit error:', error);
    res.status(500).json({ error: 'Seasonal outfit recommendations failed' });
  }
});

// Suggest a fit based on closet items with AI analysis
router.post('/suggest', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { context = 'casual' } = req.body; // Optional context like "casual", "work", "night out", etc.

    // Get user's closet items
    const wardrobeItems = await WardrobeItem.find({ userId });
    const closetItems = await ClosetItem.find({ userId });

    // Combine items
    const allItems = [...wardrobeItems, ...closetItems];

    if (allItems.length === 0) {
      return res.status(400).json({ 
        error: 'No items found in closet',
        suggestion: 'Add some clothing items to your closet first'
      });
    }

    // Filter items by category
    const tops = allItems.filter(item => 
      item.tags?.category === 'top' || item.type === 'top'
    );
    const bottoms = allItems.filter(item => 
      item.tags?.category === 'bottom' || item.type === 'bottom'
    );
    const footwear = allItems.filter(item => 
      item.tags?.category === 'footwear' || item.type === 'footwear'
    );
    const outerwear = allItems.filter(item => 
      item.tags?.category === 'outerwear' || item.type === 'outerwear'
    );

    if (tops.length === 0 || bottoms.length === 0) {
      return res.status(400).json({ 
        error: 'Need at least a top and bottom to suggest a fit',
        suggestion: 'Add more clothing items to your closet'
      });
    }

    // Use AI to analyze and select the best outfit combination
    const outfitAnalysis = await analyzeOutfitCombination({
      tops,
      bottoms,
      footwear,
      outerwear,
      context,
      userId
    });

    // Create fit check style response
    const fitCheckData = {
      id: `suggestion_${Date.now()}`,
      eventContext: context,
      analysis: outfitAnalysis,
      items: outfitAnalysis.selectedItems,
      createdAt: new Date(),
      type: 'suggestion'
    };

    // Save as a fit check
    const fitCheck = new FitCheck({
      userId,
      eventContext: context,
      originalImageUrl: outfitAnalysis.selectedItems[0]?.image?.url || outfitAnalysis.selectedItems[0]?.imageUrl || 'https://via.placeholder.com/400x600?text=Outfit+Suggestion',
      analysis: {
        feedback: outfitAnalysis.feedback,
        overallRating: outfitAnalysis.rating,
        tone: 3
      },
      items: outfitAnalysis.selectedItems.map(item => ({
        itemId: item._id || item.itemId,
        name: item.name || 'Clothing item',
        imageUrl: item.image?.url || item.imageUrl,
        category: item.tags?.category || item.type
      })),
      type: 'suggestion'
    });

    await fitCheck.save();

    res.json({
      fitCheck: fitCheckData,
      allClosetItems: allItems,
      saved: true
    });

  } catch (error) {
    console.error('Error suggesting fit:', error);
    res.status(500).json({ error: 'Failed to suggest fit' });
  }
});

// AI-powered outfit combination analysis
async function analyzeOutfitCombination({ tops, bottoms, footwear, outerwear, context, userId }) {
  try {
    // Create detailed item descriptions for AI analysis
    const itemDescriptions = [];
    
    tops.forEach((item, index) => {
      const colors = item.tags?.colors?.filter(c => c !== 'unknown').join(', ') || 'neutral';
      const material = item.tags?.material?.filter(m => m !== 'unknown').join(', ') || 'cotton';
      const formality = item.tags?.formality || 'casual';
      itemDescriptions.push(`Top ${index + 1}: ${item.name} (${colors}, ${material}, ${formality})`);
    });

    bottoms.forEach((item, index) => {
      const colors = item.tags?.colors?.filter(c => c !== 'unknown').join(', ') || 'neutral';
      const material = item.tags?.material?.filter(m => m !== 'unknown').join(', ') || 'cotton';
      const formality = item.tags?.formality || 'casual';
      itemDescriptions.push(`Bottom ${index + 1}: ${item.name} (${colors}, ${material}, ${formality})`);
    });

    footwear.forEach((item, index) => {
      const colors = item.tags?.colors?.filter(c => c !== 'unknown').join(', ') || 'neutral';
      const material = item.tags?.material?.filter(m => m !== 'unknown').join(', ') || 'leather';
      const formality = item.tags?.formality || 'casual';
      itemDescriptions.push(`Footwear ${index + 1}: ${item.name} (${colors}, ${material}, ${formality})`);
    });

    outerwear.forEach((item, index) => {
      const colors = item.tags?.colors?.filter(c => c !== 'unknown').join(', ') || 'neutral';
      const material = item.tags?.material?.filter(m => m !== 'unknown').join(', ') || 'cotton';
      const formality = item.tags?.formality || 'casual';
      itemDescriptions.push(`Outerwear ${index + 1}: ${item.name} (${colors}, ${material}, ${formality})`);
    });

    const allItems = [...tops, ...bottoms, ...footwear, ...outerwear];
    const itemsDescription = itemDescriptions.join('\n');

    // Use OpenAI to analyze and select the best combination
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Jules, a fashion expert and personal stylist. Your job is to analyze a user's closet items and create the best outfit combination for a specific context.

Context: ${context}

Available items:
${itemsDescription}

Analyze these items and create the best outfit combination. Consider:
1. Color coordination and harmony
2. Style compatibility (casual, formal, etc.)
3. Appropriateness for the context
4. Material and texture combinations
5. Overall aesthetic appeal

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks. Use this exact format:
{
  "selectedTopIndex": 0,
  "selectedBottomIndex": 0,
  "selectedFootwearIndex": 0,
  "selectedOuterwearIndex": null,
  "rating": 4,
  "feedback": "Detailed explanation of why this combination works well, including color coordination, style matching, and context appropriateness. Be specific about the items chosen and why they complement each other.",
  "styleNotes": "Brief style notes about the combination"
}

Choose the best combination based on fashion principles and the given context.`
        }
      ],
      max_tokens: 800
    });

    let analysisText = response.choices[0].message.content;
    
    // Clean up markdown formatting if present
    if (analysisText.includes('```json')) {
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(analysisText);
    
    // Select the items based on AI analysis
    const selectedTop = tops[analysis.selectedTopIndex] || tops[0];
    const selectedBottom = bottoms[analysis.selectedBottomIndex] || bottoms[0];
    const selectedFootwear = footwear[analysis.selectedFootwearIndex] || footwear[0];
    const selectedOuterwear = analysis.selectedOuterwearIndex !== null ? outerwear[analysis.selectedOuterwearIndex] : null;

    const selectedItems = [selectedTop, selectedBottom, selectedFootwear].filter(Boolean);
    if (selectedOuterwear) selectedItems.push(selectedOuterwear);

    return {
      selectedItems,
      rating: analysis.rating,
      feedback: analysis.feedback,
      styleNotes: analysis.styleNotes
    };

  } catch (error) {
    console.error('Error in AI outfit analysis:', error);
    
    // Fallback to simple selection with basic feedback
    const selectedTop = tops[0];
    const selectedBottom = bottoms[0];
    const selectedFootwear = footwear[0];
    
    const selectedItems = [selectedTop, selectedBottom, selectedFootwear].filter(Boolean);
    
    return {
      selectedItems,
      rating: 3,
      feedback: `Here's a great ${context} outfit suggestion for you!\n\n**Top:** ${selectedTop.name}\n**Bottom:** ${selectedBottom.name}\n${selectedFootwear ? `**Footwear:** ${selectedFootwear.name}\n` : ''}\n\nThis combination creates a balanced, stylish look that's perfect for ${context} occasions. The pieces work well together and should give you confidence!`,
      styleNotes: "Classic combination that works well together"
    };
  }
}

module.exports = router; 