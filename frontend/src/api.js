const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function fetchRooms() {
  const res = await fetch(`${BASE_URL}/rooms`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function fetchBookings(date, roomId) {
  let url = `${BASE_URL}/bookings?date=${date}`;
  if (roomId) url += `&roomId=${roomId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function createBooking(booking) {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  const data = await res.json();
  if (!res.ok) throw data.error || new Error('Failed to create booking');
  return data;
}

export async function cancelBookingApi(id) {
  const res = await fetch(`${BASE_URL}/bookings/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw data.error || new Error('Failed to cancel booking');
  }
  return true;
}

export async function fetchAvailability(date, start, end, minCapacity) {
  const url = `${BASE_URL}/availability?date=${date}&start=${start}&end=${end}&minCapacity=${minCapacity}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw data.error || new Error('Search failed');
  return data;
}