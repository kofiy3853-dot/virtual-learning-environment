const { body, param, query, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  next();
};

// Auth Validation Rules
const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
    body('role')
      .isIn(['student', 'teacher', 'admin'])
      .withMessage('Invalid role')
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

// Course Validation Rules
const courseValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Course title is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Course title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Course description is required'),
    body('instructorId')
      .trim()
      .notEmpty()
      .withMessage('Instructor ID is required')
  ],
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Course title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
  ]
};

// Assignment Validation Rules
const assignmentValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Assignment title is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Assignment description is required'),
    body('dueDate')
      .isISO8601()
      .withMessage('Invalid due date format'),
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID')
  ],
  submit: [
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
    body('submissionText')
      .optional()
      .trim()
  ]
};

// Quiz Validation Rules
const quizValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Quiz title is required'),
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('timeLimit')
      .isInt({ min: 1 })
      .withMessage('Time limit must be a positive number'),
    body('questions')
      .isArray({ min: 1 })
      .withMessage('Quiz must have at least one question')
  ]
};

// Enrollment Validation Rules
const enrollmentValidation = {
  enroll: [
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID')
  ]
};

// Module Validation Rules
const moduleValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Module title is required'),
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Module order must be a non-negative number')
  ]
};

// Attendance Validation Rules
const attendanceValidation = {
  markAttendance: [
    param('sessionId')
      .isMongoId()
      .withMessage('Invalid session ID'),
    body('attendees')
      .isArray()
      .withMessage('Attendees must be an array')
  ]
};

// Pagination Validation Rules
const paginationValidation = {
  paginate: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  courseValidation,
  assignmentValidation,
  quizValidation,
  enrollmentValidation,
  moduleValidation,
  attendanceValidation,
  paginationValidation
};
