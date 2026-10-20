const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('[Serverless] MongoDB connection attempt finished:', err.message);
  }
  return app(req, res);
};
