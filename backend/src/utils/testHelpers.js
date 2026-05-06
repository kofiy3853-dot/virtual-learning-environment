// Test Helpers Utility
// Factory functions and utilities for Jest testing

const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const jwt = require('jsonwebtoken');

// Mock request, response, next
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

const createMockResponse = () => {
  const res = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

const createMockNext = () => jest.fn();

// Generate test JWT token
const generateTestToken = (userId, role = 'student') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
};

// Factory functions for test data
const factories = {
  user: (overrides = {}) => ({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'testPassword123',
    role: 'student',
    ...overrides,
  }),

  course: (overrides = {}) => ({
    title: 'Test Course',
    description: 'A test course for unit tests',
    code: `TEST-${Date.now()}`,
    semester: 'Semester 1',
    academicYear: '2026/2027',
    status: 'active',
    ...overrides,
  }),

  assignment: (overrides = {}) => ({
    title: 'Test Assignment',
    description: 'A test assignment for unit tests',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    totalMarks: 100,
    ...overrides,
  }),

  quiz: (overrides = {}) => ({
    title: 'Test Quiz',
    description: 'A test quiz for unit tests',
    duration: 60,
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    totalMarks: 100,
    ...overrides,
  }),
};

module.exports = {
  createMockRequest,
  createMockResponse,
  createMockNext,
  generateTestToken,
  factories,
};
