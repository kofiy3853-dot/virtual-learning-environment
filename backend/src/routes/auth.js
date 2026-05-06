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
  skip: (req, res) => !!process.env.JEST_WORKER_ID,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

const { validate, schemas } = require('../middleware/validation');

router.post('/register', validate(schemas.register), register);
router.post('/login', loginLimiter, validate(schemas.login), login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
