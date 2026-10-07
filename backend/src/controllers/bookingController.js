const bookingService = require('../services/bookingService');

const getRooms = async (req, res, next) => {
  try {
    const rooms = await bookingService.getRooms();
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const { date, roomId } = req.query;
    const bookings = await bookingService.getBookings(date, roomId);
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    await bookingService.cancelBooking(req.params.id);
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const rooms = await bookingService.getAvailableRooms(req.query);
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRooms, getBookings, createBooking, cancelBooking, getAvailability };