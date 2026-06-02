const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../src/server');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Quiz = require('../src/models/Quiz');
const Question = require('../src/models/Question');
const { factories, generateTestToken } = require('../src/utils/testHelpers');

describe('Question Access Control', () => {
  let teacherToken;
  let studentToken;
  let teacherId;
  let studentId;
  let courseId;
  let publishedQuizId;
  let unpublishedQuizId;

  beforeAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    await Question.deleteMany();

    // Create teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherId = teacher._id;
    teacherToken = generateTestToken(teacherId, 'teacher');

    // Create student
    const student = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      role: 'student'
    });
    studentId = student._id;
    studentToken = generateTestToken(studentId, 'student');

    // Create course
    const course = await Course.create(factories.course({ teacher: teacherId }));
    courseId = course._id;

    // Create published quiz
    const publishedQuiz = await Quiz.create({
      ...factories.quiz({ title: 'Published Quiz' }),
      course: courseId,
      isPublished: true
    });
    publishedQuizId = publishedQuiz._id;

    // Create unpublished quiz
    const unpublishedQuiz = await Quiz.create({
      ...factories.quiz({ title: 'Unpublished Quiz' }),
      course: courseId,
      isPublished: false
    });
    unpublishedQuizId = unpublishedQuiz._id;

    // Create sample questions for both quizzes
    await Question.create({
      quiz: publishedQuizId,
      text: 'Published question',
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      marks: 10,
      order: 1
    });

    await Question.create({
      quiz: unpublishedQuizId,
      text: 'Unpublished question',
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      marks: 10,
      order: 1
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    await Question.deleteMany();
    await mongoose.connection.close();
    server.close();
  });

  describe('GET /api/quizzes/:id/questions', () => {
    it('should allow student to fetch questions for published quiz', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${publishedQuizId}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].text).toBe('Published question');
    });

    it('should return 403 when student tries to fetch questions for unpublished quiz', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${unpublishedQuizId}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('This quiz has not been published yet');
    });

    it('should allow teacher to fetch questions for unpublished quiz', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${unpublishedQuizId}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].text).toBe('Unpublished question');
    });

    it('should allow teacher to fetch questions for published quiz', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${publishedQuizId}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 404 for non-existent quiz', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/quizzes/${fakeId}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Quiz not found');
    });
  });
});
