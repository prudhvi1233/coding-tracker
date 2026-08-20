import request from 'supertest';
import app from '../src/app';
import { connect, closeDatabase, clearDatabase } from './setup';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Authorization & Data Isolation', () => {
  it('should prevent User A from accessing User B data', async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'usera@example.com',
      password: 'password123',
      displayName: 'User A'
    });
    const tokenA = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'userb@example.com',
      password: 'password123',
      displayName: 'User B'
    });
    const tokenB = resB.body.token;

    // User A generates an activity
    await request(app)
      .post('/api/activity')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        fileName: 'test.ts',
        language: 'typescript',
        projectName: 'project-a',
        totalLines: 100,
        timestamp: new Date().toISOString()
      });

    // User A should see it
    const historyA = await request(app)
      .get('/api/activity/history')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(historyA.body.length).toBeGreaterThan(0);

    // User B should NOT see it
    const historyB = await request(app)
      .get('/api/activity/history')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(historyB.body.length).toEqual(0);
  });
});
