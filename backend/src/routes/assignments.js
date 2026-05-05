const express = require('express');
const {
  validate,
  assignmentSchemas,
  submissionSchemas,
} = require('../middleware/validation');
const {
  getAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');

const {
  submitAssignment,
  getSubmissions,
  getMySubmission,
} = require('../controllers/submissionController');

const upload = require('../middleware/upload');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/:id')
  .get(protect, getAssignment)
  .put(
    protect,
    authorize('teacher', 'admin'),
    validate(assignmentSchemas.update),
    updateAssignment
  )
  .delete(protect, authorize('teacher', 'admin'), deleteAssignment);

router.post(
  '/:id/submit',
  protect,
  authorize('student'),
  upload.array('files', 5),
  validate(submissionSchemas.create),
  submitAssignment
);
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), getSubmissions);
router.get('/:id/my-submission', protect, authorize('student'), getMySubmission);

module.exports = router;
