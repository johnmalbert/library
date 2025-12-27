import React, { useState, useEffect } from 'react';
import { getLocations } from './api';
import noImage from './no-image-available.png';

function RequestModal({ book, onClose, onSubmit }) {
  const [requestedBy, setRequestedBy] = useState('');
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
    if (!requestedBy.trim()) {
      alert('Please select who is requesting the book');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(book.isbn, requestedBy);
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
    }}
    onClick={onClose}
    >
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0 }}>Request Book</h2>
        
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          gap: '15px',
        }}>
          <div style={{
            width: '80px',
            height: '120px',
            flexShrink: 0,
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={book.cover || noImage}
              alt={book.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.target.src = noImage;
              }}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{book.title}</h3>
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
              {book.authors || 'Author unavailable'}
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
              ISBN: {book.isbn}
            </p>
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>
              Current Location: {book.location || 'Not set'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontWeight: 'bold',
            }}>
              Who is requesting this book? *
            </label>
            {loadingLocations ? (
              <p>Loading options...</p>
            ) : (
              <select
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="">-- Select a person --</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '10px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#5cb85c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Requesting...' : 'Request Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestModal;
