import React, { useState, useEffect } from 'react';

export default function BookingForm({ rooms, currentDate, initialValues, onBookingCreated }) {
  const [roomId, setRoomId] = useState(rooms[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.roomId) setRoomId(initialValues.roomId);
      if (initialValues.start) setStartTime(initialValues.start);
      if (initialValues.end) setEndTime(initialValues.end);
    }
  }, [initialValues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Front-end Pre-validation
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be strictly after start time.');
      return;
    }

    const payload = {
      roomId: Number(roomId),
      title: title.trim(),
      organizerEmail,
      attendees: Number(attendees),
      start: `${currentDate}T${startTime}:00Z`,
      end: `${currentDate}T${endTime}:00Z`
    };

    setLoading(true);
    try {
      await onBookingCreated(payload);
      setTitle('');
      setError(null);
    } catch (err) {
      setError(err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>Book a Room</h3>
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="form-group">
        <label htmlFor="room">Room</label>
        <select id="room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} (Cap: {r.capacity})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="title">Meeting Title</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
      </div>

      <div className="form-group">
        <label htmlFor="email">Organizer Email</label>
        <input id="email" type="email" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="attendees">Attendees</label>
        <input id="attendees" type="number" min="1" value={attendees} onChange={(e) => setAttendees(e.target.value)} required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start">Start Time (UTC)</label>
          <input id="start" type="time" step="900" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="end">End Time (UTC)</label>
          <input id="end" type="time" step="900" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Booking...' : 'Submit Booking'}
      </button>
    </form>
  );
}