const request = require('supertest');
const app = require('../src/app');
const { pool, seedDatabase } = require('../src/config/database');

beforeAll(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('API Integration Tests', () => {
  test('GET /api/rooms returns seed rooms', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });

  test('POST /api/bookings creates booking and handles 409 conflict', async () => {
    const payload = {
      roomId: 1,
      title: 'API Test',
      organizerEmail: 'test@example.com',
      attendees: 2,
      start: '2031-06-01T10:00:00Z',
      end: '2031-06-01T11:00:00Z'
    };

    const createRes = await request(app).post('/api/bookings').send(payload);
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();

    // Duplicate conflicting request
    const conflictRes = await request(app).post('/api/bookings').send(payload);
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('BOOKING_CONFLICT');
  });
});