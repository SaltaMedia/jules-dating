const Outfit = require('../models/Outfit');
const WardrobeItem = require('../models/WardrobeItem');
const UserProfile = require('../models/UserProfile');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate outfits based on context and user profile
const generateOutfits = async (req, res) => {
  try {
    const {
      event,
      vibe = [],
      weather = {},
      season,
      formality,
      count = 6,
      userId
    } = req.body;
    
    // Get user's wardrobe items first
    const WardrobeItem = require('../models/WardrobeItem');
    const ClosetItem = require('../models/ClosetItem');
    
    // Get both wardrobe items and closet items
    const verifiedWardrobeItems = await WardrobeItem.find({ 
      userId,
      verified: true // Only use verified items
    });
    
    const closetItems = await ClosetItem.find({ 
      userId,
      type: { $ne: 'outfit' } // Exclude outfit type items
    });
    
    // Convert closet items to wardrobe item format
    const convertedClosetItems = closetItems.map(item => ({
      _id: item._id,
      userId: item.userId,
      name: item.name,
      type: item.type,
      imageUrl: item.imageUrl,
      verified: true, // Treat closet items as verified
      category: item.type || 'other',
      color: item.tags?.find(tag => tag.includes('color')) || 'unknown',
      season: item.tags?.find(tag => tag.includes('season')) || 'all-season',
      formality: item.tags?.find(tag => tag.includes('formality')) || 'casual'
    }));
    
    // Combine both collections
    const allItems = [...verifiedWardrobeItems, ...convertedClosetItems];
    
    if (allItems.length < 1) {
      return res.status(400).json({ 
        error: 'Need at least 1 item to generate outfits',
        suggestion: `Upload more items to your closet first. You currently have ${allItems.length} items (${verifiedWardrobeItems.length} wardrobe items, ${closetItems.length} closet items).`
      });
    }
    
    // Use combined items for outfit generation
    const wardrobeItems = allItems;
    
    // Debug: Log item structure
    console.log('Total items found:', wardrobeItems.length);
    console.log('Sample item structure:', JSON.stringify(wardrobeItems[0], null, 2));
    console.log('Items with tags.category:', wardrobeItems.filter(item => item.tags && item.tags.category).length);
    console.log('Items with type field:', wardrobeItems.filter(item => item.type).length);
    
    if (wardrobeItems.length < 1) {
      return res.status(400).json({ 
        error: 'Need at least 1 item to generate outfits',
        suggestion: 'Upload more items to your closet first. You currently have ' + wardrobeItems.length + ' items.'
      });
    }
    
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      // Create a default profile if none exists
      const defaultProfile = {
        userId,
        sizes: { shirt: 'M', pants: '32x32', shoes: '10' },
        fitPreference: 'fitted',
        colorsLove: ['navy', 'gray', 'white'],
        colorsAvoid: ['neon', 'bright'],
        noGoItems: ['cargo pants', 'graphic tees']
      };
      
      // Use default profile for outfit generation
      const outfits = await assembleOutfits({
        wardrobeItems,
        userProfile: defaultProfile,
        context: { event, vibe, weather, season, formality },
        count: parseInt(count)
      });
      
      // Enhance outfits with visual data
      const enhancedOutfits = await Promise.all(
        outfits.map(async (outfit) => {
          const outfitWithImages = await enhanceOutfitWithImages(outfit, wardrobeItems);
          return outfitWithImages;
        })
      );
      
      res.json({
        outfits: enhancedOutfits,
        context: { event, vibe, weather, season, formality },
        userProfile: defaultProfile
      });
      return;
    }
    
    if (wardrobeItems.length < 3) {
      return res.status(400).json({ 
        error: 'Need at least 3 verified items to generate outfits',
        suggestion: 'Upload and verify more items in your closet first. You currently have ' + wardrobeItems.length + ' items.'
      });
    }
    
    // Generate outfits using the assembly algorithm
    const outfits = await assembleOutfits({
      wardrobeItems,
      userProfile,
      context: { event, vibe, weather, season, formality },
      count: parseInt(count)
    });
    
    // Enhance outfits with visual data
    const enhancedOutfits = await Promise.all(
      outfits.map(async (outfit) => {
        const outfitWithImages = await enhanceOutfitWithImages(outfit, wardrobeItems);
        return outfitWithImages;
      })
    );
    
    res.json({
      outfits: enhancedOutfits,
      context: { event, vibe, weather, season, formality },
      userProfile: {
        sizes: userProfile.sizes,
        fitPreference: userProfile.fitPreference,
        colorsLove: userProfile.colorsLove,
        colorsAvoid: userProfile.colorsAvoid,
        noGoItems: userProfile.noGoItems
      }
    });
  } catch (error) {
    console.error('Error generating outfits:', error);
    res.status(500).json({ error: 'Failed to generate outfits' });
  }
};

// Enhance outfit with visual data
const enhanceOutfitWithImages = async (outfit, wardrobeItems) => {
  try {
    // Get actual item images from wardrobe
    const outfitItems = outfit.items.map(itemRef => {
      const item = wardrobeItems.find(w => w.itemId === itemRef.itemId);
      return {
        ...itemRef,
        item: item ? {
          name: item.name,
          imageUrl: item.image?.url,
          tags: item.tags,
          brand: item.brand
        } : null
      };
    });

    // Create visual collage if we have enough images
    const itemsWithImages = outfitItems.filter(item => item.item?.imageUrl);
    
    let visualCollage = null;
    if (itemsWithImages.length >= 2) {
      visualCollage = await createOutfitCollage(itemsWithImages);
    }

    // Generate AI image if we don't have enough closet images
    let aiGeneratedImage = null;
    if (itemsWithImages.length < 2) {
      aiGeneratedImage = await generateAIOutfitImage(outfit, outfitItems);
    }

    return {
      ...outfit,
      items: outfitItems,
      visualCollage,
      aiGeneratedImage,
      hasVisualData: !!(visualCollage || aiGeneratedImage)
    };
  } catch (error) {
    console.error('Error enhancing outfit with images:', error);
    return outfit;
  }
};

// Create outfit collage from actual closet images
const createOutfitCollage = async (itemsWithImages) => {
  try {
    // For now, return the first item's image as the main visual
    // In a full implementation, you'd use a service like Cloudinary's collage feature
    // or create a custom collage layout
    const mainItem = itemsWithImages.find(item => 
      item.role === 'top' || item.role === 'bottom'
    );
    
    if (mainItem?.item?.imageUrl) {
      return {
        type: 'closet_collage',
        mainImage: mainItem.item.imageUrl,
        allImages: itemsWithImages.map(item => item.item.imageUrl).filter(Boolean),
        layout: 'grid'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error creating outfit collage:', error);
    return null;
  }
};

// Generate AI image for outfit
const generateAIOutfitImage = async (outfit, outfitItems) => {
  try {
    // Create a detailed description for AI image generation
    const description = createOutfitDescription(outfit, outfitItems);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A stylish men's outfit: ${description}. Clean, modern photography style, neutral background, professional lighting. No text or watermarks.`,
      n: 1,
      size: "1024x1024",
    });

    return {
      type: 'ai_generated',
      imageUrl: response.data[0].url,
      description: description
    };
  } catch (error) {
    console.error('Error generating AI outfit image:', error);
    return null;
  }
};

// Create detailed outfit description for AI generation
const createOutfitDescription = (outfit, outfitItems) => {
  const itemDescriptions = outfitItems
    .filter(item => item.item)
    .map(item => {
      const tags = item.item.tags;
      const category = tags?.category || 'clothing';
      const colors = tags?.colors?.join(' and ') || 'neutral';
      const material = tags?.material || '';
      const style = tags?.style || '';
      
      return `${colors} ${material} ${style} ${category}`;
    })
    .join(' with ');

  const context = outfit.context;
  const occasion = context?.event || 'casual';
  const season = context?.season || 'all-season';
  
  return `A ${occasion} ${season} outfit featuring ${itemDescriptions}. The look is stylish and well-coordinated.`;
};

// Outfit assembly algorithm
const assembleOutfits = async ({ wardrobeItems, userProfile, context, count }) => {
  const outfits = [];
  const { event, vibe, weather, season, formality } = context;
  
  // Filter items by category and constraints
  console.log('Filtering items by category...');
  
  const tops = wardrobeItems.filter(item => 
    item.tags.category === 'top' &&
    isCompatibleWithContext(item, context, userProfile)
  );
  
  const bottoms = wardrobeItems.filter(item => 
    item.tags.category === 'bottom' &&
    isCompatibleWithContext(item, context, userProfile)
  );
  
  const outerwear = wardrobeItems.filter(item => 
    item.tags.category === 'outerwear' &&
    isCompatibleWithContext(item, context, userProfile)
  );
  
  const footwear = wardrobeItems.filter(item => 
    item.tags.category === 'footwear' &&
    isCompatibleWithContext(item, context, userProfile)
  );
  
  const accessories = wardrobeItems.filter(item => 
    item.tags.category === 'accessory' &&
    isCompatibleWithContext(item, context, userProfile)
  );
  
  console.log('Filtered items:', {
    tops: tops.length,
    bottoms: bottoms.length,
    outerwear: outerwear.length,
    footwear: footwear.length,
    accessories: accessories.length
  });
  
  console.log('All items categories:', wardrobeItems.map(item => item.tags.category));
  
  // Generate outfit combinations
  for (let i = 0; i < count && i < 20; i++) { // Limit attempts
    const outfit = await generateSingleOutfit({
      tops,
      bottoms,
      outerwear,
      footwear,
      accessories,
      context,
      userProfile,
      existingOutfits: outfits
    });
    
    if (outfit) {
      outfits.push(outfit);
    }
  }
  
  // Sort by score and return
  return outfits
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
};

// Generate a single outfit
const generateSingleOutfit = async ({ tops, bottoms, outerwear, footwear, accessories, context, userProfile, existingOutfits }) => {
  const { event, vibe, weather, season, formality } = context;
  
  // Select items for each slot
  const selectedTop = selectRandomItem(tops);
  const selectedBottom = selectRandomItem(bottoms);
  const selectedFootwear = selectRandomItem(footwear);
  
  if (!selectedTop || !selectedBottom || !selectedFootwear) {
    return null;
  }
  
  // Select outerwear based on weather
  let selectedOuterwear = null;
  if (weather.tempC < 14 || weather.precip) {
    selectedOuterwear = selectRandomItem(outerwear);
  }
  
  // Select accessories (0-2 items)
  const selectedAccessories = [];
  const accessoryCount = Math.random() < 0.5 ? 1 : (Math.random() < 0.3 ? 2 : 0);
  for (let i = 0; i < accessoryCount; i++) {
    const accessory = selectRandomItem(accessories);
    if (accessory) {
      selectedAccessories.push(accessory);
    }
  }
  
  // Build outfit items array
  const items = [
    { itemId: selectedTop.itemId, role: 'top' },
    { itemId: selectedBottom.itemId, role: 'bottom' },
    { itemId: selectedFootwear.itemId, role: 'footwear' }
  ];
  
  if (selectedOuterwear) {
    items.push({ itemId: selectedOuterwear.itemId, role: 'outerwear' });
  }
  
  selectedAccessories.forEach(accessory => {
    items.push({ itemId: accessory.itemId, role: 'accessory' });
  });
  
  // Check if this combination already exists
  const isDuplicate = existingOutfits.some(existing => 
    existing.items.length === items.length &&
    existing.items.every(item => 
      items.some(newItem => 
        newItem.itemId === item.itemId && newItem.role === item.role
      )
    )
  );
  
  if (isDuplicate) {
    return null;
  }
  
  // Calculate outfit score
  const score = calculateOutfitScore({
    items: [selectedTop, selectedBottom, selectedFootwear, selectedOuterwear, ...selectedAccessories].filter(Boolean),
    context,
    userProfile
  });
  
  // Detect gaps
  const gaps = detectOutfitGaps({
    items: [selectedTop, selectedBottom, selectedFootwear, selectedOuterwear, ...selectedAccessories].filter(Boolean),
    context,
    userProfile
  });
  
  // Generate explanation
  const explanation = generateOutfitExplanation({
    items: [selectedTop, selectedBottom, selectedFootwear, selectedOuterwear, ...selectedAccessories].filter(Boolean),
    context,
    score,
    gaps
  });
  
  return {
    items,
    score,
    context,
    gaps,
    explanation,
    createdFrom: 'auto'
  };
};

// Check if item is compatible with context
const isCompatibleWithContext = (item, context, userProfile) => {
  const { event, vibe, weather, season, formality } = context;
  
  // Debug formality matching
  if (formality && item.tags.formality !== formality) {
    console.log(`Formality mismatch: item has "${item.tags.formality}", context wants "${formality}"`);
    return false;
  }
  
  // Check seasonality
  if (season && !item.tags.seasonality.includes(season) && !item.tags.seasonality.includes('all-season')) {
    return false;
  }
  
  // Check user's color preferences
  if (userProfile.colorsAvoid && item.tags.colors) {
    const hasAvoidedColor = item.tags.colors.some(color => 
      userProfile.colorsAvoid.some(avoided => 
        color.toLowerCase().includes(avoided.toLowerCase())
      )
    );
    if (hasAvoidedColor) return false;
  }
  
  // Check no-go items
  if (userProfile.noGoItems && userProfile.noGoItems.includes(item.tags.subcategory)) {
    return false;
  }
  
  return true;
};

// Select random item from array
const selectRandomItem = (items) => {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
};

// Calculate outfit score
const calculateOutfitScore = ({ items, context, userProfile }) => {
  let score = 0.5; // Base score
  
  const { event, vibe, weather, season, formality } = context;
  
  // Color harmony scoring
  const colors = items.flatMap(item => item.tags.colors || []);
  const uniqueColors = [...new Set(colors)];
  
  if (uniqueColors.length <= 3) {
    score += 0.2; // Good color harmony
  } else if (uniqueColors.length <= 4) {
    score += 0.1; // Acceptable color harmony
  } else {
    score -= 0.1; // Too many colors
  }
  
  // Vibe alignment
  if (vibe.includes('minimal') && uniqueColors.length <= 3) {
    score += 0.15;
  } else if (vibe.includes('bold') && uniqueColors.length >= 3) {
    score += 0.15;
  }
  
  // Formality alignment
  const formalityScores = items.map(item => {
    const formalityMap = {
      'casual': 1,
      'smart-casual': 2,
      'business-casual': 3,
      'formal': 4,
      'athleisure': 1
    };
    return formalityMap[item.tags.formality] || 2;
  });
  
  const avgFormality = formalityScores.reduce((a, b) => a + b, 0) / formalityScores.length;
  const targetFormality = formalityMap[formality] || 2;
  
  if (Math.abs(avgFormality - targetFormality) <= 1) {
    score += 0.2; // Good formality match
  }
  
  // Weather appropriateness
  if (weather.tempC < 14 && items.some(item => item.tags.category === 'outerwear')) {
    score += 0.1;
  }
  
  if (weather.precip && items.some(item => item.tags.category === 'outerwear')) {
    score += 0.1;
  }
  
  // User preference alignment
  if (userProfile.colorsLove && items.some(item => 
    item.tags.colors && item.tags.colors.some(color => 
      userProfile.colorsLove.some(loved => 
        color.toLowerCase().includes(loved.toLowerCase())
      )
    )
  )) {
    score += 0.15;
  }
  
  return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
};

// Detect outfit gaps
const detectOutfitGaps = ({ items, context, userProfile }) => {
  const gaps = [];
  const { weather, formality } = context;
  
  // Check for weather-appropriate outerwear
  if (weather.tempC < 14 && !items.some(item => item.tags.category === 'outerwear')) {
    gaps.push('needs weather-appropriate outerwear');
  }
  
  // Check for formality-appropriate footwear
  if (formality === 'formal' && !items.some(item => 
    item.tags.category === 'footwear' && 
    ['oxford', 'derby', 'loafer'].includes(item.tags.subcategory)
  )) {
    gaps.push('needs formal footwear');
  }
  
  // Check for accessories if formal
  if (formality === 'formal' && !items.some(item => item.tags.category === 'accessory')) {
    gaps.push('needs formal accessories');
  }
  
  return gaps;
};

// Generate outfit explanation
const generateOutfitExplanation = ({ items, context, score, gaps }) => {
  const { event, vibe, formality } = context;
  
  let explanation = `Perfect for ${event || 'your occasion'}`;
  
  if (score > 0.8) {
    explanation += ' with excellent style coordination';
  } else if (score > 0.6) {
    explanation += ' with good style balance';
  } else {
    explanation += ' with room for improvement';
  }
  
  if (vibe.length > 0) {
    explanation += `. Aligns with your ${vibe.join(', ')} vibe`;
  }
  
  if (formality) {
    explanation += ` and ${formality} formality`;
  }
  
  if (gaps.length > 0) {
    explanation += `. Consider adding: ${gaps.join(', ')}`;
  }
  
  return explanation;
};

// Get all outfits with filters
const getOutfits = async (req, res) => {
  try {
    const { 
      event, 
      formality, 
      season,
      limit = 20,
      offset = 0 
    } = req.query;
    
    const userId = req.user.id;
    
    // Build filter object
    const filter = { userId };
    
    if (event) filter['context.event'] = event;
    if (formality) filter['context.formality'] = formality;
    if (season) filter['context.season'] = season;
    
    const outfits = await Outfit.find(filter)
      .sort({ 'meta.createdAt': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Outfit.countDocuments(filter);
    
    res.json({
      outfits,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + outfits.length
      }
    });
  } catch (error) {
    console.error('Error fetching outfits:', error);
    res.status(500).json({ error: 'Failed to fetch outfits' });
  }
};

// Get outfit statistics
const getOutfitStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Outfit.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalOutfits: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalLikes: { $sum: '$feedback.likes' },
          totalDislikes: { $sum: '$feedback.dislikes' },
          events: { $addToSet: '$context.event' },
          formality: { $addToSet: '$context.formality' }
        }
      }
    ]);
    
    res.json(stats[0] || { 
      totalOutfits: 0, 
      avgScore: 0, 
      totalLikes: 0, 
      totalDislikes: 0,
      events: [],
      formality: []
    });
  } catch (error) {
    console.error('Error fetching outfit stats:', error);
    res.status(500).json({ error: 'Failed to fetch outfit statistics' });
  }
};

// Save a new outfit
const saveOutfit = async (req, res) => {
  try {
    const userId = req.user.id;
    const outfitData = req.body;
    
    const outfit = new Outfit({
      userId,
      ...outfitData,
      createdFrom: outfitData.createdFrom || 'manual'
    });
    
    await outfit.save();
    
    res.json(outfit);
  } catch (error) {
    console.error('Error saving outfit:', error);
    res.status(500).json({ error: 'Failed to save outfit' });
  }
};

// Get specific outfit
const getOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const outfit = await Outfit.findOne({ 
      $or: [{ _id: id }, { outfitId: id }],
      userId 
    });
    
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    res.json(outfit);
  } catch (error) {
    console.error('Error fetching outfit:', error);
    res.status(500).json({ error: 'Failed to fetch outfit' });
  }
};

// Update outfit
const updateOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const outfit = await Outfit.findOneAndUpdate(
      { 
        $or: [{ _id: id }, { outfitId: id }],
        userId 
      },
      { 
        ...updates,
        'meta.updatedAt': new Date()
      },
      { new: true }
    );
    
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    res.json(outfit);
  } catch (error) {
    console.error('Error updating outfit:', error);
    res.status(500).json({ error: 'Failed to update outfit' });
  }
};

// Add feedback to outfit
const addOutfitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { like, note } = req.body;
    
    const outfit = await Outfit.findOne({ 
      $or: [{ _id: id }, { outfitId: id }],
      userId 
    });
    
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    if (like) {
      outfit.feedback.likes += 1;
    } else {
      outfit.feedback.dislikes += 1;
    }
    
    if (note) {
      outfit.feedback.notes.push(note);
    }
    
    await outfit.save();
    
    res.json(outfit);
  } catch (error) {
    console.error('Error adding outfit feedback:', error);
    res.status(500).json({ error: 'Failed to add outfit feedback' });
  }
};

// Delete outfit
const deleteOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const outfit = await Outfit.findOneAndDelete({ 
      $or: [{ _id: id }, { outfitId: id }],
      userId 
    });
    
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    
    res.json({ success: true, message: 'Outfit deleted successfully' });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    res.status(500).json({ error: 'Failed to delete outfit' });
  }
};

module.exports = {
  generateOutfits,
  getOutfits,
  getOutfitStats,
  saveOutfit,
  getOutfit,
  updateOutfit,
  addOutfitFeedback,
  deleteOutfit
}; 