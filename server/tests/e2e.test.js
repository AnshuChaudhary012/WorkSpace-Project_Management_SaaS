const { test, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

before(() => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.NODE_ENV = 'test';
});

test('Master 10-Step End-to-End SaaS Lifecycle Test', async () => {
  // Step 1: Register User A
  const regResA = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User A',
      email: 'user_a_master@example.com',
      password: 'password123'
    });
  assert.strictEqual(regResA.statusCode, 201);
  const userAId = regResA.body.data.user.id;

  // Step 2: Log in as User A
  const loginResA = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user_a_master@example.com',
      password: 'password123'
    });
  assert.strictEqual(loginResA.statusCode, 200);
  const tokenA = loginResA.body.data.token;
  assert.ok(tokenA, 'User A token must exist');

  // Step 3: Create a workspace and project as User A
  const wsRes = await request(app)
    .post('/api/workspaces')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      name: 'Alpha Engineering Workspace',
      description: 'Primary product development workspace'
    });
  assert.strictEqual(wsRes.statusCode, 201);
  const workspaceId = wsRes.body.data.id;
  assert.strictEqual(wsRes.body.data.role, 'owner');

  const projRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/projects`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      name: 'Cloud Core Platform',
      description: 'Next-gen SaaS backend'
    });
  assert.strictEqual(projRes.statusCode, 201);
  const projectId = projRes.body.data.id;

  // Step 4: Register User C and invite to workspace, then assign a task to User C
  const regResC = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User C Teammate',
      email: 'user_c_team@example.com',
      password: 'password123'
    });
  assert.strictEqual(regResC.statusCode, 201);
  const userCId = regResC.body.data.user.id;

  // Invite User C to Workspace
  const inviteRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/members`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      email: 'user_c_team@example.com',
      role: 'member'
    });
  assert.strictEqual(inviteRes.statusCode, 201);
  assert.strictEqual(inviteRes.body.data.role, 'member');

  // Create Task assigned to User C
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const taskRes = await request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      title: 'Implement Multi-tenant RBAC',
      description: 'Ensure cross-tenant isolation and role checks',
      priority: 'high',
      status: 'todo',
      assignee: userCId,
      dueDate: tomorrow
    });
  assert.strictEqual(taskRes.statusCode, 201);
  const taskId = taskRes.body.data.id;
  assert.strictEqual(taskRes.body.data.title, 'Implement Multi-tenant RBAC');

  // Step 5: Update its status and due date
  const nextWeek = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const updateTaskRes = await request(app)
    .patch(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      status: 'in_progress',
      dueDate: nextWeek,
      priority: 'urgent'
    });
  assert.strictEqual(updateTaskRes.statusCode, 200);
  assert.strictEqual(updateTaskRes.body.data.status, 'in_progress');
  assert.strictEqual(updateTaskRes.body.data.priority, 'urgent');

  // Step 6: Add a comment to the task
  const commentRes = await request(app)
    .post(`/api/tasks/${taskId}/comments`)
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      content: 'Code review in progress. Schema migrations completed.'
    });
  assert.strictEqual(commentRes.statusCode, 201);
  assert.strictEqual(commentRes.body.data.content, 'Code review in progress. Schema migrations completed.');

  // Step 7: Verify that dashboard counts update
  const dashRes = await request(app)
    .get(`/api/workspaces/${workspaceId}/dashboard`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert.strictEqual(dashRes.statusCode, 200);
  assert.strictEqual(dashRes.body.data.totalTasks, 1);
  assert.strictEqual(dashRes.body.data.statusCounts.in_progress, 1);
  assert.strictEqual(dashRes.body.data.statusCounts.todo, 0);
  assert.strictEqual(dashRes.body.data.totalMembers, 2); // User A (owner) + User C (member)
  assert.strictEqual(dashRes.body.data.upcomingTasks.length, 1); // Due in next 3 days

  // Step 8: Log out and log back in as User A
  const logoutRes = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.strictEqual(logoutRes.statusCode, 200);

  const reLoginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user_a_master@example.com',
      password: 'password123'
    });
  assert.strictEqual(reLoginRes.statusCode, 200);
  const freshTokenA = reLoginRes.body.data.token;

  // Step 9: Verify that authorized data persists
  const sessionMe = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${freshTokenA}`);
  assert.strictEqual(sessionMe.statusCode, 200);
  assert.strictEqual(sessionMe.body.data.user.email, 'user_a_master@example.com');

  const reFetchTask = await request(app)
    .get(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${freshTokenA}`);
  assert.strictEqual(reFetchTask.statusCode, 200);
  assert.strictEqual(reFetchTask.body.data.status, 'in_progress');

  // Step 10: Attempt to access workspace as User B without membership and verify access is denied (403)
  const regResB = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User B Hacker',
      email: 'user_b_unauth@example.com',
      password: 'password123'
    });
  const tokenB = regResB.body.data.token;

  const deniedWsRes = await request(app)
    .get(`/api/workspaces/${workspaceId}`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert.strictEqual(deniedWsRes.statusCode, 403);
  assert.strictEqual(deniedWsRes.body.success, false);

  const deniedTaskRes = await request(app)
    .get(`/api/tasks/${taskId}`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert.strictEqual(deniedTaskRes.statusCode, 403);
  assert.strictEqual(deniedTaskRes.body.success, false);
});
