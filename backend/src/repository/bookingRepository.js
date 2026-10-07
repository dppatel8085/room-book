const { pool } = require('../config/database');

class BookingRepository {
  async getAllRooms() {
    const res = await pool.query('SELECT id, name, capacity, floor, amenities FROM rooms ORDER BY id ASC');
    return res.rows;
  }

  async getRoomById(roomId, client = pool) {
    const res = await client.query('SELECT id, name, capacity, floor, amenities FROM rooms WHERE id = $1', [roomId]);
    return res.rows[0] || null;
  }

  async getBookingsByDay(dateStr, roomId = null) {
    let query = `
      SELECT b.id, b.room_id as "roomId", b.title, b.organizer_email as "organizerEmail", 
             b.attendees, b.start_time as "start", b.end_time as "end", b.status, b.created_at as "createdAt"
      FROM bookings b
      WHERE b.start_time::date = $1::date AND b.status = 'confirmed'
    `;
    const params = [dateStr];

    if (roomId) {
      query += ` AND b.room_id = $2`;
      params.push(roomId);
    }
    query += ` ORDER BY b.start_time ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  }

  async countOrganizerBookingsForDay(email, dateStr, client = pool) {
    const res = await client.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE organizer_email = $1 
         AND start_time::date = $2::date 
         AND status = 'confirmed'`,
      [email, dateStr]
    );
    return parseInt(res.rows[0].count, 10);
  }

  async createBookingWithTransaction(bookingData, validationFn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Lock table in EXCLUSIVE mode to ensure concurrent operations do not create race conditions
      await client.query('LOCK TABLE bookings IN EXCLUSIVE MODE');

      const room = await this.getRoomById(bookingData.roomId, client);
      if (!room) {
        throw { isAppError: true, code: 'ROOM_NOT_FOUND', message: 'Room not found.', statusCode: 404 };
      }

      const dateStr = bookingData.start.substring(0, 10);

      const existingRes = await client.query(
        `SELECT id, start_time, end_time, status FROM bookings 
         WHERE room_id = $1 AND start_time::date = $2::date AND status = 'confirmed'`,
        [bookingData.roomId, dateStr]
      );

      const organizerCount = await this.countOrganizerBookingsForDay(bookingData.organizerEmail, dateStr, client);

      // Run pure business validation logic
      validationFn({
        room,
        ...bookingData,
        existingBookingsForDay: existingRes.rows,
        organizerBookingsCountForDay: organizerCount
      });

      const insertRes = await client.query(
        `INSERT INTO bookings (room_id, title, organizer_email, attendees, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
         RETURNING id, room_id as "roomId", title, organizer_email as "organizerEmail", attendees, start_time as "start", end_time as "end", status, created_at as "createdAt"`,
        [
          bookingData.roomId,
          bookingData.title.trim(),
          bookingData.organizerEmail,
          bookingData.attendees,
          bookingData.start,
          bookingData.end
        ]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getBookingById(id) {
    const res = await pool.query(
      `SELECT id, room_id as "roomId", title, organizer_email as "organizerEmail", attendees, start_time as "start", end_time as "end", status 
       FROM bookings WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async cancelBooking(id, now = new Date()) {
    const booking = await this.getBookingById(id);
    if (!booking) {
      throw { isAppError: true, code: 'BOOKING_NOT_FOUND', message: 'Booking not found.', statusCode: 404 };
    }

    // R8: Already cancelled is a no-op that returns success
    if (booking.status === 'cancelled') {
      return booking;
    }

    // R8: A booking that has already started cannot be cancelled
    if (new Date(booking.start) <= now) {
      throw { isAppError: true, code: 'RULE_R8', message: 'A booking that has already started cannot be cancelled.', statusCode: 409 };
    }

    const res = await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING id, status`,
      [id]
    );
    return res.rows[0];
  }

  async findAvailableRooms(dateStr, startIso, endIso, minCapacity) {
    const query = `
      SELECT r.id, r.name, r.capacity, r.floor, r.amenities
      FROM rooms r
      WHERE r.capacity >= $1
        AND r.id NOT IN (
          SELECT b.room_id 
          FROM bookings b
          WHERE b.status = 'confirmed'
            AND b.start_time::date = $2::date
            AND (b.start_time < $4::timestamptz AND b.end_time > $3::timestamptz)
        )
      ORDER BY r.capacity ASC, r.name ASC
    `;
    const res = await pool.query(query, [minCapacity, dateStr, startIso, endIso]);
    return res.rows;
  }
}

module.exports = new BookingRepository();