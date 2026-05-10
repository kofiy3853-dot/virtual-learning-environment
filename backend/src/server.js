const express = require('express');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const timeoutHandler = require('./middleware/timeout');
const logger = require('./utils/logger');

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
const adminRoutes = require('./routes/admin');

// Connect to MongoDB
connectDB();

const app = express();

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      // Allow dynamic process.env.CLIENT_URL as well
      process.env.CLIENT_URL,
      // Add your Vercel/Netlify/Render frontend URL here once deployed:
      'https://virtual-learning-environment.vercel.app',
      'https://virtual-learning-environment.vercel.app/',
      'https://virtual-learning-environment-th7m.onrender.com', 
      'https://unilearn-frontend.onrender.com', 
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not in allowed list`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parsing — required for HttpOnly JWT cookie support
app.use(cookieParser());

// NoSQL injection protection
// Temporarily disabled due to Express 5 compatibility issues
// app.use(mongoSanitize());

// Request logging (logs to ./logs with daily rotation)
app.use(requestLogger);

// Request timeout — 30 seconds globally
app.use(timeoutHandler(30000));

// ─── GLOBAL RATE LIMITING ───────────────────────────────────────────────────
// Protects every endpoint on the API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Stricter limiter specifically for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                    // only 20 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

if (!process.env.JEST_WORKER_ID) {
  app.use('/api', globalLimiter);
  app.use('/api/auth', authLimiter);
}

// Root Route (Health Check)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'UniLearn API is running...',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// ─── API ROUTES ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/courses/:id', courseNestedRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api', quizRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/live-sessions', liveRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

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
const io = require('socket.io')(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

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

module.exports = { app, server, io };
