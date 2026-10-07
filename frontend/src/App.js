import React, { useState, useEffect, useCallback } from 'react';
import { fetchRooms, fetchBookings, createBooking, cancelBookingApi } from './api';
import RoomSchedule from './components/RoomSchedule';
import BookingForm from './components/BookingForm';
import AvailabilitySearch from './components/AvailabilitySearch';
import CancelModal from './components/CancelModal';

export default function App() {
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const [roomsData, bookingsData] = await Promise.all([
        fetchRooms(),
        fetchBookings(date)
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (err) {
      setGlobalError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookingCreated = async (payload) => {
    await createBooking(payload);
    await loadData();
  };

  const handleConfirmCancel = async (id) => {
    try {
      await cancelBookingApi(id);
      setSelectedForCancel(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleSelectRoomFromSearch = (roomId, start, end) => {
    setFormPrefill({ roomId, start, end });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Meeting Room Booking System</h1>
        <p className="utc-badge">All times are in UTC</p>
      </header>

      <div className="date-picker-bar">
        <label htmlFor="schedule-date">Select Date (UTC): </label>
        <input
          id="schedule-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {globalError && <div className="error-banner">{globalError}</div>}

      {loading ? (
        <div className="loading-state">Loading schedule and rooms...</div>
      ) : (
        <main className="main-grid">
          <div className="left-column">
            <RoomSchedule
              rooms={rooms}
              bookings={bookings}
              onSelectCancel={(booking) => setSelectedForCancel(booking)}
            />
          </div>
          <div className="right-column">
            <BookingForm
              rooms={rooms}
              currentDate={date}
              initialValues={formPrefill}
              onBookingCreated={handleBookingCreated}
            />
            <AvailabilitySearch
              currentDate={date}
              onSelectRoom={handleSelectRoomFromSearch}
            />
          </div>
        </main>
      )}

      {selectedForCancel && (
        <CancelModal
          booking={selectedForCancel}
          onConfirm={handleConfirmCancel}
          onCancel={() => setSelectedForCancel(null)}
        />
      )}
    </div>
  );
}