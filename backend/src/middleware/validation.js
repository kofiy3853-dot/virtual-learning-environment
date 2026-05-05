// Input Validation Middleware using Joi
// Pre-built validation schemas for common operations

const Joi = require('joi');

// Auth validation schemas
const authSchemas = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6).max(100),
    role: Joi.string().valid('student', 'teacher', 'admin').optional(),
    department: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// Course validation schemas
const courseSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(1000),
    code: Joi.string().required().min(2).max(20),
    semester: Joi.string().required(),
    academicYear: Joi.string().required(),
    status: Joi.string().valid('draft', 'active', 'archived').optional(),
  }),

  update: Joi.object({
    title: Joi.string().optional().min(3).max(100),
    description: Joi.string().optional().min(10).max(1000),
    code: Joi.string().optional().min(2).max(20),
    semester: Joi.string().optional(),
    academicYear: Joi.string().optional(),
    status: Joi.string().valid('draft', 'active', 'archived').optional(),
  }),
};

// Assignment validation schemas
const assignmentSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(2000),
    dueDate: Joi.date().required(),
    totalMarks: Joi.number().required().min(1),
  }),

  update: Joi.object({
    title: Joi.string().optional().min(3).max(100),
    description: Joi.string().optional().min(10).max(2000),
    dueDate: Joi.date().optional(),
    totalMarks: Joi.number().optional().min(1),
  }),
};

// Quiz validation schemas
const quizSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().optional().max(1000),
    duration: Joi.number().required().min(1),
    startTime: Joi.date().required(),
    endTime: Joi.date().required().greater(Joi.ref('startTime')),
    totalMarks: Joi.number().required().min(1),
    isPublished: Joi.boolean().optional(),
  }),

  gradeAttempt: Joi.object({
    marksObtained: Joi.number().required().min(0),
    feedback: Joi.string().optional().max(1000),
  }),
};

// Submission validation schemas
const submissionSchemas = {
  create: Joi.object({
    textContent: Joi.string().optional(),
    fileUrls: Joi.array().items(Joi.string().uri()).optional(),
  }),

  grade: Joi.object({
    grade: Joi.number().required().min(0),
    feedback: Joi.string().optional().max(1000),
  }),
};

// Enrollment validation schemas
const enrollmentSchemas = {
  create: Joi.object({
    courseId: Joi.string().required(),
  }),
};

// Create validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }

    // Replace body with validated data
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  authSchemas,
  courseSchemas,
  assignmentSchemas,
  quizSchemas,
  submissionSchemas,
  enrollmentSchemas,
};
