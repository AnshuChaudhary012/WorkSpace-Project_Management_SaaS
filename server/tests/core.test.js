const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { devUserStore } = require('../src/controllers/authController');
const { devWorkspaceStore } = require('../src/controllers/workspaceController');
const { devMembershipStore } = require('../src/middleware/rbacMiddleware');
const { devProjectStore } = require('../src/controllers/projectController');
const { devTaskStore } = require('../src/controllers/taskController');

let userAToken;
let userBToken;
let userAId;
let userBId;

before(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.NODE_ENV = 'test';
});

beforeEach(async () => {
  devUserStore.length = 0;
  devWorkspaceStore.length = 0;
  devMembershipStore.length = 0;
  devProjectStore.length = 0;
  devTaskStore.length = 0;

  // Register User A
  const resA = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User A', email: 'usera@example.com', password: 'password123' });
  userAToken = resA.body.data.token;
  userAId = resA.body.data.user.id;

  // Register User B
  const resB = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User B', email: 'userb@example.com', password: 'password123' });
  userBToken = resB.body.data.token;
  userBId = resB.body.data.user.id;
});

test('Workspace CRUD: User A can create and list workspaces', async () => {
  const createRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'Acme Corp', description: 'Acme SaaS workspace' });

  assert.strictEqual(createRes.statusCode, 201);
  assert.strictEqual(createRes.body.success, true);
  assert.strictEqual(createRes.body.data.name, 'Acme Corp');
  assert.strictEqual(createRes.body.data.role, 'owner');

  const listRes = await request(app)
    .get('/api/workspaces')
    .set('Authorization', `Bearer ${userAToken}`);

  assert.strictEqual(listRes.statusCode, 200);
  assert.strictEqual(listRes.body.data.length, 1);
  assert.strictEqual(listRes.body.data[0].name, 'Acme Corp');
});

test('Cross-Tenant Security: User B cannot access User A workspace', async () => {
  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'Secret Workspace' });
  const workspaceId = wsRes.body.data.id;

  const forbiddenRes = await request(app)
    .get(`/api/workspaces/${workspaceId}`)
    .set('Authorization', `Bearer ${userBToken}`);

  assert.strictEqual(forbiddenRes.statusCode, 403);
  assert.strictEqual(forbiddenRes.body.success, false);
});

test('Project CRUD: Member can create project and view progress', async () => {
  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'Product Engineering' });
  const workspaceId = wsRes.body.data.id;

  const projRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'Mobile App Redesign', description: 'React Native app overhaul' });

  assert.strictEqual(projRes.statusCode, 201);
  assert.strictEqual(projRes.body.data.name, 'Mobile App Redesign');

  const listRes = await request(app)
    .get(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${userAToken}`);

  assert.strictEqual(listRes.statusCode, 200);
  assert.strictEqual(listRes.body.data.length, 1);
  assert.strictEqual(listRes.body.data[0].taskCount, 0);
  assert.strictEqual(listRes.body.data[0].progress, 0);
});

test('Task CRUD: Create, update status, and fetch tasks for project', async () => {
  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'SaaS Platform' });
  const workspaceId = wsRes.body.data.id;

  const projRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ name: 'Core Engine' });
  const projectId = projRes.body.data.id;

  // Create Task
  const taskRes = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${userAToken}`)
    .send({
      title: 'Implement OAuth Login',
      description: 'Support Google and GitHub OAuth',
      priority: 'high',
      status: 'todo'
    });

  assert.strictEqual(taskRes.statusCode, 201);
  assert.strictEqual(taskRes.body.data.title, 'Implement OAuth Login');
  assert.strictEqual(taskRes.body.data.status, 'todo');
  assert.strictEqual(taskRes.body.data.priority, 'high');
  const taskId = taskRes.body.data.id;

  // Update Task Status to 'done'
  const patchRes = await request(app)
    .patch(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${userAToken}`)
    .send({ status: 'done', priority: 'urgent' });

  assert.strictEqual(patchRes.statusCode, 200);
  assert.strictEqual(patchRes.body.data.status, 'done');
  assert.strictEqual(patchRes.body.data.priority, 'urgent');

  // Verify Project Progress calculation updated
  const projListRes = await request(app)
    .get(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${userAToken}`);

  assert.strictEqual(projListRes.body.data[0].taskCount, 1);
  assert.strictEqual(projListRes.body.data[0].completedTaskCount, 1);
  assert.strictEqual(projListRes.body.data[0].progress, 100);
});
