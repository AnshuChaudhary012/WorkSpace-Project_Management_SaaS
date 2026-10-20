const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name
  };

  const secret = process.env.JWT_SECRET || 'workspace_dev_secret_key_2026_super_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'workspace_dev_secret_key_2026_super_secure';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
