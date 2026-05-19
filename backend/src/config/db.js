const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'test'
      ? (process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/lms_test')
      : (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
