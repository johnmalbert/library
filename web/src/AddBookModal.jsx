import React, { useState, useEffect } from 'react';
import { lookupBook, addBook, getLocations } from './api';

function AddBookModal({ onClose, onSuccess }) {
  const [isbn, setIsbn] = useState('');
  const [bookInfo, setBookInfo] = useState(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  async function handleLookup() {
    if (!isbn.trim()) {
      setError('Please enter an ISBN');
      return;
    }

    setError('');
    setLookingUp(true);
    try {
      const data = await lookupBook(isbn.trim());
      setBookInfo(data);
    } catch (err) {
      setError(err.message);
      setBookInfo(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!bookInfo) {
      setError('Please lookup the book first');
      return;
    }

    if (!location.trim()) {
      setError('Location is required');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await addBook({
        isbn: bookInfo.isbn,
        cover: bookInfo.cover,
        title: bookInfo.title,
        authors: bookInfo.authors,
        readingLevel: readingLevel,
        location: location,
        publishers: bookInfo.publishers,
        pages: bookInfo.pages,
        genres: bookInfo.genres,
        language: bookInfo.language,
        notes: notes,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
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
      overflowY: 'auto',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        margin: '20px',
      }}>
        <h2 style={{ marginTop: 0 }}>Add New Book</h2>

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ISBN Input and Lookup */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ISBN: *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
                placeholder="Enter ISBN..."
                disabled={bookInfo !== null}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || bookInfo !== null}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (lookingUp || bookInfo) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  opacity: (lookingUp || bookInfo) ? 0.6 : 1,
                }}
              >
                {lookingUp ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Book Information Display */}
          {bookInfo && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginBottom: '15px',
            }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                {bookInfo.cover && (
                  <img
                    src={bookInfo.cover}
                    alt={bookInfo.title}
                    style={{
                      width: '80px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{bookInfo.title}</h3>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                    <strong>Author(s):</strong> {bookInfo.authors || 'N/A'}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                    <strong>Publisher:</strong> {bookInfo.publishers || 'N/A'}
                  </p>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    <strong>Pages:</strong> {bookInfo.pages || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookInfo(null);
                  setIsbn('');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Change ISBN
              </button>
            </div>
          )}

          {/* Location - Only show if book is found */}
          {bookInfo && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Location: *
                </label>
                {loadingLocations ? (
                  <p style={{ fontSize: '14px', color: '#666' }}>Loading locations...</p>
                ) : locations.length > 0 ? (
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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

              {/* Reading Level */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Reading Level:
                </label>
                <input
                  type="text"
                  value={readingLevel}
                  onChange={(e) => setReadingLevel(e.target.value)}
                  placeholder="e.g., K-2, 3-5, 6-8"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Notes:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about the book..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {bookInfo && (
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
                {submitting ? 'Adding...' : 'Add Book'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: bookInfo ? 1 : 2,
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

export default AddBookModal;
