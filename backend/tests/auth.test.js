const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const { factories } = require('../src/utils/testHelpers');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Ensure we are connected to a test database if possible
    // Mongoose connection is already handled in server.js but we might want to override for tests
  });

  afterAll(async () => {
    await User.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = factories.user();
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toBeDefined();
    });

    it('should fail registration with invalid data (Joi validation)', async () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'not-an-email',
        password: '123' // Too short
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const password = 'password123';
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: password,
        role: 'student'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail login with wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
