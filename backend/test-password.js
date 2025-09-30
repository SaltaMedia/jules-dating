const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'TestPassword123';
  
  console.log('Original password:', password);
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log('Hashed password:', hashedPassword);
  
  // Test comparison
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password comparison result:', isValid);
  
  // Test with the same password again
  const isValid2 = await bcrypt.compare(password, hashedPassword);
  console.log('Second password comparison result:', isValid2);
}

testPassword().catch(console.error);
