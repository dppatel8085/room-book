const express = require('express');
const cors = require('cors');
const { seedDatabase } = require('./config/database');
const { getRooms, getBookings, createBooking, cancelBooking, getAvailability } = require('./controllers/bookingController');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/rooms', getRooms);
app.get('/api/bookings', getBookings);
app.post('/api/bookings', createBooking);
app.delete('/api/bookings/:id', cancelBooking);
app.get('/api/availability', getAvailability);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.isAppError ? err.statusCode : 500);
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';
  const details = err.details || {};

  res.status(statusCode).json({
    error: {
      code,
      message,
      details
    }
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(console.error);
}

module.exports = app;