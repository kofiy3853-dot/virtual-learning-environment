const express = require('express');
const assignmentRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const {
  submitAssignment,
  getSubmissions,
  getMySubmission,
  gradeSubmission
} = require('../controllers/submissionController');

const upload = require('../middleware/upload');

assignmentRouter.get('/courses/:id/assignments', protect, getAssignments);
assignmentRouter.post('/courses/:id/assignments',
  protect,
  authorize('teacher'),
  validate(schemas.createAssignment),
  createAssignment
);
assignmentRouter.get('/assignments/:id', protect, getAssignment);
assignmentRouter.put('/assignments/:id',
  protect,
  authorize('teacher'),
  validate(schemas.updateAssignment),
  updateAssignment
);
assignmentRouter.delete('/assignments/:id', protect, authorize('teacher'), deleteAssignment);

// Submissions
assignmentRouter.post('/assignments/:id/submit',
  protect,
  authorize('student'),
  upload.array('files', 5),
  submitAssignment
);
assignmentRouter.get('/assignments/:id/submissions', protect, authorize('teacher'), getSubmissions);
assignmentRouter.get('/assignments/:id/my-submission', protect, authorize('student'), getMySubmission);
assignmentRouter.patch('/submissions/:id/grade',
  protect,
  authorize('teacher'),
  validate(schemas.gradeSubmission),
  gradeSubmission
);

module.exports = assignmentRouter;
