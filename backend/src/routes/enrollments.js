const express = require('express');
const { getMyCourses } = require('../controllers/enrollmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Note: The prompt asked for /api/students/me/courses, 
// so I'll handle that in a separate mount or here.
// In server.js I used app.use('/api/enrollments', ...). 
// I'll adjust server.js or the mounting.

router.get('/my-courses', protect, authorize('student'), getMyCourses);

module.exports = router;
