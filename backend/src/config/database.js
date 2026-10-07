const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
 connectionString: String(process.env.DATABASE_URL),
});

const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        capacity INT NOT NULL,
        floor INT NOT NULL,
        amenities TEXT[] NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        room_id INT REFERENCES rooms(id),
        title VARCHAR(100) NOT NULL,
        organizer_email VARCHAR(255) NOT NULL,
        attendees INT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const roomsCount = await client.query('SELECT COUNT(*) FROM rooms');
    if (parseInt(roomsCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO rooms (id, name, capacity, floor, amenities) VALUES
        (1, 'Atlas', 4, 1, ARRAY['monitor']),
        (2, 'Borealis', 8, 1, ARRAY['projector', 'whiteboard']),
        (3, 'Cascade', 12, 2, ARRAY['projector', 'video-conferencing']),
        (4, 'Delta', 20, 3, ARRAY['projector', 'video-conferencing', 'whiteboard']),
        (5, 'Ember', 2, 2, ARRAY[]::text[]);
      `);
      await client.query(`SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));`);
      console.log("Rooms seed data inserted!");
    } else {
      console.log("Rooms already seeded.");
    }
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Database setup complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

module.exports = { pool, seedDatabase };