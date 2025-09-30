const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password only required if not using Google OAuth
    }
  },
  picture: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Enhanced onboarding data
  onboarding: {
    completed: {
      type: Boolean,
      default: false
    },
    
    // Basic Info
    name: String,
    email: String,
    zipCode: String,
    aboutMe: String,
    
    // Body Info
    height: String,
    weight: String,
    topSize: String,
    bottomSize: String,
    shoeSize: String,
    bodyType: {
      type: String,
      enum: ['Slim', 'Average', 'Athletic', 'Broad', 'Round'],
      default: 'Average'
    },
    facialHair: {
      type: String,
      enum: ['Clean-shaven', 'Clean shaven', 'Beard', 'Mustache', 'Varies'],
      default: 'Clean-shaven'
    },
    
    // Lifestyle & Context
    weeklyEnvironment: {
      type: String,
      enum: ['Office', 'Outdoors', 'Home', 'Nightlife', 'Gym', 'Travel', 'Remote', 'Other'],
      default: 'Office'
    },
    topActivities: [String],
    socialEventFrequency: {
      type: String,
      enum: ['Never', 'Occasionally', 'Weekly', 'Multiple times a week', 'Out on weekends', 'Chill'],
      default: 'Occasionally'
    },
    worksOut: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    
    // Style Preferences
    preferredStyles: [{
      type: String,
      enum: ['Casual', 'Smart Casual', 'Streetwear', 'Classic', 'Minimal', 'Rugged', 'Athletic', 'Luxury', 'Not Sure', 'Clean', 'Elevated Casual', 'Preppy', 'Techwear']
    }],
    colorsLove: [String],
    fitPreference: [{
      type: String,
      enum: ['Slim', 'Tailored', 'Relaxed', 'Oversized', 'Not sure']
    }],
    favoriteBrands: [String], // Keep this field
    styleNotes: String,
    noGoItems: [String],
    
    // Dating & Impression Goals
    relationshipStatus: {
      type: String,
      enum: ['Single', 'Dating', 'In a Relationship', 'Married'],
      default: 'Single'
    },
    impressionWord: String,
    
    // Practical Boundaries
    mostWornItem: String,
    missingFromCloset: String,
    
    // Grooming & Accessories
    accessoriesWorn: [{
      type: String,
      enum: ['Glasses', 'Hats', 'Bracelets', 'Watches', 'Rings', 'None']
    }],
    wantMoreAccessories: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    shoeTypes: String,
    
    // Budget
    monthlyClothingBudget: {
      type: String,
      enum: ['<$100', '$100 - $250', '$250 - $500', '$500+'],
      default: '$100 - $250'
    },
    budgetType: [{
      type: String,
      enum: ['Everyday Value', 'Core Quality', 'Premium Wardrobe', 'Luxury Statement']
    }],
    
    // Personalization
    profilePhoto: String, // URL to uploaded photo
    
    // Legacy fields (keeping for backward compatibility)
    shirtSize: String,
    pantSize: String,
    styleVibes: [{
      type: String,
      enum: ['Clean', 'Classic', 'Elevated Casual', 'Streetwear', 'Preppy', 'Techwear']
    }],
    itemsYouHate: [String],
    jobType: {
      type: String,
      enum: ['Corporate', 'Remote', 'Creative', 'Service', 'Student', 'Other'],
      default: 'Other'
    },
    socialLife: {
      type: String,
      enum: ['Chill', 'Out on weekends', 'Big nights', 'Figuring it out'],
      default: 'Chill'
    },
    cityOrZipCode: String
  },
  
  // Jules tone preference (1-3 scale)
  julesTone: {
    type: Number,
    min: 1,
    max: 3,
    default: 3, // Default to flirty (Jules's natural personality)
    enum: [1, 2, 3] // 1=supportive, 2=honest and straightforward, 3=snarky and sarcastic
  },
  
  // Settings
  settings: {
    aboutMe: String,
    preferences: {
      communicationStyle: {
        type: String,
        enum: ['casual', 'professional', 'direct', 'friendly'],
        default: 'direct'
      },
      adviceFocus: {
        type: String,
        enum: ['style', 'confidence', 'dating', 'career', 'general'],
        default: 'style'
      }
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  
  // Legacy body info (keeping for backward compatibility)
  bodyInfo: {
    height: String,
    weight: String,
    topSize: String,
    bottomSize: String,
    shoeSize: String,
    bodyType: {
      type: String,
      enum: ['athletic', 'slim', 'average', 'plus-size', 'tall', 'short'],
      default: 'average'
    }
  },
  
  // Legacy style preferences (keeping for backward compatibility)
  stylePreferences: {
    brands: [String],
    style: {
      type: String,
      enum: ['casual', 'business-casual', 'formal', 'streetwear', 'minimalist', 'trendy'],
      default: 'casual'
    },
    budget: {
      type: String,
      enum: ['budget', 'mid-range', 'premium', 'luxury'],
      default: 'mid-range'
    },
    occasions: [{
      type: String,
      enum: ['work', 'dates', 'casual', 'formal', 'gym', 'travel']
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  followUpEmailSent: {
    type: Boolean,
    default: false
  },
  followUpEmailScheduled: {
    type: Date,
    default: function() {
      // Schedule follow-up email for 4 days after signup
      return new Date(Date.now() + (4 * 24 * 60 * 60 * 1000));
    }
  },
  
  // GDPR Consent Management
  consentPreferences: {
    necessary: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: false
    },
    marketing: {
      type: Boolean,
      default: false
    },
    functional: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);