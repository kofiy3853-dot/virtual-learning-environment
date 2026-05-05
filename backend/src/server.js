const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const asyncHandler = require('./middleware/asyncHandler');
const timeoutHandler = require('./middleware/timeout');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request timeout (30s)
app.use(timeoutHandler(30000));

// Custom request logger (file-based)
app.use(requestLogger);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
// Temporarily disabled due to Express 5 compatibility issues
// app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation routes
app.use('/api-docs', require('./routes/docs'));

// Mount routers with v1 prefix
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/courses', require('./routes/courses'));
app.use('/api/v1/enrollments', require('./routes/enrollments'));
app.use('/api/v1/students', require('./routes/students'));
app.use('/api/v1/modules', require('./routes/modules'));
app.use('/api/v1/content', require('./routes/content'));
app.use('/api/v1/assignments', require('./routes/assignments'));
app.use('/api/v1/submissions', require('./routes/submissions'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/communication', require('./routes/communication'));

// Backward compatibility
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/students', require('./routes/students'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/content', require('./routes/content'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/communication', require('./routes/communication'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandler);

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

const server = httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle rejections/exceptions
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection', {
    error: err.message,
    stack: err.stack,
  });
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

module.exports = { app, server, io };
