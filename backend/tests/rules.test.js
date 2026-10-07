const { validateBookingRules } = require('../src/utils/rules');

describe('Pure Business Rules Unit Tests (R1-R9)', () => {
  const room = { id: 1, name: 'Atlas', capacity: 4 };

  // Reference Table Tests
  test('Overlap cases: Reference table tests for Atlas (10:00-11:00 existing)', () => {
    const existing = [{ id: 1, status: 'confirmed', start_time: '2030-05-14T10:00:00Z', end_time: '2030-05-14T11:00:00Z' }];

    const check = (start, end) => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: `2030-05-14T${start}:00Z`, end: `2030-05-14T${end}:00Z`,
      existingBookingsForDay: existing, organizerBookingsCountForDay: 0,
      now: new Date('2030-01-01')
    });

    expect(check('09:00', '10:00')).toBe(true); // Allowed
    expect(check('11:00', '12:00')).toBe(true); // Allowed
    expect(() => check('09:30', '10:30')).toThrow('BOOKING_CONFLICT');
    expect(() => check('10:30', '11:30')).toThrow('BOOKING_CONFLICT');
    expect(() => check('10:15', '10:45')).toThrow('BOOKING_CONFLICT');
    expect(() => check('09:00', '12:00')).toThrow('BOOKING_CONFLICT');
    expect(() => check('10:00', '11:00')).toThrow('BOOKING_CONFLICT');
  });

  test('R1: end must be after start', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: '2030-05-14T10:00:00Z', end: '2030-05-14T10:00:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 0, now: new Date('2030-01-01')
    })).toThrow('End time must be after start time.');
  });

  test('R2: 15-minute boundaries check', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: '2030-05-14T10:05:00Z', end: '2030-05-14T10:30:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 0, now: new Date('2030-01-01')
    })).toThrow('RULE_R2');
  });

  test('R3: Minimum 15m and Maximum 4h duration', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: '2030-05-14T10:00:00Z', end: '2030-05-14T14:30:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 0, now: new Date('2030-01-01')
    })).toThrow('RULE_R3');
  });

  test('R4: Business hours (08:00 to 20:00 UTC)', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: '2030-05-14T07:45:00Z', end: '2030-05-14T08:30:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 0, now: new Date('2030-01-01')
    })).toThrow('RULE_R4');
  });

  test('R6: Attendees exceed capacity', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 10,
      start: '2030-05-14T10:00:00Z', end: '2030-05-14T11:00:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 0, now: new Date('2030-01-01')
    })).toThrow('RULE_R6');
  });

  test('R9: Organizer booking limit (max 3 per day)', () => {
    expect(() => validateBookingRules({
      room, title: 'Test', organizerEmail: 'a@b.com', attendees: 2,
      start: '2030-05-14T10:00:00Z', end: '2030-05-14T11:00:00Z',
      existingBookingsForDay: [], organizerBookingsCountForDay: 3, now: new Date('2030-01-01')
    })).toThrow('RULE_R9');
  });
});