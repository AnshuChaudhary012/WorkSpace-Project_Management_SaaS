require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn(`[Server] Starting Express server in standalone mode without active database.`);
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] WorkSpace API server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

if (require.main === module) {
  startServer();
}

module.exports = app;
