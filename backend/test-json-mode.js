// Test the new services
const { normalizeIntent } = require('./services/intentMap.js');
const { renderOutfitJsonToProse } = require('./services/renderers.js');
const { recommendOutfits } = require('./services/recommendOutfits.js');
const { weatherBucket } = require('./services/weather.js');

console.log('🧪 Testing JSON Mode Services...\n');

// Test intent normalization
console.log('1. Testing intent normalization:');
console.log('  "style advice" →', normalizeIntent('style advice'));
console.log('  "show me pics" →', normalizeIntent('show me pics'));
console.log('  "where to buy" →', normalizeIntent('where to buy'));
console.log('  "confidence help" →', normalizeIntent('confidence help'));
console.log('  "random chat" →', normalizeIntent('random chat'));

// Test weather bucketing
console.log('\n2. Testing weather bucketing:');
console.log('  80°F →', weatherBucket(80));
console.log('  65°F →', weatherBucket(65));
console.log('  45°F →', weatherBucket(45));

// Test outfit recommendations
console.log('\n3. Testing outfit recommendations:');
const testUser = { archetypePrefs: {}, bodyType: 'average' };
const testContext = { eventType: 'date_coffee', tempF: 70 };
const outfits = recommendOutfits(testUser, testContext, []);
console.log('  Found', outfits.length, 'outfits');
outfits.forEach((outfit, i) => {
  console.log(`  ${i+1}. ${outfit.name}: ${outfit.items?.join(', ')}`);
});

// Test JSON to prose rendering
console.log('\n4. Testing JSON to prose rendering:');
const testJson = {
  outfits: [
    {
      name: "Test Outfit",
      items: ["white shirt", "blue jeans", "sneakers"],
      why: "Clean and casual",
      swaps: ["swap sneakers→loafers for dressier"]
    }
  ]
};
const prose = renderOutfitJsonToProse(testJson);
console.log('  Rendered prose:', prose);

console.log('\n✅ All tests completed!');
