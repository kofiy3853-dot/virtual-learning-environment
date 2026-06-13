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
const gradeRoutes = require('./routes/grades');
const communicationRoutes = require('./routes/communication');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/aiRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const contentRoutes = require('./routes/content');

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

// AI routes get a longer timeout (provider fallback chain can take up to 2 min)
app.use('/api/v1/ai', timeoutHandler(TIMEOUTS.AI_MS));

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
  app.use('/api/v1', globalLimiter);
  app.use('/api/v1', unauthorizedLimiter);
  app.use('/api/v1/auth', authLimiter);
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

// ─── API ROUTES (v1 only) ──────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/courses/:id', courseNestedRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/content', contentRoutes);

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
