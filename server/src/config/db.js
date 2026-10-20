const mongoose = require('mongoose');
const dns = require('dns');

// Ensure reliable SRV record resolution across all local & cloud networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in container
}

const connectDB = async (uri) => {
  const dbUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/workspace_saas';
  try {
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 2500, // Quick 2.5s timeout if MongoDB is not reachable
    });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Database] Continuing without local MongoDB. For full functionality, ensure MongoDB is running locally or provide MONGODB_URI in .env');
    }
    throw error;
  }
};

module.exports = connectDB;
