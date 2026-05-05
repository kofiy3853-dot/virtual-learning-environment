const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const { factories, generateTestToken } = require('../src/utils/testHelpers');

describe('Course Endpoints', () => {
  let teacherToken;
  let teacherId;

  beforeAll(async () => {
    // Clear users and courses
    await User.deleteMany();
    await Course.deleteMany();

    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherId = teacher._id;
    teacherToken = generateTestToken(teacherId, 'teacher');
  });

  afterAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/courses', () => {
    it('should create a new course when authorized', async () => {
      const courseData = factories.course();
      
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(courseData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toEqual(courseData.title);
    });

    it('should fail if unauthorized role (student)', async () => {
      const student = await User.create({
        name: 'Student User',
        email: 'student@example.com',
        password: 'password123',
        role: 'student'
      });
      const studentToken = generateTestToken(student._id, 'student');
      const courseData = factories.course();

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(courseData);

      expect(res.statusCode).toEqual(403);
    });

    it('should fail with invalid data (Joi validation)', async () => {
      const invalidData = {
        title: 'Hi', // Too short
        code: 'C' // Too short
      };

      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Validation error');
    });
  });

  describe('GET /api/courses', () => {
    it('should fetch all courses', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
