const WardrobeItem = require('../models/WardrobeItem');
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');

// Configure OpenAI for vision tagging
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    url: process.env.CLOUDINARY_URL
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Get all wardrobe items with filters
const getWardrobeItems = async (req, res) => {
  try {
    const { 
      category, 
      season, 
      color, 
      verified, 
      formality,
      limit = 50,
      offset = 0 
    } = req.query;
    
    const userId = req.user.id;
    
    // Build filter object
    const filter = { userId };
    
    if (category) filter['tags.category'] = category;
    if (season) filter['tags.seasonality'] = { $in: [season, 'all-season'] };
    if (color) filter['tags.colors'] = { $regex: color, $options: 'i' };
    if (verified !== undefined) filter.verified = verified === 'true';
    if (formality) filter['tags.formality'] = formality;
    
    const items = await WardrobeItem.find(filter)
      .sort({ 'meta.createdAt': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await WardrobeItem.countDocuments(filter);
    
    res.json({
      items,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + items.length
      }
    });
  } catch (error) {
    console.error('Error fetching wardrobe items:', error);
    res.status(500).json({ error: 'Failed to fetch wardrobe items' });
  }
};

// Search wardrobe items
const searchWardrobeItems = async (req, res) => {
  try {
    const { q, category, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const filter = { userId };
    
    if (category) {
      filter['tags.category'] = category;
    }
    
    // Search in multiple fields
    const searchFilter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { 'tags.subcategory': { $regex: q, $options: 'i' } },
        { 'tags.colors': { $regex: q, $options: 'i' } },
        { 'tags.material': { $regex: q, $options: 'i' } },
        { 'tags.brandGuess': { $regex: q, $options: 'i' } }
      ]
    };
    
    const items = await WardrobeItem.find({ ...filter, ...searchFilter })
      .sort({ 'meta.createdAt': -1 })
      .limit(parseInt(limit));
    
    res.json({ items });
  } catch (error) {
    console.error('Error searching wardrobe items:', error);
    res.status(500).json({ error: 'Failed to search wardrobe items' });
  }
};

// Get wardrobe statistics
const getWardrobeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await WardrobeItem.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          categories: {
            $push: '$tags.category'
          },
          formality: {
            $push: '$tags.formality'
          },
          verified: {
            $push: '$verified'
          }
        }
      },
      {
        $project: {
          totalItems: 1,
          categoryBreakdown: {
            $reduce: {
              input: '$categories',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { '$$this': { $add: [{ $indexOfArray: ['$categories', '$$this'] }, 1] } } }
                ]
              }
            }
          },
          formalityBreakdown: {
            $reduce: {
              input: '$formality',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { '$$this': { $add: [{ $indexOfArray: ['$formality', '$$this'] }, 1] } } }
                ]
              }
            }
          },
          verifiedCount: {
            $size: {
              $filter: {
                input: '$verified',
                cond: { $eq: ['$$this', true] }
              }
            }
          }
        }
      }
    ]);
    
    res.json(stats[0] || { totalItems: 0, categoryBreakdown: {}, formalityBreakdown: {}, verifiedCount: 0 });
  } catch (error) {
    console.error('Error fetching wardrobe stats:', error);
    res.status(500).json({ error: 'Failed to fetch wardrobe statistics' });
  }
};

// Get upload URL for direct upload
const getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and content type are required' });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    const uniqueFilename = `wardrobe/${timestamp}_${randomId}.${extension}`;
    
    // Generate presigned URL for Cloudinary
    const uploadSignature = cloudinary.utils.api_sign_request(
      {
        public_id: uniqueFilename,
        folder: 'jules-wardrobe',
        resource_type: 'image'
      },
      process.env.CLOUDINARY_API_SECRET
    );
    
    res.json({
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      uploadParams: {
        public_id: uniqueFilename,
        folder: 'jules-wardrobe',
        signature: uploadSignature,
        api_key: process.env.CLOUDINARY_API_KEY,
        timestamp: Math.floor(Date.now() / 1000)
      },
      storageKey: uniqueFilename
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

// Ingest uploaded item and trigger auto-tagging
const ingestItem = async (req, res) => {
  try {
    const { storageKey, width, height } = req.body;
    const userId = req.user.id;
    
    if (!storageKey) {
      return res.status(400).json({ error: 'Storage key is required' });
    }
    
    // Create wardrobe item record
    const wardrobeItem = new WardrobeItem({
      userId,
      image: {
        url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${storageKey}`,
        width: width || 800,
        height: height || 600,
        uploadedAt: new Date(),
        storageProvider: 'cloudinary'
      },
      tags: {
        category: 'other', // Will be updated by auto-tagging
        pattern: 'solid',
        formality: 'casual',
        fit: 'unknown',
        condition: 'good'
      },
      verified: false
    });
    
    await wardrobeItem.save();
    
    // Trigger auto-tagging in background
    setTimeout(() => {
      autoTagItemInternal(wardrobeItem.itemId, userId);
    }, 100);
    
    res.json({
      success: true,
      item: wardrobeItem,
      message: 'Item uploaded successfully. Auto-tagging in progress...'
    });
  } catch (error) {
    console.error('Error ingesting item:', error);
    res.status(500).json({ error: 'Failed to ingest item' });
  }
};

// Auto-tag an item (internal function)
const autoTagItemInternal = async (itemId, userId) => {
  try {
    const item = await WardrobeItem.findOne({ itemId, userId });
    if (!item) return;
    
    // Call OpenAI Vision API for tagging
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You classify clothing items from a single image for a men's styling app.
Return a strict JSON object with fields:
category (one of: top, outerwear, bottom, footwear, accessory, underlayer, other),
subcategory, colors (max 3 simple names), pattern (solid|stripe|check|print|texture|other),
material (array), seasonality (array from: spring, summer, fall, winter, all-season),
formality (casual|smart-casual|business-casual|formal|athleisure),
fit (slim|tailored|relaxed|oversized|unknown),
brandGuess (string or empty),
occasions (array of short slugs),
confidence (0–1).
Do not include explanations.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Classify this clothing item:"
            },
            {
              type: "image_url",
              image_url: {
                url: item.image.url
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    
    const content = visionResponse.choices[0].message.content;
    const tags = JSON.parse(content);
    
    // Update item with auto-tagged data
    item.tags = {
      ...item.tags,
      ...tags
    };
    item.meta.lastAutoTagAt = new Date();
    item.verified = tags.confidence > 0.6;
    
    await item.save();
    
    console.log(`Auto-tagged item ${itemId}:`, tags);
  } catch (error) {
    console.error('Error auto-tagging item:', error);
  }
};

// Auto-tag an item (API endpoint)
const autoTagItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    await autoTagItemInternal(itemId, userId);
    
    res.json({ success: true, message: 'Auto-tagging completed' });
  } catch (error) {
    console.error('Error auto-tagging item:', error);
    res.status(500).json({ error: 'Failed to auto-tag item' });
  }
};

// Get specific wardrobe item
const getWardrobeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const item = await WardrobeItem.findOne({ 
      $or: [{ _id: id }, { itemId: id }],
      userId 
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching wardrobe item:', error);
    res.status(500).json({ error: 'Failed to fetch wardrobe item' });
  }
};

// Update wardrobe item
const updateWardrobeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const item = await WardrobeItem.findOneAndUpdate(
      { 
        $or: [{ _id: id }, { itemId: id }],
        userId 
      },
      { 
        ...updates,
        verified: true, // Mark as verified when user edits
        'meta.updatedAt': new Date()
      },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating wardrobe item:', error);
    res.status(500).json({ error: 'Failed to update wardrobe item' });
  }
};

// Delete wardrobe item
const deleteWardrobeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const item = await WardrobeItem.findOneAndDelete({ 
      $or: [{ _id: id }, { itemId: id }],
      userId 
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Optionally delete from Cloudinary
    if (item.image.storageProvider === 'cloudinary') {
      try {
        await cloudinary.uploader.destroy(item.image.url.split('/').pop().split('.')[0]);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting wardrobe item:', error);
    res.status(500).json({ error: 'Failed to delete wardrobe item' });
  }
};

// Add wardrobe item (legacy compatibility)
const addWardrobeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemData = req.body;
    
    const wardrobeItem = new WardrobeItem({
      userId,
      ...itemData,
      verified: true // Manual entries are verified
    });
    
    await wardrobeItem.save();
    
    res.json(wardrobeItem);
  } catch (error) {
    console.error('Error adding wardrobe item:', error);
    res.status(500).json({ error: 'Failed to add wardrobe item' });
  }
};

// Analyze image using OpenAI Vision
const analyzeImage = async (req, res) => {
  try {
    console.log('analyzeImage called with:', { body: req.body, userId: req.user?.id });
    const { imageUrl } = req.body;
    const userId = req.user.id;
    
    if (!imageUrl) {
      console.log('No imageUrl provided');
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    console.log('About to call OpenAI with imageUrl:', imageUrl);
    
    // Use OpenAI Vision to analyze the image
    console.log('Calling OpenAI Vision API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this clothing item and provide details in JSON format. Be very specific and accurate. Include: category (shirt, pants, shoes, jacket, etc.), subcategory (t-shirt, button-up, jeans, sneakers, bomber jacket, etc.), colors (array of specific colors like 'black', 'navy', 'white'), material (cotton, denim, leather, etc.), formality (casual, business, formal), seasonality (summer, winter, fall, spring, all-season), brandGuess (if recognizable), and style (modern, classic, vintage, etc.). Look carefully at the image and be precise. Return only valid JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    console.log('OpenAI response received:', response.choices[0].message.content);
    
    const analysisText = response.choices[0].message.content;
    let analysis;
    
    try {
      // Clean the response text - remove markdown formatting
      let cleanText = analysisText.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '');
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '');
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.replace(/\s*```$/, '');
      }
      
      // Try to parse the JSON response
      analysis = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw response:', analysisText);
      // Fallback to basic analysis
      analysis = {
        category: 'other',
        subcategory: 'unknown',
        colors: ['unknown'],
        material: ['unknown'],
        formality: 'casual',
        seasonality: ['all-season'],
        brandGuess: 'unknown',
        style: 'unknown'
      };
    }
    
    // Map OpenAI category to schema enum values
    const mapCategory = (category) => {
      const categoryLower = (category || '').toLowerCase();
      if (categoryLower.includes('shirt') || categoryLower.includes('top') || categoryLower.includes('t-shirt') || categoryLower.includes('sweater')) {
        return 'top';
      } else if (categoryLower.includes('jacket') || categoryLower.includes('coat') || categoryLower.includes('blazer')) {
        return 'outerwear';
      } else if (categoryLower.includes('pants') || categoryLower.includes('jeans') || categoryLower.includes('shorts') || categoryLower.includes('trousers')) {
        return 'bottom';
      } else if (categoryLower.includes('shoes') || categoryLower.includes('sneakers') || categoryLower.includes('boots') || categoryLower.includes('footwear')) {
        return 'footwear';
      } else if (categoryLower.includes('accessory') || categoryLower.includes('hat') || categoryLower.includes('belt') || categoryLower.includes('bag')) {
        return 'accessory';
      } else if (categoryLower.includes('underwear') || categoryLower.includes('undershirt')) {
        return 'underlayer';
      } else {
        return 'other';
      }
    };

    // Create better item name using brand and subcategory
    const itemName = analysis.brandGuess && analysis.brandGuess !== 'unknown' 
      ? `${analysis.brandGuess} ${analysis.subcategory || analysis.category}`
      : `${analysis.subcategory || analysis.category}`;

    // Create wardrobe item with analysis
    const wardrobeItem = new WardrobeItem({
      userId,
      name: itemName,
      image: {
        url: imageUrl,
        width: 800,
        height: 600,
        uploadedAt: new Date(),
        storageProvider: 'cloudinary'
      },
      tags: {
        category: mapCategory(analysis.category),
        subcategory: analysis.subcategory || 'unknown',
        colors: analysis.colors || ['unknown'],
        material: Array.isArray(analysis.material) ? analysis.material : [analysis.material || 'unknown'],
        formality: analysis.formality || 'casual',
        seasonality: Array.isArray(analysis.seasonality) ? analysis.seasonality : [analysis.seasonality || 'all-season'],
        brandGuess: analysis.brandGuess || 'unknown',
        style: analysis.style || 'unknown',
        pattern: 'solid',
        fit: 'unknown',
        condition: 'good'
      },
      verified: false // AI analysis needs verification
    });
    
    console.log('About to save wardrobe item:', wardrobeItem);
    await wardrobeItem.save();
    console.log('Wardrobe item saved successfully');
    
    // Track analytics
    try {
      const analyticsService = require('../utils/analyticsService');
      await analyticsService.trackFeatureUsage(
        userId,
        req.sessionId || 'default-session',
        'wardrobe',
        'item_analyzed',
        req,
        {
          category: wardrobeItem.tags.category,
          subcategory: wardrobeItem.tags.subcategory,
          colors: wardrobeItem.tags.colors,
          material: wardrobeItem.tags.material,
          formality: wardrobeItem.tags.formality,
          brandGuess: wardrobeItem.tags.brandGuess
        }
      );
      console.log(`✅ Wardrobe item analytics tracked for user ${userId}`);
    } catch (analyticsError) {
      console.error('❌ Analytics tracking error:', analyticsError);
      // Don't fail the request if analytics fails
    }
    
    res.json({
      success: true,
      item: wardrobeItem,
      analysis: analysis,
      message: 'Image analyzed successfully'
    });
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
};

module.exports = {
  getWardrobeItems,
  searchWardrobeItems,
  getWardrobeStats,
  getUploadUrl,
  ingestItem,
  autoTagItem,
  getWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
  addWardrobeItem,
  analyzeImage
}; 