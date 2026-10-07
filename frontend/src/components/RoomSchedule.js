import React from 'react';

export default function RoomSchedule({ rooms, bookings, onSelectCancel }) {
  const timeSlots = [];
  for (let h = 8; h < 20; h++) {
    const hh = h.toString().padStart(2, '0');
    timeSlots.push(`${hh}:00`, `${hh}:15`, `${hh}:30`, `${hh}:45`);
  }

  return (
    <div className="schedule-container">
      <h3>Room Schedule (All Times UTC)</h3>
      <div className="table-responsive">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Capacity</th>
              <th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const roomBookings = bookings.filter((b) => b.roomId === room.id);
              return (
                <tr key={room.id}>
                  <td>
                    <strong>{room.name}</strong> <br />
                    <small>Floor {room.floor}</small>
                  </td>
                  <td>{room.capacity}</td>
                  <td>
                    {roomBookings.length === 0 ? (
                      <span className="no-bookings">No bookings for this date</span>
                    ) : (
                      <div className="booking-cards">
                        {roomBookings.map((b) => (
                          <div key={b.id} className="booking-card">
                            <div className="booking-title">{b.title}</div>
                            <div className="booking-time">
                              {b.start.substring(11, 16)} - {b.end.substring(11, 16)} UTC
                            </div>
                            <div className="booking-meta">
                              {b.organizerEmail} ({b.attendees} attendees)
                            </div>
                            <button
                              className="btn-danger-sm"
                              onClick={() => onSelectCancel(b)}
                              aria-label={`Cancel booking ${b.title}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}