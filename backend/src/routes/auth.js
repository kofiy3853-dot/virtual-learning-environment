const express = require('express');
const {
  register,
  login,
  getMe,
  updateMe,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

const { validate, authSchemas } = require('../middleware/validation');

router.post('/register', validate(authSchemas.register), register);
router.post('/login', loginLimiter, validate(authSchemas.login), login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
