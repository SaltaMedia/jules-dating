const { weatherBucket } = require('./weather.js');
const { safeRequire } = require('./safeLoad.js');

const palette = safeRequire('../seed/palette.json', { sample_fits: [] });

function recommendOutfits(user, context, closet) {
  try {
    const weather = weatherBucket(context?.tempF ?? 68);
    const event = (context?.eventType || 'date_coffee').toLowerCase();
    
    // Filter outfits by occasion and weather
    const candidates = (palette.sample_fits || []).filter(fit => {
      const matchesOccasion = fit.occasion === event;
      const matchesWeather = fit.weather === weather;
      return matchesOccasion && matchesWeather;
    });
    
    // If no exact matches, try weather-only matches
    let outfits = candidates;
    if (outfits.length === 0) {
      outfits = (palette.sample_fits || []).filter(fit => fit.weather === weather);
    }
    
    // If still no matches, use all outfits
    if (outfits.length === 0) {
      outfits = palette.sample_fits || [];
    }
    
    // Ensure diversity by avoiding similar items
    const selected = [];
    const usedItems = new Set();
    
    for (const outfit of outfits) {
      if (selected.length >= 3) break;
      
      // Check for diversity
      const outfitItems = outfit.items || [];
      const hasOverlap = outfitItems.some(item => usedItems.has(item.toLowerCase()));
      
      if (!hasOverlap || selected.length === 0) {
        selected.push(outfit);
        outfitItems.forEach(item => usedItems.add(item.toLowerCase()));
      }
    }
    
    // If we don't have 3, add more even with some overlap
    while (selected.length < 3 && outfits.length > selected.length) {
      const remaining = outfits.filter(o => !selected.includes(o));
      if (remaining.length > 0) {
        selected.push(remaining[0]);
      } else {
        break;
      }
    }
    
    return selected.slice(0, 3);
  } catch (error) {
    console.warn('Outfit recommendation failed:', error.message);
    return [];
  }
}

module.exports = { recommendOutfits };
