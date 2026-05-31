const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
  changePassword,
  googleLogin,
  forgotPassword,
  resetPassword,
  generate2FA,
  verify2FA,
} = require('../controllers/authController');

const router = express.Router();

const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { RATE_LIMITS } = require('../config/constants');

const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.LOGIN.WINDOW_MS,
  max: RATE_LIMITS.LOGIN.MAX,
  skip: (req, res) => !!process.env.JEST_WORKER_ID,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
};

const { validate, schemas } = require('../middleware/validation');

router.post('/register', validate(schemas.register), register);
router.post('/login', loginLimiter, validate(schemas.login), login);
router.post('/google', googleLogin);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/2fa/generate', protect, generate2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.patch('/password', protect, changePassword);

module.exports = router;
