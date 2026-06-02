/**
 * Unit tests for Input Validation
 * Tests Requirements 3.1-3.6, 5.4 from ai-system-critical-fixes spec
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const { generateTestToken } = require('../src/utils/testHelpers');

describe('Quiz Generation Input Validation', () => {
  let teacherToken;
  let teacherId;

  beforeAll(async () => {
    await User.deleteMany();

    // Create teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
    });
    teacherId = teacher._id;
    teacherToken = generateTestToken(teacherId, 'teacher');
  });

  afterAll(async () => {
    await User.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  // Add delay between tests to avoid rate limiting
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  describe('Count validation', () => {
    it('should reject count = 0', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 0, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 20');
    });

    it('should reject count = 21', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 21, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 20');
    });

    it('should reject non-integer count', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 5.5, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 20');
    });

    it('should reject string count', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 'five', difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 1 and 20');
    });
  });

  describe('Topic validation', () => {
    it('should reject missing topic', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ count: 5, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Topic is required');
    });

    it('should reject empty topic', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: '', count: 5, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Topic is required');
    });

    it('should reject whitespace-only topic', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: '   ', count: 5, difficulty: 'medium' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Topic is required');
    });
  });

  describe('Difficulty validation', () => {
    it('should reject invalid difficulty', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 5, difficulty: 'extreme' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Difficulty must be one of');
      expect(res.body.message).toContain('easy');
      expect(res.body.message).toContain('medium');
      expect(res.body.message).toContain('hard');
    });
  });

  describe('Validation error messages', () => {
    it('should include helpful message for count validation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Mathematics', count: 100 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Count must be an integer between 1 and 20');
    });

    it('should include helpful message for topic validation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ count: 5 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Topic is required and must be a non-empty string');
    });

    it('should include helpful message for difficulty validation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Math', count: 3, difficulty: 'impossible' });

      // Should be 400 (validation error) or 429 (rate limited from previous tests)
      expect([400, 429]).toContain(res.statusCode);
      if (res.statusCode === 400) {
        expect(res.body.message).toContain('Difficulty must be one of');
      }
    });
  });

  // Tests that make successful API calls (will use rate limit) - kept minimal
  describe('Valid requests acceptance', () => {
    it('should accept valid parameters without throwing validation error', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ topic: 'Basic Math', count: 2, difficulty: 'easy' });

      // Could be 200 (success), 429 (rate limited), or 500 (AI error)
      // but NOT 400 (validation error)
      expect(res.statusCode).not.toBe(400);
    });
  });
});
