const Joi = require('joi');

// ─── VALIDATION MIDDLEWARE WRAPPER ────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message.replace(/['"]/g, ''));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: messages
    });
  }
  // Replace body with validated data to ensure defaults and stripped unknowns
  req.body = value;
  next();
};

// ─── AUTH SCHEMAS (already implemented — included for completeness) ────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
  // Allow student or teacher — admin role is blocked in the controller
  role: Joi.string().valid('student', 'teacher').default('student'),
  department: Joi.string().max(100).optional().allow('')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// ─── COURSE SCHEMAS ────────────────────────────────────────────────────────────
const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).required()
    .messages({ 'string.empty': 'Course title is required' }),
  code: Joi.string().min(2).max(20).required()
    .messages({ 'string.empty': 'Course code is required' }),
  description: Joi.string().min(10).max(5000).required()
    .messages({ 'string.empty': 'Course description is required', 'string.min': 'Description must be at least 10 characters' }),
  semester: Joi.string().valid('Semester 1', 'Semester 2').required(),
  academicYear: Joi.string()
    .pattern(/^\d{4}\/\d{4}$/)
    .required()
    .messages({ 'string.pattern.base': 'Academic year must be in format YYYY/YYYY e.g. 2025/2026' }),
  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
  teacher: Joi.string().hex().length(24).optional(),
  // Extended wizard fields
  category: Joi.string().max(100).optional().allow(''),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  startDate: Joi.date().iso().optional().allow('', null),
  endDate: Joi.date().iso().optional().allow('', null),
  enrollmentType: Joi.string().valid('open', 'invite').optional(),
  maxStudents: Joi.number().integer().min(1).optional(),
  gradingSystem: Joi.string().valid('percentage', 'passfail').optional(),
  assignmentsEnabled: Joi.boolean().optional(),
  certificateEnabled: Joi.boolean().optional(),
  schedule: Joi.array().items(Joi.object({ day: Joi.string(), time: Joi.string() })).optional(),
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  code: Joi.string().min(2).max(20).optional(),
  description: Joi.string().max(5000).optional().allow(''),scription: Joi.string().max(5000).optional().allow(''),
  semester: Joi.string().valid('Semester 1', 'Semester 2').optional(),
  academicYear: Joi.string().pattern(/^\d{4}\/\d{4}$/).optional(),
  status: Joi.string().valid('draft', 'active', 'archived').optional(),
  teacher: Joi.string().hex().length(24).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided to update' });

// ─── MODULE SCHEMAS ────────────────────────────────────────────────────────────
const createModuleSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  weekNumber: Joi.number().integer().min(1).max(52).required()
    .messages({ 'number.min': 'Week number must be at least 1' }),
  order: Joi.number().integer().min(1).required()
});

const updateModuleSchema = Joi.object({
  title: Joi.string().min(2).max(100).optional(),
  weekNumber: Joi.number().integer().min(1).max(52).optional(),
  order: Joi.number().integer().min(1).optional()
}).min(1);

// ─── ASSIGNMENT SCHEMAS ────────────────────────────────────────────────────────
const createAssignmentSchema = Joi.object({
  title: Joi.string().min(3).max(150).required()
    .messages({ 'string.empty': 'Assignment title is required' }),
  description: Joi.string().max(2000).optional().allow(''),
  dueDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Due date is required' }),
  totalMarks: Joi.number().integer().min(1).max(1000).required()
    .messages({
      'number.min': 'Total marks must be at least 1',
      'any.required': 'Total marks is required'
    })
});

const updateAssignmentSchema = Joi.object({
  title: Joi.string().min(3).max(150).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  dueDate: Joi.date().iso().optional(),
  totalMarks: Joi.number().integer().min(1).max(1000).optional()
}).min(1);

const createSubmissionSchema = Joi.object({
  textContent: Joi.string().optional(),
  fileUrls: Joi.array().items(Joi.string().uri()).optional()
});

const gradeSubmissionSchema = Joi.object({
  grade: Joi.number().min(0).required()
    .messages({ 'any.required': 'Grade is required' }),
  feedback: Joi.string().max(1000).optional().allow('')
});

// ─── QUIZ SCHEMAS ──────────────────────────────────────────────────────────────
const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(150).required()
    .messages({ 'string.empty': 'Quiz title is required' }),
  description: Joi.string().max(1000).optional().allow(''),
  duration: Joi.number().integer().min(1).max(300).required()
    .messages({
      'number.min': 'Duration must be at least 1 minute',
      'any.required': 'Duration is required'
    }),
  startTime: Joi.date().iso().required()
    .messages({ 'any.required': 'Start time is required' }),
  endTime: Joi.date().iso().required()
    .messages({
      'any.required': 'End time is required'
    }),
  totalMarks: Joi.number().integer().min(1).required()
    .messages({ 'any.required': 'Total marks is required' })
}).custom((value, helpers) => {
  if (new Date(value.endTime) <= new Date(value.startTime)) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'End time must be after start time' });

const updateQuizSchema = Joi.object({
  title: Joi.string().min(3).max(150).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  duration: Joi.number().integer().min(1).max(300).optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),
  totalMarks: Joi.number().integer().min(1).optional()
}).min(1);

const createQuestionSchema = Joi.object({
  text: Joi.string().min(3).max(1000).required()
    .messages({ 'string.empty': 'Question text is required' }),
  type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer').required(),
  options: Joi.when('type', {
    is: 'multiple_choice',
    then: Joi.array().items(Joi.string()).min(2).max(6).required()
      .messages({ 'array.min': 'Multiple choice questions need at least 2 options' }),
    otherwise: Joi.forbidden()
  }),
  correctAnswer: Joi.when('type', {
    is: 'short_answer',
    then: Joi.forbidden(),
    otherwise: Joi.string().required()
      .messages({ 'any.required': 'Correct answer is required for this question type' })
  }),
  marks: Joi.number().integer().min(1).required()
    .messages({ 'any.required': 'Marks are required' }),
  order: Joi.number().integer().min(1).required()
});

const submitQuizSchema = Joi.object({
  answers: Joi.array().items(
    Joi.object({
      questionId: Joi.string().required(),
      answer: Joi.string().allow('').required()
    })
  ).min(1).required()
    .messages({ 'array.min': 'At least one answer is required' })
});

const gradeAttemptSchema = Joi.object({
  scoreAdjustment: Joi.number().required()
    .messages({ 'any.required': 'Score adjustment is required' }),
  feedback: Joi.string().max(1000).optional().allow('')
});

// ─── GRADE WEIGHT SCHEMA ───────────────────────────────────────────────────────
const gradeWeightSchema = Joi.object({
  assignmentWeight: Joi.number().integer().min(0).max(100).required(),
  quizWeight: Joi.number().integer().min(0).max(100).required()
}).custom((value, helpers) => {
  if (value.assignmentWeight + value.quizWeight !== 100) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({ 'any.invalid': 'assignmentWeight and quizWeight must add up to 100' });

// ─── ATTENDANCE SCHEMAS ────────────────────────────────────────────────────────
const createAttendanceSessionSchema = Joi.object({
  date: Joi.date().iso().required()
    .messages({ 'any.required': 'Session date is required' }),
  topic: Joi.string().min(2).max(200).required()
    .messages({ 'string.empty': 'Session topic is required' })
});

const markAttendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().required(),
      status: Joi.string().valid('present', 'absent', 'late').required()
    })
  ).min(1).required()
    .messages({ 'array.min': 'At least one attendance record is required' })
});

// ─── COMMUNICATION SCHEMAS ─────────────────────────────────────────────────────
const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  body: Joi.string().min(5).max(5000).required()
});

const createDiscussionSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  body: Joi.string().min(5).max(5000).required()
});

const replyDiscussionSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required()
    .messages({ 'string.empty': 'Reply cannot be empty' })
});

const sendMessageSchema = Joi.object({
  body: Joi.string().min(1).max(2000).required()
    .messages({ 'string.empty': 'Message cannot be empty' })
});

// ─── LIVE SESSION SCHEMA ───────────────────────────────────────────────────────
const createLiveSessionSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  scheduledAt: Joi.date().iso().required()
    .messages({ 'any.required': 'Scheduled time is required' }),
  duration: Joi.number().integer().min(10).max(480).required()
    .messages({
      'number.min': 'Session duration must be at least 10 minutes',
      'any.required': 'Duration is required'
    })
});

// ─── ADMIN SCHEMAS ─────────────────────────────────────────────────────────────
const changeRoleSchema = Joi.object({
  role: Joi.string().valid('student', 'teacher', 'admin').required()
});

const changeStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended').required()
});

const changeCourseStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'archived').required()
});

const reassignTeacherSchema = Joi.object({
  teacherId: Joi.string().required()
    .messages({ 'string.empty': 'Teacher ID is required' })
});

// ─── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = {
  validate,
  schemas: {
    // Auth
    register: registerSchema,
    login: loginSchema,
    // Courses
    createCourse: createCourseSchema,
    updateCourse: updateCourseSchema,
    // Modules
    createModule: createModuleSchema,
    updateModule: updateModuleSchema,
    // Assignments
    createAssignment: createAssignmentSchema,
    updateAssignment: updateAssignmentSchema,
    createSubmission: createSubmissionSchema,
    gradeSubmission: gradeSubmissionSchema,
    // Quizzes
    createQuiz: createQuizSchema,
    updateQuiz: updateQuizSchema,
    createQuestion: createQuestionSchema,
    submitQuiz: submitQuizSchema,
    gradeAttempt: gradeAttemptSchema,
    // Grades
    gradeWeight: gradeWeightSchema,
    // Attendance
    createAttendanceSession: createAttendanceSessionSchema,
    markAttendance: markAttendanceSchema,
    // Communication
    createAnnouncement: createAnnouncementSchema,
    createDiscussion: createDiscussionSchema,
    replyDiscussion: replyDiscussionSchema,
    sendMessage: sendMessageSchema,
    // Live
    createLiveSession: createLiveSessionSchema,
    // Admin
    changeRole: changeRoleSchema,
    changeStatus: changeStatusSchema,
    changeCourseStatus: changeCourseStatusSchema,
    reassignTeacher: reassignTeacherSchema,
  }
};
