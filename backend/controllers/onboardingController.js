const User = require('../models/User');

// Get onboarding status
const getOnboardingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      completed: user.onboarding?.completed || false,
      progress: calculateOnboardingProgress(user)
    });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Calculate onboarding progress percentage
const calculateOnboardingProgress = (user) => {
  const onboarding = user.onboarding || {};
  const totalSections = 7; // Updated total number of sections
  let completedSections = 0;
  
  // Section 1: Basic Info (required - 4 questions)
  if (onboarding.name && onboarding.email && onboarding.zipCode && onboarding.aboutMe) {
    completedSections++;
  }
  
  // Section 2: Body Info (optional - 7 questions)
  if (onboarding.height || onboarding.weight || onboarding.topSize || onboarding.bottomSize || 
      onboarding.shoeSize || onboarding.bodyType || onboarding.facialHair) {
    completedSections++;
  }
  
  // Section 3: Lifestyle (optional - 4 questions)
  if (onboarding.weeklyEnvironment || onboarding.socialEventFrequency || 
      onboarding.worksOut || onboarding.relationshipStatus) {
    completedSections++;
  }
  
  // Section 4: Style Preferences (optional - 6 questions)
  if (onboarding.preferredStyles || onboarding.colorsLove || 
      onboarding.fitPreference || onboarding.favoriteBrands || onboarding.styleNotes ||
      onboarding.noGoItems) {
    completedSections++;
  }
  
  // Section 5: Grooming & Accessories (optional - 3 questions)
  if (onboarding.accessoriesWorn || onboarding.wantMoreAccessories || onboarding.shoeTypes) {
    completedSections++;
  }
  
  // Section 6: Budget (optional - 2 questions)
  if (onboarding.monthlyClothingBudget || onboarding.budgetType) {
    completedSections++;
  }
  
  // Section 7: Picture (optional - 1 question)
  if (onboarding.profilePhoto) {
    completedSections++;
  }
  
  return Math.round((completedSections / totalSections) * 100);
};

// Update onboarding data
const updateOnboarding = async (req, res) => {
  try {
    const {
      // Basic Info
      name,
      email,
      zipCode,
      aboutMe,
      
      // Body Info
      height,
      weight,
      topSize,
      bottomSize,
      shoeSize,
      bodyType,
      facialHair,
      
      // Lifestyle & Context
      weeklyEnvironment,
      socialEventFrequency,
      worksOut,
      
      // Style Depth
      preferredStyles,
      colorsLove,
      fitPreference,
      favoriteBrands, // Keep this field
      styleNotes,
      noGoItems,
      
      // Dating & Impression Goals
      relationshipStatus,
      
      // Grooming & Accessories
      accessoriesWorn,
      wantMoreAccessories,
      shoeTypes,
      
      // Budget
      monthlyClothingBudget,
      budgetType,
      
      // Personalization
      profilePhoto,
      
      // Jules tone
      julesTone
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update onboarding data
    user.onboarding = {
      ...user.onboarding,
      // Basic Info
      name,
      email,
      zipCode,
      aboutMe,
      
      // Body Info
      height,
      weight,
      topSize,
      bottomSize,
      shoeSize,
      bodyType,
      facialHair,
      
      // Lifestyle & Context
      weeklyEnvironment,
      socialEventFrequency,
      worksOut,
      
      // Style Depth
      preferredStyles,
      colorsLove,
      fitPreference,
      favoriteBrands, // Keep this field
      styleNotes,
      noGoItems,
      
      // Dating & Impression Goals
      relationshipStatus,
      
      // Grooming & Accessories
      accessoriesWorn,
      wantMoreAccessories,
      shoeTypes,
      
      // Budget
      monthlyClothingBudget,
      budgetType,
      
      // Personalization
      profilePhoto
    };

    // Update Jules tone if provided
    if (julesTone && [1, 2, 3].includes(julesTone)) {
      user.julesTone = julesTone;
    }

    // Mark onboarding as completed if basic info is filled (required section)
    const hasBasicInfo = name && email && zipCode && aboutMe;
    if (hasBasicInfo) {
      user.onboarding.completed = true;
    }

    const progress = calculateOnboardingProgress(user);

    // Save the user with validation disabled to avoid enum issues
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Onboarding updated successfully',
      completed: user.onboarding.completed,
      progress
    });
  } catch (error) {
    console.error('Error updating onboarding:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body
    });
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// Complete onboarding
const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.onboarding.completed = true;
    await user.save();

    res.json({
      message: 'Onboarding completed successfully',
      completed: true
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get onboarding questions for frontend
const getOnboardingQuestions = async (req, res) => {
  try {
    const questions = [
      // 1. Basic Info (REQUIRED)
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        placeholder: 'Your name',
        required: true,
        section: 'Basic Info'
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        placeholder: 'your.email@example.com',
        required: true,
        section: 'Basic Info'
      },
      {
        id: 'zipCode',
        type: 'text',
        label: 'Zip Code',
        placeholder: 'e.g., 97209',
        description: 'To help with weather related advice',
        required: true,
        section: 'Basic Info'
      },
      {
        id: 'aboutMe',
        type: 'textarea',
        label: 'Tell me about yourself',
        placeholder: 'A couple sentences about lifestyle, personality, style preferences. The more you give me, the better context I have!',
        description: 'A couple sentences about lifestyle, personality, style preferences. The more you give me, the better context I have!',
        required: true,
        section: 'Basic Info'
      },
      
      // 2. Body Info (OPTIONAL)
      {
        id: 'height',
        type: 'text',
        label: 'Height',
        placeholder: 'e.g., 5\'10"',
        required: false,
        section: 'Body Info'
      },
      {
        id: 'weight',
        type: 'text',
        label: 'Weight',
        placeholder: 'e.g., 175 lbs',
        required: false,
        section: 'Body Info'
      },
      {
        id: 'topSize',
        type: 'text',
        label: 'Top Size',
        placeholder: 'e.g., M',
        required: false,
        section: 'Body Info'
      },
      {
        id: 'bottomSize',
        type: 'text',
        label: 'Bottom Size',
        placeholder: 'e.g., 32x32',
        required: false,
        section: 'Body Info'
      },
      {
        id: 'shoeSize',
        type: 'text',
        label: 'Shoe Size',
        placeholder: 'e.g., 10',
        required: false,
        section: 'Body Info'
      },
      {
        id: 'bodyType',
        type: 'select',
        label: 'Body Type',
        options: ['Slim', 'Average', 'Athletic', 'Broad', 'Round'],
        required: false,
        section: 'Body Info'
      },
      {
        id: 'facialHair',
        type: 'select',
        label: 'Facial Hair',
        options: ['Clean shaven', 'Beard', 'Mustache', 'Varies'],
        required: false,
        section: 'Body Info'
      },
      
      // 3. Lifestyle (OPTIONAL)
      {
        id: 'weeklyEnvironment',
        type: 'select',
        label: 'Where do you spend most of your week?',
        options: ['Office', 'Outdoors', 'Home', 'Nightlife', 'Gym', 'Travel'],
        required: false,
        section: 'Lifestyle'
      },
      {
        id: 'socialEventFrequency',
        type: 'select',
        label: 'How often do you dress for dates or social events?',
        options: ['Never', 'Occasionally', 'Weekly', 'Multiple times a week'],
        required: false,
        section: 'Lifestyle'
      },
      {
        id: 'worksOut',
        type: 'select',
        label: 'Do you regularly work out or go to the gym?',
        options: ['Yes', 'No'],
        required: false,
        section: 'Lifestyle'
      },
      {
        id: 'relationshipStatus',
        type: 'select',
        label: 'Current relationship status',
        options: ['Single', 'Dating', 'In a Relationship', 'Married'],
        required: false,
        section: 'Lifestyle'
      },
      
      // 4. Style Preferences (OPTIONAL)
      {
        id: 'preferredStyles',
        type: 'multiselect',
        label: 'Preferred Style',
        options: ['Casual', 'Smart Casual', 'Streetwear', 'Classic', 'Minimal', 'Rugged', 'Athletic', 'Luxury', 'Not Sure'],
        required: false,
        section: 'Style Preferences'
      },
      {
        id: 'colorsLove',
        type: 'array',
        label: 'Colors you love wearing',
        placeholder: 'e.g., Navy, Olive, Charcoal',
        required: false,
        section: 'Style Preferences'
      },
      {
        id: 'fitPreference',
        type: 'multiselect',
        label: 'Fit preference',
        options: ['Slim', 'Tailored', 'Relaxed', 'Oversized', 'Not sure'],
        required: false,
        section: 'Style Preferences'
      },
      {
        id: 'favoriteBrands',
        type: 'array',
        label: 'Brands you like',
        placeholder: 'e.g., Buck Mason, Uniqlo, Todd Snyder',
        required: false,
        section: 'Style Preferences'
      },
      {
        id: 'styleNotes',
        type: 'textarea',
        label: 'Anything else you want me to know about your style?',
        placeholder: 'Open field for additional style notes...',
        required: false,
        section: 'Style Preferences'
      },
      {
        id: 'noGoItems',
        type: 'array',
        label: 'No-go items',
        placeholder: 'e.g., Distressed jeans, Logo-heavy pieces',
        required: false,
        section: 'Style Preferences'
      },
      
      // 5. Grooming & Accessories (OPTIONAL)
      {
        id: 'accessoriesWorn',
        type: 'multiselect',
        label: 'Do you wear accessories?',
        options: ['Glasses', 'Hats', 'Bracelets', 'Watches', 'Rings', 'None'],
        required: false,
        section: 'Grooming & Accessories'
      },
      {
        id: 'wantMoreAccessories',
        type: 'select',
        label: 'Would you like to wear more accessories?',
        options: ['Yes', 'No'],
        required: false,
        section: 'Grooming & Accessories'
      },
      {
        id: 'shoeTypes',
        type: 'text',
        label: 'Shoe types you like',
        placeholder: 'e.g., Minimalist sneakers, Chelsea boots',
        required: false,
        section: 'Grooming & Accessories'
      },
      
      // 6. Budget (OPTIONAL)
      {
        id: 'monthlyClothingBudget',
        type: 'select',
        label: 'Monthly Clothing Budget',
        options: ['<$100', '$100 - $250', '$250 - $500', '$500+'],
        required: false,
        section: 'Budget'
      },
      {
        id: 'budgetType',
        type: 'multiselect',
        label: 'Type of Clothes',
        options: ['Everyday Value', 'Core Quality', 'Premium Wardrobe', 'Luxury Statement'],
        description: 'Everyday Value – Affordable basics (Uniqlo, Gap). Core Quality – Mid-range (Banana Republic, Levi\'s). Premium Wardrobe – Higher-end (Ted Baker, Theory). Luxury Statement – Designer pieces (Gucci, Tom Ford).',
        required: false,
        section: 'Budget'
      },
      
      // 7. Picture (OPTIONAL)
      {
        id: 'profilePhoto',
        type: 'photo',
        label: 'Upload a selfie or outfit photo',
        description: 'I don\'t need a pic, but it\'s helpful for me to have some more context. You can always add one later.',
        required: false,
        section: 'Picture'
      }
    ];

    res.json({ questions });
  } catch (error) {
    console.error('Error getting onboarding questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOnboardingStatus,
  updateOnboarding,
  completeOnboarding,
  getOnboardingQuestions
}; 