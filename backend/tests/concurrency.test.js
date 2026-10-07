const request = require('supertest');
const app = require('../src/app');
const { pool, seedDatabase } = require('../src/config/database');

beforeAll(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('Concurrency Test', () => {
  test('Simultaneous overlapping booking requests result in exactly 1 success and 1 conflict', async () => {
    const payload1 = {
      roomId: 2,
      title: 'Race Condition 1',
      organizerEmail: 'user1@example.com',
      attendees: 2,
      start: '2032-07-10T14:00:00Z',
      end: '2032-07-10T15:00:00Z'
    };

    const payload2 = {
      roomId: 2,
      title: 'Race Condition 2',
      organizerEmail: 'user2@example.com',
      attendees: 3,
      start: '2032-07-10T14:30:00Z',
      end: '2032-07-10T15:30:00Z'
    };

    // Fire requests concurrently
    const [res1, res2] = await Promise.all([
      request(app).post('/api/bookings').send(payload1),
      request(app).post('/api/bookings').send(payload2)
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});