const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Assignment = require('../src/models/Assignment');
const { factories, generateTestToken } = require('../src/utils/testHelpers');

describe('Assignment Endpoints', () => {
  let teacherToken;
  let teacherId;
  let courseId;

  beforeAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Assignment.deleteMany();

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
    await Assignment.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/courses/:id/assignments', () => {
    it('should create an assignment within a course', async () => {
      const assignmentData = factories.assignment();
      
      const res = await request(app)
        .post(`/api/courses/${courseId}/assignments`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(assignmentData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toEqual(assignmentData.title);
    });

    it('should fail with invalid marks (Joi validation)', async () => {
      const invalidData = factories.assignment({ totalMarks: -5 });

      const res = await request(app)
        .post(`/api/courses/${courseId}/assignments`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Validation error');
    });
  });
});
