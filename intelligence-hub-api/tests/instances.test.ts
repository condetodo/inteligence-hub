import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { cleanDatabase } from './setup';

let token: string;

async function createAuthUser() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });
  return res.body.token;
}

describe('Instances API', () => {
  beforeEach(async () => {
    await cleanDatabase();
    token = await createAuthUser();
  });

  describe('POST /api/instances', () => {
    it('should create a new instance with brand voice', async () => {
      const res = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Francisco P.',
          clientName: 'Francisco Perez',
          clientRole: 'Cofounder',
          company: 'Horse Consulting',
          industry: 'Technology Consulting',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Francisco P.');
      expect(res.body.brandVoice).toBeDefined();
    });
  });

  describe('GET /api/instances', () => {
    it('should list only instances assigned to the user', async () => {
      await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .get('/api/instances')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Client 1');
    });
  });

  describe('GET /api/instances/:id', () => {
    it('should return instance detail', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .get(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.clientName).toBe('Client One');
      expect(res.body.brandVoice).toBeDefined();
    });
  });

  describe('PUT /api/instances/:id', () => {
    it('should update an instance', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .put(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/instances/:id', () => {
    it('should archive an instance', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .delete(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ARCHIVED');
    });
  });
});
