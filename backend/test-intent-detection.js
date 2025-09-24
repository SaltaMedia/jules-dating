// Test script to debug intent detection
const chatController = require('./controllers/chatController.js');

// Extract the determineIntent function
function determineIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Define trigger priorities (higher number = higher priority)
  const triggerPriorities = {
    // High priority triggers (style advice - check these first)
    'what should i wear': 110,
    'what to wear': 110,
    'outfit advice': 110,
    'outfit advice for': 110,
    'personalized style recommendations': 120,
    'personalized recommendations': 120,
    'personalized picks': 120,
    'recommendations for me': 120,
    'coffee date': 115,
    'dinner date': 115,
    'first date': 115,
    'date outfit': 115,
    'work outfit': 115,
    'casual outfit': 115,
    'formal outfit': 115,
    'confidence': 110,
    'nervous': 110,
    'anxious': 110,
    'first impression': 110,
    
    // Visual requests
    'show me pictures': 100,
    'show me pics': 100,
    'show me photos': 100,
    'show me images': 100,
    'show me': 95,
    'show me some': 95,
    'pull up some': 95,
    'pull up': 90,
    'pic': 90,
    'pics': 90,
    'examples': 90,
    'inspiration': 90,
    'photos': 90,
    'images': 90,
    'photo': 90,
    'image': 90,
    'visual examples': 90,
    
    // Shopping actions (lower priority than style advice)
    'buy': 60,
    'want to buy': 60,
    'need to buy': 60,
    'need some': 60,
    'need a': 60,
    'need an': 60,
    'need new': 60,
    'need to find': 60,
    'need to get': 60,
    'looking for': 55,
    'shop': 50,
    'where to buy': 50,
    'find': 45,
    'recommend': 40,
    'recommendations for': 40,
    'can you find': 40,
    'link': 35,
    'links': 35,
    'pull up links': 65,
    'pull up some links': 65,
    'show me links': 65,
    'show me some links': 65,
    'under $': 105,
    'under \$': 105,
    'less than $': 105,
    'less than \$': 105,
    'cheap': 105,
    'budget': 105,
    'affordable': 105,
    
    // Lower priority triggers (general topics)
    'shirt': 10,
    'pants': 10,
    'jeans': 10,
    'jacket': 10,
    'suit': 10,
    'clothing': 10,
    
    // Other triggers (default priority)
    'fashion advice': 50,
    'style advice': 50,
    'closet': 50,
    'outfit from': 50,
    'what can i make': 50,
    'not feeling': 50,
    'down': 50,
    'bad day': 50,
    'stressed': 50,
    'date': 50,
    'dating': 50,
    'meet': 50,
    'girl': 50,
    'woman': 50,
  };

  let highestPriority = 0;
  let detectedIntent = 'general';

  // Check each trigger
  for (const [trigger, priority] of Object.entries(triggerPriorities)) {
    if (lowerMessage.includes(trigger) && priority > highestPriority) {
      highestPriority = priority;
      
      // Determine intent based on trigger
      if (priority >= 110) {
        detectedIntent = 'style_feedback';
      } else if (priority >= 90) {
        detectedIntent = 'style_images';
      } else if (priority >= 40) {
        detectedIntent = 'product_recommendation';
      } else {
        detectedIntent = 'general';
      }
    }
  }

  return detectedIntent;
}

// Test cases that should go to style_feedback
const styleAdviceTests = [
  "I need outfit advice",
  "What should I wear for a coffee date?",
  "What to wear to a dinner date?",
  "Style advice for work",
  "How should I dress for a first date?",
  "I'm nervous about a coffee date, what should I wear?",
  "Outfit advice for a casual date"
];

// Test cases that should go to style_images
const visualTests = [
  "Show me examples",
  "Can you show me some examples?",
  "Show me pictures",
  "Pull up some inspiration",
  "I want to see examples"
];

// Test cases that should go to product_recommendation
const shoppingTests = [
  "Where to buy jeans",
  "Pull up links",
  "Show me links",
  "I need to buy a shirt",
  "Where can I buy this?"
];

console.log("🧪 Testing Intent Detection Logic\n");

console.log("📋 STYLE ADVICE TESTS (should route to style_feedback):");
styleAdviceTests.forEach(test => {
  const intent = determineIntent(test);
  const status = intent === 'style_feedback' ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} "${test}" → ${intent}`);
});

console.log("\n📋 VISUAL TESTS (should route to style_images):");
visualTests.forEach(test => {
  const intent = determineIntent(test);
  const status = intent === 'style_images' ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} "${test}" → ${intent}`);
});

console.log("\n📋 SHOPPING TESTS (should route to product_recommendation):");
shoppingTests.forEach(test => {
  const intent = determineIntent(test);
  const status = intent === 'product_recommendation' ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} "${test}" → ${intent}`);
});

console.log("\n🔍 DEBUGGING PRIORITY SYSTEM:");
console.log("Current priority weights:");
console.log("- 'outfit advice': 110");
console.log("- 'what should i wear': 110");
console.log("- 'show me': 95");
console.log("- 'shop': 50");
console.log("- 'where to buy': 50");

// Test the specific case that's failing
console.log("\n🚨 TESTING THE FAILING CASE:");
const failingTest = "I need outfit advice";
console.log(`Input: "${failingTest}"`);
console.log(`Lower case: "${failingTest.toLowerCase()}"`);
console.log(`Contains 'outfit advice': ${failingTest.toLowerCase().includes('outfit advice')}`);
console.log(`Contains 'shop': ${failingTest.toLowerCase().includes('shop')}`);

const intent = determineIntent(failingTest);
console.log(`Result: ${intent}`);

// Check if there are any conflicting triggers
const lowerTest = failingTest.toLowerCase();
const triggers = {
  'outfit advice': lowerTest.includes('outfit advice'),
  'what should i wear': lowerTest.includes('what should i wear'),
  'what to wear': lowerTest.includes('what to wear'),
  'shop': lowerTest.includes('shop'),
  'where to buy': lowerTest.includes('where to buy'),
  'buy': lowerTest.includes('buy')
};

console.log("\n🔍 TRIGGER ANALYSIS:");
Object.entries(triggers).forEach(([trigger, found]) => {
  if (found) {
    console.log(`Found trigger: "${trigger}"`);
  }
}); 