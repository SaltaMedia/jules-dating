/**
 * Builds a minimal, LLM-friendly context object from UserProfile
 * This is the compact context that Jules consumes in every chat
 */
function buildJulesContext(profile) {
  if (!profile) {
    return null;
  }

  return {
    name: profile.name,
    aboutMe: profile.aboutMe,
    body: {
      heightCm: profile.bodyInfo?.heightCm,
      weightKg: profile.bodyInfo?.weightKg,
      bodyType: profile.bodyInfo?.bodyType,
      sizes: {
        top: profile.bodyInfo?.topSize,
        bottom: profile.bodyInfo?.bottomSize,
        shoe: profile.bodyInfo?.shoeSize
      }
    },
    style: {
      preferred: profile.styleProfile?.preferredStyles || [],
      fit: profile.styleProfile?.fitPreference,
      colorsLove: profile.styleProfile?.colorsLove || [],
      colorsAvoid: profile.styleProfile?.colorsAvoid || [],
      vibe: profile.styleProfile?.vibeTags || [],
      noGo: profile.styleProfile?.noGoItems || [],
      fabrics: profile.styleProfile?.fabricSensitivities || []
    },
    lifestyle: {
      environments: profile.lifestyle?.primaryEnvironments || [],
      activities: profile.lifestyle?.topActivities || [],
      city: profile.lifestyle?.city,
      datingMode: !!profile.lifestyle?.datingMode,
      impressionWord: profile.lifestyle?.impressionWord,
      idealFirstDateLook: profile.lifestyle?.idealFirstDateLook,
      monthlyClothingBudget: profile.lifestyle?.monthlyClothingBudget
    },
    wardrobe: {
      mostWorn: profile.wardrobe?.mostWornItem,
      missing: profile.wardrobe?.missingItems || [],
      accessories: profile.wardrobe?.accessories || [],
      hairBeard: profile.wardrobe?.hairBeardStyle,
      shoeTypes: profile.wardrobe?.shoeTypes || []
    },
    investment: {
      level: profile.investment?.level,
      fewerBetter: !!profile.investment?.fewerBetterPieces,
      retailers: profile.investment?.preferredRetailers || []
    }
  };
}

/**
 * Converts legacy User model data to new UserProfile format
 * Used for migration from old system
 */
function migrateUserToProfile(user) {
  if (!user) return null;

  const profile = {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    aboutMe: user.settings?.aboutMe || '',
    bodyInfo: {
      heightCm: user.onboarding?.height ? parseHeightToCm(user.onboarding.height) : null,
      weightKg: user.onboarding?.weight ? parseWeightToKg(user.onboarding.weight) : null,
      topSize: user.onboarding?.shirtSize || user.bodyInfo?.topSize,
      bottomSize: user.onboarding?.pantSize || user.bodyInfo?.bottomSize,
      shoeSize: user.onboarding?.shoeSize || user.bodyInfo?.shoeSize,
      bodyType: user.onboarding?.bodyType || user.bodyInfo?.bodyType,
      lastUpdated: new Date()
    },
    styleProfile: {
      preferredStyles: user.onboarding?.preferredStyles || [],
      colorsLove: user.onboarding?.colorsLove || [],
      colorsAvoid: [],
      fitPreference: user.onboarding?.fitPreference?.[0] || "Not sure",
      vibeTags: [],
      favoriteBrands: user.onboarding?.favoriteBrands || user.stylePreferences?.brands || [],
      noGoItems: user.onboarding?.noGoItems || [],
      fabricSensitivities: [],
      lastUpdated: new Date()
    },
    lifestyle: {
      primaryEnvironments: user.onboarding?.weeklyEnvironment ? [user.onboarding.weeklyEnvironment] : [],
      topActivities: [],
      city: user.onboarding?.zipCode,
      climateNotes: '',
      datingMode: false,
      impressionWord: '',
      idealFirstDateLook: '',
      relationshipStatus: user.onboarding?.relationshipStatus || "Prefer not to say",
      monthlyClothingBudget: user.onboarding?.monthlyClothingBudget || '$100 - $250',
      lastUpdated: new Date()
    },
    wardrobe: {
      mostWornItem: '',
      missingItems: [],
      closetPhotos: [],
      accessories: user.onboarding?.accessoriesWorn || [],
      hairBeardStyle: user.onboarding?.facialHair || '',
      shoeTypes: user.onboarding?.shoeTypes ? [user.onboarding.shoeTypes] : [],
      lastUpdated: new Date()
    },
    investment: {
      level: user.onboarding?.budgetType?.[0] || mapBudgetToInvestmentLevel(user.stylePreferences?.budget),
      fewerBetterPieces: true,
      preferredRetailers: [],
      lastUpdated: new Date()
    },
    meta: {
      createdAt: user.createdAt || new Date(),
      updatedAt: new Date(),
      lastContextBuildAt: new Date()
    }
  };

  return profile;
}

/**
 * Helper function to map old budget values to new investment levels
 */
function mapBudgetToInvestmentLevel(oldBudget) {
  const mapping = {
    'budget': 'Everyday Value',
    'mid-range': 'Core Quality', 
    'premium': 'Premium Wardrobe',
    'luxury': 'Luxury Statement'
  };
  return mapping[oldBudget] || 'Core Quality';
}

/**
 * Helper function to parse height string to cm
 */
function parseHeightToCm(heightStr) {
  if (!heightStr) return null;
  
  // Handle formats like "5'10"", "6'0"", etc.
  const match = heightStr.match(/(\d+)'(\d+)"/);
  if (match) {
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return Math.round((feet * 12 + inches) * 2.54);
  }
  
  // Handle just numbers (assume inches)
  const numMatch = heightStr.match(/(\d+)/);
  if (numMatch) {
    const inches = parseInt(numMatch[1]);
    return Math.round(inches * 2.54);
  }
  
  return null;
}

/**
 * Helper function to parse weight string to kg
 */
function parseWeightToKg(weightStr) {
  if (!weightStr) return null;
  
  // Handle formats like "180 lbs", "80 kg", etc.
  const lbsMatch = weightStr.match(/(\d+)\s*lbs?/i);
  if (lbsMatch) {
    const lbs = parseInt(lbsMatch[1]);
    return Math.round(lbs * 0.453592);
  }
  
  const kgMatch = weightStr.match(/(\d+)\s*kg/i);
  if (kgMatch) {
    return parseInt(kgMatch[1]);
  }
  
  // Handle just numbers (assume lbs)
  const numMatch = weightStr.match(/(\d+)/);
  if (numMatch) {
    const lbs = parseInt(numMatch[1]);
    return Math.round(lbs * 0.453592);
  }
  
  return null;
}

module.exports = {
  buildJulesContext,
  migrateUserToProfile,
  mapBudgetToInvestmentLevel,
  parseHeightToCm,
  parseWeightToKg
}; 