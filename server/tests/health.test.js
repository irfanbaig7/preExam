process.env.NODE_ENV = 'test';
const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();

test('health endpoint responds', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

test('protected routes reject anonymous requests', async () => {
  const res = await request(app).get('/api/subjects');
  expect(res.status).toBe(401);
});

test('register validates input before touching the database', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'nope', password: '123' });
  expect(res.status).toBe(400);
  expect(res.body.details).toBeDefined();
});

test('unknown route gives 404 json', async () => {
  const res = await request(app).get('/api/nothing-here');
  expect(res.status).toBe(404);
});
