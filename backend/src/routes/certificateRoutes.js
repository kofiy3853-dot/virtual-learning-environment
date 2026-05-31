const express = require('express');
const {
  generateCertificate,
  getCertificate,
  getMyCertificates
} = require('../controllers/certificateController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Public route to verify certificate
router.get('/:id', getCertificate);

// Protected student routes
router.get('/me/list', protect, getMyCertificates);
router.post('/generate/:courseId', protect, generateCertificate);

module.exports = router;
