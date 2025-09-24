// Test script to debug user object loading
console.log('Testing user object loading...');

// Simulate what the frontend does
const userData = localStorage.getItem('user');
console.log('Raw user data from localStorage:', userData);

if (userData) {
  try {
    const parsedUser = JSON.parse(userData);
    console.log('Parsed user object:', parsedUser);
    console.log('User ID from parsed data:', parsedUser?.id);
    console.log('User _id from parsed data:', parsedUser?._id);
    console.log('All user object keys:', Object.keys(parsedUser));
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
} else {
  console.log('No user data found in localStorage');
}

// Test API call
const testApiCall = async () => {
  try {
    const response = await fetch('http://localhost:4001/api/chat/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test',
        context: [],
        userId: parsedUser?.id || '68a8e1f771529213f1738fe2' // Use real user ID as fallback
      })
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};

// testApiCall();
