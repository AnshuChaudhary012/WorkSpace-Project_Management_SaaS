const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken } = require('../utils/token');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id);
    } else {
      const { devUserStore } = require('../controllers/authController');
      user = devUserStore.find((u) => u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};
