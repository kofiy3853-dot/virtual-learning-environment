const express = require('express');
const { deleteContent, toggleContentComplete, getContent } = require('../controllers/contentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/:id', protect, getContent);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteContent);
router.post('/:id/complete', protect, toggleContentComplete);

module.exports = router;
