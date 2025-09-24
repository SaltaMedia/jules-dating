require('dotenv').config();
console.log('Testing learning route import...');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

try {
  const learningRoutes = require('./routes/learning');
  console.log('✅ Learning routes imported successfully');
  
  // Test if the ConversationLearning utility can be imported
  const ConversationLearning = require('./utils/conversationLearning');
  console.log('✅ ConversationLearning utility imported successfully');
  
  console.log('✅ All learning components working - the issue is elsewhere');
} catch (error) {
  console.error('❌ Error importing learning components:', error.message);
  console.error(error.stack);
}
