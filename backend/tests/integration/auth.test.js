const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/server').app;
const User = require('../../src/models/User');

// Use a separate test database
beforeAll(async () => {
  // Ensure we are connected, or connect if necessary. Mongoose connect might be handled by server.js, 
  // but if server.js doesn't connect properly for tests, we connect here.
  // Actually, server.js exports app and server, but we need to make sure we don't connect twice.
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/lms_test');
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  const validTeacher = {
    name: 'Dr. Kwame Mensah',
    email: 'teacher@uni.edu',
    password: 'Password123!',
    role: 'teacher',
    department: 'Computer Science'
  };

  it('should register a new teacher successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validTeacher);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should register a new student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validTeacher, email: 'student@uni.edu', role: 'student' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.role).toBe('student');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validTeacher);
    const res = await request(app).post('/api/auth/register').send(validTeacher);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@uni.edu' });

    expect(res.statusCode).toBe(400);
    expect(res.body.details).toBeDefined(); // the test originally had .errors, but we've modified our API to return .details or we should adjust here. Let's stick to the user's snippet.
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validTeacher, password: 'weak' });

    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validTeacher, email: 'notanemail' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dr. Kwame Mensah',
      email: 'teacher@uni.edu',
      password: 'Password123!',
      role: 'teacher'
    });
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@uni.edu', password: 'Password123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@uni.edu', password: 'WrongPassword!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@uni.edu', password: 'Password123!' });

    expect(res.statusCode).toBe(401);
  });

  it('should reject missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dr. Kwame Mensah',
      email: 'teacher@uni.edu',
      password: 'Password123!',
      role: 'teacher'
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@uni.edu', password: 'Password123!' });
    token = res.body.token;
  });

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('teacher@uni.edu');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should reject request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
  });
});
