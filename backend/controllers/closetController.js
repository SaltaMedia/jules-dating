const ClosetItem = require('../models/ClosetItem');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get user's closet items
const getClosetItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId };
    if (type) {
      query.type = type;
    }

    const items = await ClosetItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClosetItem.countDocuments(query);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting closet items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to closet
const addClosetItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      type,
      brand,
      imageUrl,
      tags,
      julesFeedback
    } = req.body;

    if (!name || !type || !imageUrl) {
      return res.status(400).json({ message: 'Name, type, and image URL are required' });
    }

    const item = new ClosetItem({
      userId,
      name,
      type,
      brand,
      imageUrl,
      tags: tags || [],
      julesFeedback: julesFeedback || null
    });

    await item.save();

    res.json({
      message: 'Item added to closet successfully',
      item
    });
  } catch (error) {
    console.error('Error adding closet item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update closet item
const updateClosetItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const item = await ClosetItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'brand', 'tags', 'liked', 'userNotes'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        item[field] = updateData[field];
      }
    }

    await item.save();

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating closet item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete closet item
const deleteClosetItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await ClosetItem.findOneAndDelete({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting closet item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific closet item
const getClosetItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await ClosetItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Error getting closet item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Build a fit using GPT
const buildFit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event, style, items } = req.body;

    // Get user's closet items
    const closetItems = await ClosetItem.find({ userId });
    
    if (closetItems.length === 0) {
      return res.status(400).json({ message: 'No items in closet to build outfit from' });
    }

    // Get user's tone preference
    const user = await User.findById(userId);
    const userTone = user?.julesTone || 3;

    // Create system prompt for outfit building
    const systemPrompt = `You are Jules, a confident men's style assistant. Build an outfit from the user's closet items for a specific event.

Available items in closet:
${closetItems.map(item => `- ${item.name} (${item.type})${item.brand ? ` - ${item.brand}` : ''}`).join('\n')}

Event: ${event}
Style preference: ${style || 'any'}

Provide:
1. A complete outfit combination using items from their closet
2. Why this combination works for the event
3. Any styling tips or suggestions
4. Alternative combinations if possible

Be confident and match the user's preferred tone.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Build me an outfit for ${event} using my closet items.`
        }
      ],
      max_tokens: 400
    });

    const outfitSuggestion = response.choices[0].message.content;

    res.json({
      message: 'Outfit built successfully',
      outfit: {
        suggestion: outfitSuggestion,
        event,
        style,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error building fit:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get closet statistics
const getClosetStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await ClosetItem.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          byType: {
            $push: {
              type: '$type',
              name: '$name'
            }
          },
          likedItems: {
            $sum: {
              $cond: [{ $eq: ['$liked', true] }, 1, 0]
            }
          },
          dislikedItems: {
            $sum: {
              $cond: [{ $eq: ['$liked', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const typeBreakdown = await ClosetItem.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalItems: 0,
        byType: [],
        likedItems: 0,
        dislikedItems: 0
      },
      typeBreakdown
    });
  } catch (error) {
    console.error('Error getting closet stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search closet items
const searchClosetItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, type, brand } = req.query;

    let query = { userId };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    const items = await ClosetItem.find(query).sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    console.error('Error searching closet items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove fit check data from closet item
const removeFitCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const item = await ClosetItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Remove fit check data
    item.fitCheck = undefined;
    await item.save();

    res.json({
      message: 'Fit check removed successfully',
      item
    });
  } catch (error) {
    console.error('Error removing fit check:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClosetItems,
  addClosetItem,
  updateClosetItem,
  deleteClosetItem,
  getClosetItem,
  buildFit,
  getClosetStats,
  searchClosetItems,
  removeFitCheck
}; 