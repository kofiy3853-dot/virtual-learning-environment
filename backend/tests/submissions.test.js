const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');
const { factories, generateTestToken } = require('../src/utils/testHelpers');

describe('Submission Endpoints', () => {
  let teacherToken;
  let studentToken;
  let assignmentId;
  let submissionId;

  beforeAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Assignment.deleteMany();
    await Submission.deleteMany();

    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherToken = generateTestToken(teacher._id, 'teacher');

    const student = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      role: 'student'
    });
    studentToken = generateTestToken(student._id, 'student');

    const course = await Course.create(factories.course({ teacher: teacher._id }));
    const assignment = await Assignment.create(factories.assignment({ course: course._id }));
    assignmentId = assignment._id;
  });

  afterAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Assignment.deleteMany();
    await Submission.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/assignments/:id/submit', () => {
    it('should allow a student to submit an assignment', async () => {
      const res = await request(app)
        .post(`/api/assignments/${assignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ textContent: 'My assignment submission' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      submissionId = res.body.data._id;
    });
  });

  describe('PATCH /api/submissions/:id/grade', () => {
    it('should allow a teacher to grade a submission', async () => {
      const gradeData = { grade: 85, feedback: 'Great job!' };

      const res = await request(app)
        .patch(`/api/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(gradeData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.grade).toEqual(85);
    });

    it('should fail if grade is negative', async () => {
      const res = await request(app)
        .patch(`/api/submissions/${submissionId}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ grade: -1 });

      expect(res.statusCode).toEqual(400);
    });
  });
});
