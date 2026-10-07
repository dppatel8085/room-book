const bookingRepo = require('../repository/bookingRepository');
const { validateBookingRules } = require('../utils/rules');
const AppError = require('../errors/AppError');

class BookingService {
  async getRooms() {
    return await bookingRepo.getAllRooms();
  }

  async getBookings(dateStr, roomId) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new AppError('INVALID_DATE', 'Query parameter "date" must be in YYYY-MM-DD format.', 400);
    }
    return await bookingRepo.getBookingsByDay(dateStr, roomId);
  }

  async createBooking(bookingData) {
    return await bookingRepo.createBookingWithTransaction(bookingData, validateBookingRules);
  }

  async cancelBooking(id) {
    return await bookingRepo.cancelBooking(id);
  }

  async getAvailableRooms({ date, start, end, minCapacity }) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError('INVALID_DATE', 'Query parameter "date" (YYYY-MM-DD) is required.', 400);
    }
    if (!start || !end) {
      throw new AppError('INVALID_TIME', 'Query parameters "start" and "end" (HH:mm) are required.', 400);
    }

    const startIso = `${date}T${start}:00Z`;
    const endIso = `${date}T${end}:00Z`;
    const capacityNum = parseInt(minCapacity || '1', 10);

    // Validate times against R1-R4
    const dummyRoom = { capacity: 999, name: 'Dummy' };
    validateBookingRules({
      room: dummyRoom,
      title: 'Valid Title',
      organizerEmail: 'valid@example.com',
      attendees: 1,
      start: startIso,
      end: endIso,
      existingBookingsForDay: [],
      organizerBookingsCountForDay: 0,
      now: new Date('2000-01-01') // Ignore past rule check for simple search
    });

    return await bookingRepo.findAvailableRooms(date, startIso, endIso, capacityNum);
  }
}

module.exports = new BookingService();