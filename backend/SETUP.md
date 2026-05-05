# Virtual Learning Environment - Backend Setup Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Running the Server](#running-the-server)
4. [API Documentation](#api-documentation)
5. [Development](#development)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## 🚀 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- MongoDB (local or Atlas)
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sammyopare321-boop/Virtual-Learning-Environment.git
   cd Virtual-Learning-Environment/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm --version
   node --version
   ```

---

## ⚙️ Configuration

### Environment Variables

1. **Create `.env` file from template**
   ```bash
   cp .env.example .env
   ```

2. **Fill in required values**
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/virtual-learning-environment

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Client URL (for CORS)
   CLIENT_URL=http://localhost:3000

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d

   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info
   ```

### MongoDB Setup

#### Using MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create an account and cluster
3. Get connection string
4. Replace in `.env` file

#### Using Local MongoDB
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb-org

# Start MongoDB
mongod
```

### Cloudinary Setup (for file uploads)

1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Get your API credentials from dashboard
4. Add to `.env` file

---

## 🏃 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Mode
```bash
npm start
```

### Verify Server is Running
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## 📚 API Documentation

### Access Documentation

1. **HTML Format** (Interactive)
   ```
   http://localhost:5000/api-docs/html
   ```

2. **JSON Format**
   ```
   http://localhost:5000/api-docs
   ```

3. **Health Check**
   ```
   http://localhost:5000/health
   ```

### Sample API Requests

#### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "student"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

#### Get All Courses
```bash
curl -X GET http://localhost:5000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 👨‍💻 Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files (DB, Socket.io, Cloudinary)
│   ├── controllers/      # Business logic
│   ├── middleware/       # Express middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── package.json         # Dependencies
└── README.md           # This file
```

### Adding New Endpoints

1. **Create a controller** in `src/controllers/newController.js`
   ```javascript
   const asyncHandler = require('../middleware/asyncHandler');

   exports.getAll = asyncHandler(async (req, res) => {
     // Your logic here
     res.json({ success: true, data: [] });
   });
   ```

2. **Create a route** in `src/routes/new.js`
   ```javascript
   const express = require('express');
   const { protect } = require('../middleware/auth');
   const { getAll } = require('../controllers/newController');

   const router = express.Router();
   router.get('/', protect, getAll);

   module.exports = router;
   ```

3. **Mount the route** in `server.js`
   ```javascript
   app.use('/api/v1/new', require('./routes/new'));
   app.use('/api/new', require('./routes/new')); // Backward compatibility
   ```

### Code Style

- Use ES6+ syntax
- Follow existing code patterns
- Add JSDoc comments for functions
- Use meaningful variable names

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Write Tests

Create test file in `src/__tests__/controllers/newController.test.js`:

```javascript
const { getAll } = require('../../controllers/newController');
const testHelpers = require('../../utils/testHelpers');

describe('New Controller', () => {
  test('should get all items', async () => {
    const req = testHelpers.createMockRequest();
    const res = testHelpers.createMockResponse();

    await getAll(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
# macOS/Linux
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
mongod  # or use MongoDB Atlas cloud connection
```

### JWT Secret Error
```
Error: JWT_SECRET is not defined
```
**Solution:** Add `JWT_SECRET` to `.env` file

### Cloudinary Upload Error
```
Error: Cloudinary credentials are invalid
```
**Solution:** Verify your Cloudinary credentials in `.env` file

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Ensure `CLIENT_URL` in `.env` matches your frontend URL

### Rate Limit Error
```
Too many requests from this IP, please try again later
```
**Solution:** Wait 15 minutes or adjust `RATE_LIMIT_WINDOW_MS` in `.env`

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` file to repository
- ✅ Use strong JWT_SECRET (at least 32 characters)
- ✅ Use HTTPS in production
- ✅ Rotate secrets regularly

### Authentication
- ✅ Always validate JWT tokens
- ✅ Use `@protect` middleware on protected routes
- ✅ Hash passwords with bcryptjs
- ✅ Implement rate limiting

### Data Validation
- ✅ Use Joi schemas for input validation
- ✅ Sanitize MongoDB queries
- ✅ Validate file uploads
- ✅ Check file types and sizes

### Headers & Security
- ✅ Helmet.js sets security headers
- ✅ Enable CORS properly (restrict origins)
- ✅ Use express-mongo-sanitize to prevent NoSQL injection
- ✅ Implement CSRF protection in production

### Logging
- ✅ Log all important operations
- ✅ Never log passwords or sensitive data
- ✅ Monitor logs regularly
- ✅ Archive old logs

### Deployment
- ✅ Use environment-specific configurations
- ✅ Enable HTTPS
- ✅ Use reverse proxy (Nginx)
- ✅ Implement backup strategy
- ✅ Monitor server performance

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review API documentation at `/api-docs/html`
3. Check log files in `backend/logs/`
4. Open an issue on GitHub

---

## 📄 License

ISC

---

**Last Updated:** January 2024
**Backend Version:** 1.0.0
