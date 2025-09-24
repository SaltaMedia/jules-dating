// If your existing buildJulesContext exists, use it. Otherwise shim.
async function buildUserContext(userId, UserProfile, User) {
  try {
    const maybe = require('../utils/contextBuilder');
    if (maybe?.buildJulesContext) {
      const profile = await UserProfile.findOne({ userId });
      if (profile) return maybe.buildJulesContext(profile);
    }
  } catch {}

  // Fallback to old User fields
  let user = null;
  try { user = await User.findById(userId); } catch {}
  if (!user) return null;

  const ctx = {
    name: user.name,
    aboutMe: user.settings?.aboutMe,
    style: {
      preferred: user.stylePreferences?.style ? [user.stylePreferences.style] : [],
      colorsLove: [],
      colorsAvoid: []
    },
    lifestyle: {
      monthlyClothingBudget: user.onboarding?.monthlyClothingBudget || user.stylePreferences?.budget,
      environments: user.stylePreferences?.occasions || []
    },
    body: {
      sizes: {
        top: user.bodyInfo?.topSize,
        bottom: user.bodyInfo?.bottomSize,
        shoe: user.bodyInfo?.shoeSize
      },
      bodyType: user.onboarding?.bodyType || user.bodyInfo?.bodyType
    }
  };
  return ctx;
}

module.exports = { buildUserContext };
