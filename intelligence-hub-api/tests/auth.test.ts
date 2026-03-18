import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { cleanDatabase } from './setup';

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test@horse.io');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password456', name: 'Other User' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@horse.io', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@horse.io', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@horse.io');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
