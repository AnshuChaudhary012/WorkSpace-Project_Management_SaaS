const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Configure CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching client
      if (!origin || origin === clientUrl || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
