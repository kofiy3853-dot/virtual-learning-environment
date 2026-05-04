const express = require('express');
const { deleteContent } = require('../controllers/contentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.delete('/:id', protect, authorize('teacher', 'admin'), deleteContent);

module.exports = router;
