import React from 'react';

export default function CancelModal({ booking, onConfirm, onCancel }) {
  if (!booking) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title">Cancel Booking Confirmation</h3>
        <p>Are you sure you want to cancel the booking <strong>"{booking.title}"</strong>?</p>
        <p><small>Time: {booking.start.substring(11, 16)} - {booking.end.substring(11, 16)} UTC</small></p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>No, Keep It</button>
          <button className="btn-danger" onClick={() => onConfirm(booking.id)}>Yes, Cancel Booking</button>
        </div>
      </div>
    </div>
  );
}