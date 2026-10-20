const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validate');

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
