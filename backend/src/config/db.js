const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri;
    
    if (process.env.NODE_ENV === 'test') {
      uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/lms_test';
    } else {
      uri = process.env.MONGO_URI;
      
      // Check if MONGO_URI is set in production
      if (!uri) {
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ CRITICAL: MONGO_URI environment variable is not set in production!');
          console.error('Please set MONGO_URI in your deployment environment variables.');
          console.error('Example: mongodb+srv://username:password@cluster.mongodb.net/database-name');
          process.exit(1);
        }
        // Development fallback
        uri = 'mongodb://127.0.0.1:27017/lms';
        console.warn('⚠️  MONGO_URI not set. Using local MongoDB fallback for development.');
      }
    }
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Deployment failed: Cannot connect to MongoDB.');
      console.error('Ensure MONGO_URI is set in your environment variables.');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
