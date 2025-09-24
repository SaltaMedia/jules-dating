const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = 4002;

app.get('/debug-db', async (req, res) => {
  try {
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'Not connected';
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    
    res.json({
      databaseName: dbName,
      steveExists: !!steve,
      steveAdmin: steve ? steve.isAdmin : null,
      stevePasswordHash: steve ? steve.password : null
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

async function startDebugServer() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Debug server connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Debug server connected to:', mongoose.connection.db.databaseName);
    
    app.listen(PORT, () => {
      console.log(`Debug server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT}/debug-db to check database connection`);
    });
  } catch (error) {
    console.error('Debug server error:', error.message);
  }
}

startDebugServer();
