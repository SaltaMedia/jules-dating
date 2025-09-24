const mongoose = require('mongoose');

const BodyInfoSchema = new mongoose.Schema({
  heightCm: Number,          // store metric; convert on UI as needed
  weightKg: Number,
  topSize: String,           // e.g., M, L, 42, etc.
  bottomSize: String,
  shoeSize: String,
  bodyType: { 
    type: String, 
    enum: ["Slim","Average","Athletic","Broad","Plus","Other"], 
    default: "Other" 
  },
  lastUpdated: { type: Date }
}, { _id: false });

const StyleProfileSchema = new mongoose.Schema({
  preferredStyles: [String],     // ["Smart Casual","Minimal","Rugged"]
  colorsLove: [String],          // hex or names
  colorsAvoid: [String],
  fitPreference: { 
    type: String, 
    enum: ["Slim","Tailored","Relaxed","Oversized","Mixed"], 
    default: "Tailored" 
  },
  vibeTags: [String],            // ["bold","classic","creative"]
  favoriteBrands: [String],
  noGoItems: [String],           // ["logo-heavy","distressed"]
  fabricSensitivities: [String], // ["itchy-wool","heat-retention"]
  lastUpdated: { type: Date }
}, { _id: false });

const LifestyleSchema = new mongoose.Schema({
  primaryEnvironments: [String],     // ["office","outdoors","nightlife","gym","travel","home"]
  topActivities: [String],           // free-text top 3
  city: String,
  climateNotes: String,              // optional text
  datingMode: { type: Boolean, default: false },
  impressionWord: String,            // "confident"
  idealFirstDateLook: String,        // short text
  relationshipStatus: { 
    type: String, 
    enum: ["Single","Dating","In a Relationship","Married","Prefer not to say"], 
    default: "Prefer not to say" 
  },
  monthlyClothingBudget: {
    type: String,
    enum: ['<$100', '$100–$250', '$250–$500', '$500+'],
    default: '$100–$250'
  },
  lastUpdated: { type: Date }
}, { _id: false });

const WardrobeSchema = new mongoose.Schema({
  mostWornItem: String,
  missingItems: [String],
  closetPhotos: [{
    url: String,
    label: String,
    uploadedAt: Date
  }],
  accessories: [String],            // ["glasses","hats","watch","rings"]
  hairBeardStyle: String,
  shoeTypes: [String],
  lastUpdated: { type: Date }
}, { _id: false });

const InvestmentSchema = new mongoose.Schema({
  level: { 
    type: String, 
    enum: ["Everyday Value","Core Quality","Premium Wardrobe","Luxury Statement"], 
    default: "Core Quality" 
  },
  fewerBetterPieces: { type: Boolean, default: true },
  preferredRetailers: [String],
  philosophyNote: { 
    type: String, 
    default: "Jules avoids fast fashion and prioritizes quality, fit, and longevity." 
  },
  lastUpdated: { type: Date }
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, unique: true, index: true },   // your auth id
  name: String,
  email: { type: String, index: true },
  aboutMe: String,
  bodyInfo: BodyInfoSchema,
  styleProfile: StyleProfileSchema,
  lifestyle: LifestyleSchema,
  wardrobe: WardrobeSchema,
  investment: InvestmentSchema,
  
  // NEW: Pre-computed context summary for cost-effective context management
  contextSummary: {
    summary: String,           // AI-generated summary of user preferences
    lastGenerated: { type: Date },
    version: { type: Number, default: 1 },  // Track context version for updates
    confidence: { type: Number, default: 0.8 },  // Confidence in summary accuracy
    keyPreferences: {          // Essential preferences for quick access
      style: [String],
      colors: [String],
      brands: [String],
      budget: String,
      bodyType: String,
      environments: [String]
    }
  },
  
  meta: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    lastContextBuildAt: { type: Date } // when we last built the chat context object
  }
}, { collection: "user_profiles" });

UserProfileSchema.pre("save", function(next){
  this.meta = this.meta || {};
  this.meta.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("UserProfile", UserProfileSchema); 