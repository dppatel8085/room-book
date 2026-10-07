const AppError = require('../errors/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingRules({ room, title, organizerEmail, attendees, start, end, existingBookingsForDay, organizerBookingsCountForDay, now = new Date() }) {
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle || trimmedTitle.length > 100) {
    throw new AppError('INVALID_TITLE', 'Title must be between 1 and 100 characters after trimming.', 400);
  }

  if (!organizerEmail || !EMAIL_REGEX.test(organizerEmail)) {
    throw new AppError('INVALID_EMAIL', 'A valid organizer email address is required.', 400);
  }

  if (!Number.isInteger(attendees) || attendees < 1) {
    throw new AppError('INVALID_ATTENDEES', 'Attendees must be an integer of at least 1.', 400);
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new AppError('INVALID_DATE', 'Start and end must be valid ISO 8601 timestamps.', 400);
  }

  // R1: end must be after start
  if (endDate <= startDate) {
    throw new AppError('RULE_R1', 'End time must be after start time.', 400);
  }

  // R2: 15-minute boundaries & 00 seconds
  const is15MinBoundary = (d) => d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0 && d.getUTCMinutes() % 15 === 0;
  if (!is15MinBoundary(startDate) || !is15MinBoundary(endDate)) {
    throw new AppError('RULE_R2', 'Start and end times must fall on 15-minute boundaries (00, 15, 30, 45 mins with 00 secs).', 400);
  }

  // R3: Duration between 15 mins and 4 hours
  const durationMs = endDate.getTime() - startDate.getTime();
  const minMs = 15 * 60 * 1000;
  const maxMs = 4 * 60 * 60 * 1000;
  if (durationMs < minMs || durationMs > maxMs) {
    throw new AppError('RULE_R3', 'Booking duration must be between 15 minutes and 4 hours.', 400);
  }

  // R4: Business hours 08:00 to 20:00 UTC and same UTC day
  const isSameUTCDay = startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
                       startDate.getUTCMonth() === endDate.getUTCMonth() &&
                       startDate.getUTCDate() === endDate.getUTCDate();
  if (!isSameUTCDay) {
    throw new AppError('RULE_R4', 'Booking start and end must be on the same UTC day.', 400);
  }

  const startHour = startDate.getUTCHours();
  const endHour = endDate.getUTCHours();
  const endMins = endDate.getUTCMinutes();

  if (startHour < 8 || (endHour > 20 || (endHour === 20 && endMins > 0))) {
    throw new AppError('RULE_R4', 'Booking must fall entirely within business hours (08:00 to 20:00 UTC).', 400);
  }

  // R5: Cannot start in the past
  if (startDate < now) {
    throw new AppError('RULE_R5', 'Booking cannot start in the past.', 400);
  }

  // R6: Capacity limit
  if (attendees > room.capacity) {
    throw new AppError('RULE_R6', `Attendees count (${attendees}) exceeds room capacity (${room.capacity}).`, 400);
  }

  // R9: Max 3 confirmed bookings per day per organizer
  if (organizerBookingsCountForDay >= 3) {
    throw new AppError('RULE_R9', 'An organizer cannot hold more than 3 confirmed bookings that start on the same day.', 409);
  }

  // R7: Overlap check
  if (existingBookingsForDay && existingBookingsForDay.length > 0) {
    for (const b of existingBookingsForDay) {
      if (b.status !== 'confirmed') continue;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);

      // Overlap condition: start < bEnd && end > bStart
      if (startDate < bEnd && endDate > bStart) {
        throw new AppError(
          'BOOKING_CONFLICT',
          `Room ${room.name} is already booked from ${bStart.toISOString().substring(11, 16)} to ${bEnd.toISOString().substring(11, 16)} UTC.`,
          409,
          { conflictingBookingId: b.id }
        );
      }
    }
  }

  return true;
}

module.exports = { validateBookingRules };