const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/User');

// In-memory test store simulating User collection for isolated, binary-free testing
let testUsers = [];

before(() => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.NODE_ENV = 'test';

  // Stub User model methods for fast, deterministic unit & API integration testing
  User.findOne = (query) => {
    const exec = async () => {
      if (query.email) {
        const found = testUsers.find((u) => u.email === query.email.toLowerCase());
        if (!found) return null;
        return {
          ...found,
          matchPassword: async (pwd) => bcrypt.compare(pwd, found.passwordHash),
          toJSON: () => {
            const { passwordHash, ...rest } = found;
            return rest;
          }
        };
      }
      return null;
    };

    return {
      select: () => ({
        then: (resolve, reject) => exec().then(resolve, reject),
        exec
      }),
      then: (resolve, reject) => exec().then(resolve, reject),
      exec
    };
  };

  User.findById = async (id) => {
    const found = testUsers.find((u) => u.id === id);
    if (!found) return null;
    return {
      ...found,
      toJSON: () => {
        const { passwordHash, ...rest } = found;
        return rest;
      }
    };
  };

  User.create = async ({ name, email, passwordHash }) => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordHash, salt);
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email: email.toLowerCase(),
      passwordHash: hashed,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    testUsers.push(newUser);
    return {
      ...newUser,
      toJSON: () => {
        const { passwordHash, ...rest } = newUser;
        return rest;
      }
    };
  };
});

beforeEach(() => {
  testUsers = [];
});

test('POST /api/auth/register should successfully register a new user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123'
    });

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.name, 'Alice Johnson');
  assert.strictEqual(res.body.data.user.email, 'alice@example.com');
  assert.strictEqual(res.body.data.user.passwordHash, undefined);
  assert.ok(res.body.data.token, 'Token should be returned');
});

test('POST /api/auth/register should reject duplicate email with 409', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123'
    });

  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Alice Copycat',
      email: 'alice@example.com',
      password: 'differentpassword'
    });

  assert.strictEqual(res.statusCode, 409);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/register should reject invalid inputs with 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'A',
      email: 'not-an-email',
      password: '123'
    });

  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.errors.length >= 3);
});

test('POST /api/auth/login should authenticate user with valid credentials', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'securepassword123'
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'bob@example.com',
      password: 'securepassword123'
    });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.strictEqual(res.body.data.user.email, 'bob@example.com');
});

test('POST /api/auth/login should reject incorrect password with 401', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'securepassword123'
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'bob@example.com',
      password: 'wrongpassword'
    });

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/auth/me should return current user profile with valid token', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'password123'
    });

  const token = regRes.body.data.token;

  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.name, 'Charlie Brown');
  assert.strictEqual(res.body.data.user.email, 'charlie@example.com');
});

test('GET /api/auth/me should reject requests without token with 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
});
