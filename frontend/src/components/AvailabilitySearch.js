import React, { useState } from 'react';
import { fetchAvailability } from '../api';

export default function AvailabilitySearch({ currentDate, onSelectRoom }) {
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [minCap, setMinCap] = useState(2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAvailability(currentDate, start, end, minCap);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-search">
      <h3>Find Available Rooms</h3>
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label htmlFor="search-start">Start (UTC)</label>
          <input id="search-start" type="time" step="900" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="search-end">End (UTC)</label>
          <input id="search-end" type="time" step="900" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="search-cap">Min Capacity</label>
          <input id="search-cap" type="number" min="1" value={minCap} onChange={(e) => setMinCap(e.target.value)} required />
        </div>
        <button type="submit" className="btn-secondary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {results && (
        <div className="search-results">
          <h4>Available Rooms:</h4>
          {results.length === 0 ? (
            <p>No rooms available for the selected criteria.</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <span><strong>{r.name}</strong> (Capacity: {r.capacity})</span>
                  <button className="btn-sm" onClick={() => onSelectRoom(r.id, start, end)}>
                    Book This Room
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}