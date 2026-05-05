const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Quiz = require('../src/models/Quiz');
const { factories, generateTestToken } = require('../src/utils/testHelpers');

describe('Quiz Endpoints', () => {
  let teacherToken;
  let teacherId;
  let courseId;

  beforeAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();

    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherId = teacher._id;
    teacherToken = generateTestToken(teacherId, 'teacher');

    const course = await Course.create(factories.course({ teacher: teacherId }));
    courseId = course._id;
  });

  afterAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/courses/:id/quizzes', () => {
    it('should create a quiz within a course', async () => {
      const quizData = factories.quiz();
      
      const res = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(quizData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toEqual(quizData.title);
    });

    it('should fail with invalid duration (Joi validation)', async () => {
      const invalidData = factories.quiz({ duration: -1 });

      const res = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Validation error');
    });

    it('should fail if endTime is before startTime', async () => {
      const invalidData = factories.quiz({
        startTime: new Date(Date.now() + 10000),
        endTime: new Date(Date.now() - 10000)
      });

      const res = await request(app)
        .post(`/api/courses/${courseId}/quizzes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Validation error');
    });
  });
});
