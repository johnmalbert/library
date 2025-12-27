import React, { useState, useEffect } from 'react';
import { getLocations } from './api';
import noImage from './no-image-available.png';

function CheckoutModal({ book, onClose, onSubmit }) {
  const [newLocation, setNewLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoadingLocations(false);
      }
    }
    fetchLocations();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newLocation.trim()) {
      alert('Please select a location');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(book.isbn, newLocation);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Move Book to New Location</h2>
        
        {/* Book Card Display */}
        <div style={{
          display: 'flex',
          gap: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #e0e0e0',
        }}>
          <img
            src={book.cover || noImage}
            alt={book.title}
            style={{
              width: '80px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '4px',
              flexShrink: 0,
            }}
            onError={(e) => {
              e.target.src = noImage;
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#2c3e50',
            }}>
              {book.title || 'Unknown Title'}
            </h3>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
              <strong>Author:</strong> {book.authors || 'Unknown'}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
              <strong>ISBN:</strong> {book.isbn}
            </p>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: '14px', 
              padding: '6px 10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}>
              Current: {book.location || 'Not set'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              New Location:
            </label>
            {loadingLocations ? (
              <p style={{ fontSize: '14px', color: '#666' }}>Loading locations...</p>
            ) : locations.length > 0 ? (
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                }}
              >
                <option value="">-- Select a location --</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g., Living Room, Sarah's Room"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutModal;
