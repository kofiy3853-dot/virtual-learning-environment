const express = require('express');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// ─── CRITICAL ENV-VAR GUARD ────────────────────────────────────────────────────
// Fail fast at startup if required secrets are missing (prevents silent runtime
// crashes like "Login error" with an empty message).
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'MONGO_URI'];
const missingEnvVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ CRITICAL: The following required environment variables are not set:');
  missingEnvVars.forEach(v => console.error(`   - ${v}`));
  console.error('Please set them in your deployment environment (e.g. Render > Environment).');
  process.exit(1);
}

// Deployment trigger: Teacher API inline routes v1.1.2 - bypass route file caching

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { RATE_LIMITS, TIMEOUTS } = require('./config/constants');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const securityLogger = require('./middleware/securityLogger');
const timeoutHandler = require('./middleware/timeout');


// Route imports
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const courseNestedRoutes = require('./routes/courseNested');
const enrollmentRoutes = require('./routes/enrollments');
const moduleRoutes = require('./routes/modules');
const contentRoutes = require('./routes/content');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const gradeRoutes = require('./routes/grades');
const quizRoutes = require('./routes/quizzes');
const attendanceRoutes = require('./routes/attendance');
const communicationRoutes = require('./routes/communication');
const liveRoutes = require('./routes/liveSessions');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/aiRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Trust Render's proxy (MANDATORY for rate limiting to work on Render/Vercel)
app.set('trust proxy', 1);

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────

// Security headers — configure helmet to allow Jitsi embedding
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.jit.si", "https://www.pinterest.com"],
      // keep other defaults (script-src, style-src, etc.)
    },
  },
  // Allow Jitsi to be framed inside our app
  frameguard: false,
  // Allow Jitsi's cross-origin scripts/media
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
  'https://virtual-learning-environment.vercel.app',
  'https://virtual-learning-environment-th7m.onrender.com',
  'https://unilearn-frontend.onrender.com',
  'https://virtual-learning-environment-nicvgjzhp-kofiy3853-dots-projects.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    // Allow any Vercel preview deployment or explicitly listed origin
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }

    // Reject — but do NOT throw an Error (that causes a 500 with no CORS headers)
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Cookie parsing — required for HttpOnly JWT cookie support
app.use(cookieParser());

// NoSQL injection protection (Custom sanitizer for Express 5 compatibility)
const sanitizeObj = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (/^\$/.test(key)) {
        delete obj[key];
      } else {
        sanitizeObj(obj[key]);
      }
    }
  }
};
app.use((req, res, next) => {
  ['body', 'params', 'query'].forEach(k => {
    if (req[k]) sanitizeObj(req[k]);
  });
  next();
});

// Request logging (logs to ./logs with daily rotation)
app.use(requestLogger);

// Security event logging (403, 401 attempts)
app.use(securityLogger);

// Request timeout — from constants
app.use(timeoutHandler(TIMEOUTS.GLOBAL_MS));

// ─── GLOBAL RATE LIMITING ───────────────────────────────────────────────────
// Protects every endpoint on the API
const globalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GLOBAL.WINDOW_MS,
  max: RATE_LIMITS.GLOBAL.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Stricter limiter specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Rate limiter for unauthorized access attempts (403 responses)
const unauthorizedLimiter = rateLimit({
  windowMs: RATE_LIMITS.UNAUTHORIZED.WINDOW_MS,
  max: RATE_LIMITS.UNAUTHORIZED.MAX,
  skipSuccessfulRequests: true, // Counts any 4xx/5xx response
  message: {
    success: false,
    message: 'Too many unauthorized access attempts. Your IP has been temporarily blocked.'
  }
});

if (!process.env.JEST_WORKER_ID) {
  app.use('/api', globalLimiter);
  app.use('/api', unauthorizedLimiter);
  app.use('/api/auth', authLimiter);
}

// Root Route (Health Check)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UniLearn API is running...',
    version: '1.1.2',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// ─── TEACHER ROUTES (inline to guarantee registration) ───────────────────────
const { protect, authorize } = require('./middleware/auth');
const teacherController = require('./controllers/teacherController');

logger.info('[SERVER] Registering inline teacher routes...');
app.get('/api/teachers/test', (req, res) => res.json({ success: true, message: 'Teacher routes OK', version: '1.1.2' }));
app.get('/api/teachers/me/stats',               protect, authorize('teacher'), teacherController.getMyStats);
app.get('/api/teachers/me/courses',             protect, authorize('teacher'), teacherController.getMyCourses);
app.get('/api/teachers/me/pending-submissions', protect, authorize('teacher'), teacherController.getPendingSubmissions);
app.get('/api/teachers/me/courses/:courseId/gradebook',   protect, authorize('teacher'), teacherController.getCourseGradebook);
app.get('/api/teachers/me/courses/:courseId/analytics',   protect, authorize('teacher'), teacherController.getCourseAnalytics);
app.get('/api/teachers/me/courses/:courseId/at-risk',     protect, authorize('teacher'), teacherController.getAtRiskStudents);
app.get('/api/teachers/me/courses/:courseId/assignments', protect, authorize('teacher'), teacherController.getCourseAssignments);
app.get('/api/teachers/me/courses/:courseId/quizzes',     protect, authorize('teacher'), teacherController.getCourseQuizzes);
app.get('/api/teachers/me/assignments/:assignmentId/submissions', protect, authorize('teacher'), teacherController.getAssignmentSubmissions);
app.get('/api/teachers/me/quizzes/:quizId/attempts',      protect, authorize('teacher'), teacherController.getQuizAttempts);

app.get('/api/v1/teachers/test', (req, res) => res.json({ success: true, message: 'Teacher routes OK', version: '1.1.2' }));
app.get('/api/v1/teachers/me/stats',               protect, authorize('teacher'), teacherController.getMyStats);
app.get('/api/v1/teachers/me/courses',             protect, authorize('teacher'), teacherController.getMyCourses);
app.get('/api/v1/teachers/me/pending-submissions', protect, authorize('teacher'), teacherController.getPendingSubmissions);
app.get('/api/v1/teachers/me/courses/:courseId/gradebook',   protect, authorize('teacher'), teacherController.getCourseGradebook);
app.get('/api/v1/teachers/me/courses/:courseId/analytics',   protect, authorize('teacher'), teacherController.getCourseAnalytics);
app.get('/api/v1/teachers/me/courses/:courseId/at-risk',     protect, authorize('teacher'), teacherController.getAtRiskStudents);
app.get('/api/v1/teachers/me/courses/:courseId/assignments', protect, authorize('teacher'), teacherController.getCourseAssignments);
app.get('/api/v1/teachers/me/courses/:courseId/quizzes',     protect, authorize('teacher'), teacherController.getCourseQuizzes);
app.get('/api/v1/teachers/me/assignments/:assignmentId/submissions', protect, authorize('teacher'), teacherController.getAssignmentSubmissions);
app.get('/api/v1/teachers/me/quizzes/:quizId/attempts',      protect, authorize('teacher'), teacherController.getQuizAttempts);
logger.info('[SERVER] Inline teacher routes registered.');

// Standard API routes
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:id', courseNestedRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/live-sessions', liveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/certificates', certificateRoutes);

// Versioned API routes (v1)
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/courses/:id', courseNestedRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/modules', moduleRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/live-sessions', liveRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/certificates', certificateRoutes);

// Helper for nested and root routes that don't have standard prefix
app.use('/api', assignmentRoutes);
app.use('/api', quizRoutes);
app.use('/api/v1', assignmentRoutes);
app.use('/api/v1', quizRoutes);

// API Documentation
app.use('/api-docs', require('./routes/docs'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ─── CENTRALIZED ERROR HANDLER (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const httpServer = require('http').createServer(app);
const socketManager = require('./utils/socketManager');
const io = socketManager.init(httpServer);

// Socket.io config
require('./config/socket')(io);

if (process.env.NODE_ENV !== 'test') {
  const server = httpServer.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

const server = httpServer; // Export the httpServer for testing/graceful shutdown

// Handle unhandled rejections/exceptions
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

module.exports = { app, server, io: socketManager.getIO() };
