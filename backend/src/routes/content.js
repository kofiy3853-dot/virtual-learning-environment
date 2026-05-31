const express = require('express');
const { deleteContent, toggleContentComplete } = require('../controllers/contentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.delete('/:id', protect, authorize('teacher', 'admin'), deleteContent);
router.post('/:id/complete', protect, toggleContentComplete);

module.exports = router;
