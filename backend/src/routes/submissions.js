const express = require('express');
const { validate, submissionSchemas } = require('../middleware/validation');
const { gradeSubmission } = require('../controllers/submissionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.patch(
  '/:id/grade',
  protect,
  authorize('teacher', 'admin'),
  validate(submissionSchemas.grade),
  gradeSubmission
);

module.exports = router;
