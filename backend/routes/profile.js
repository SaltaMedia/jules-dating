const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserProfile = require('../models/UserProfile');
const { ProfileUpsertZ } = require('../lib/validation/profile');
const { buildJulesContext } = require('../utils/contextBuilder');

// GET /api/profile/me - Get full profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        needsOnboarding: true 
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile - Upsert entire profile
router.put('/', auth, async (req, res) => {
  try {
    const parsed = ProfileUpsertZ.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: parsed.error.flatten() 
      });
    }

    const update = parsed.data;
    const now = new Date();

    // Touch section timestamps if present
    if (update.bodyInfo) update.bodyInfo.lastUpdated = now;
    if (update.styleProfile) update.styleProfile.lastUpdated = now;
    if (update.lifestyle) update.lifestyle.lastUpdated = now;
    if (update.wardrobe) update.wardrobe.lastUpdated = now;
    if (update.investment) update.investment.lastUpdated = now;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          ...update, 
          "meta.updatedAt": now,
          "meta.lastContextBuildAt": now // Invalidate cached context
        } 
      },
      { new: true, upsert: true }
    );

    res.json({ 
      message: 'Profile updated successfully',
      profile 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/profile/section/:section - Partial update of a single section
router.patch('/section/:section', auth, async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['bodyInfo', 'styleProfile', 'lifestyle', 'wardrobe', 'investment'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ 
        error: 'Invalid section', 
        validSections 
      });
    }

    // Import the appropriate validation schema
    const { 
      BodyInfoZ, 
      StyleProfileZ, 
      LifestyleZ, 
      WardrobeZ, 
      InvestmentZ 
    } = require('../lib/validation/profile');

    const validationSchemas = {
      bodyInfo: BodyInfoZ,
      styleProfile: StyleProfileZ,
      lifestyle: LifestyleZ,
      wardrobe: WardrobeZ,
      investment: InvestmentZ
    };

    const schema = validationSchemas[section];
    const parsed = schema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: parsed.error.flatten() 
      });
    }

    const update = parsed.data;
    update.lastUpdated = new Date();

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          [section]: update,
          "meta.updatedAt": new Date(),
          "meta.lastContextBuildAt": new Date() // Invalidate cached context
        } 
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ 
      message: `${section} updated successfully`,
      profile 
    });
  } catch (error) {
    console.error('Error updating profile section:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/context - Returns compact context object for chat
router.get('/context', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.json({ context: null });
    }

    const context = buildJulesContext(profile);
    
    // Update last context build timestamp
    await UserProfile.updateOne(
      { userId: req.user.id },
      { "meta.lastContextBuildAt": new Date() }
    );

    res.json({ context });
  } catch (error) {
    console.error('Error building context:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/context/rebuild - Force rebuild context (for testing)
router.post('/context/rebuild', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const context = buildJulesContext(profile);
    
    // Update last context build timestamp
    await UserProfile.updateOne(
      { userId: req.user.id },
      { "meta.lastContextBuildAt": new Date() }
    );

    res.json({ 
      message: 'Context rebuilt successfully',
      context 
    });
  } catch (error) {
    console.error('Error rebuilding context:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 