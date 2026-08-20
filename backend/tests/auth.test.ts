import request from 'supertest';
import app from '../src/app';
import { connect, closeDatabase, clearDatabase } from './setup';
import User from '../src/models/User';

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      });
      
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User 2'
    });
    
    expect(res.statusCode).toEqual(400);
  });

  it('should login successfully', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
