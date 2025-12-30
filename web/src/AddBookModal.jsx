import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { lookupBook, addBook, getLocations } from './api';
import noImage from './no-image-available.png';

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
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    title: '',
    authors: '',
    pages: '',
    genres: '',
  });
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

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

  useEffect(() => {
    // Cleanup barcode reader on unmount
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    setScanning(true);
    setError('');
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('No camera found on this device');
        setScanning(false);
        return;
      }

      // Prefer back camera on mobile
      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            // ISBN can be 10 or 13 digits
            if (/^\d{10}(\d{3})?$/.test(scannedText)) {
              setIsbn(scannedText);
              setError('');
              stopScanning();
              // Auto-lookup after scanning
              setTimeout(() => {
                handleLookupWithIsbn(scannedText);
              }, 100);
            }
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  }

  function stopScanning() {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  }

  async function handleLookupWithIsbn(isbnValue) {
    const isbnToLookup = isbnValue || isbn;
    if (!isbnToLookup.trim()) {
      setError('Please enter an ISBN');
      return;
    }

    setError('');
    setLookingUp(true);
    try {
      const data = await lookupBook(isbnToLookup.trim());
      setBookInfo(data);
    } catch (err) {
      setError(err.message);
      setBookInfo(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleLookup() {
    await handleLookupWithIsbn();
  }

  function handleManualEntry() {
    setManualEntry(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate manual entry mode
    if (manualEntry) {
      if (!manualData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!manualData.authors.trim()) {
        setError('Author is required');
        return;
      }
      if (!location.trim()) {
        setError('Location is required');
        return;
      }
    } else {
      // Validate API lookup mode
      if (!bookInfo) {
        setError('Please lookup the book first');
        return;
      }

      if (!location.trim()) {
        setError('Location is required');
        return;
      }
    }

    setError('');
    setSubmitting(true);
    try {
      if (manualEntry) {
        // Submit manually entered book with the scanned/entered ISBN
        await addBook({
          isbn: isbn.trim(),
          cover: '',
          title: manualData.title.trim(),
          authors: manualData.authors.trim(),
          readingLevel: readingLevel,
          location: location,
          publishers: '',
          pages: manualData.pages.trim(),
          genres: manualData.genres.trim(),
          language: '',
          notes: notes,
        });
      } else {
        // Submit book from API lookup
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
      }
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
        <h2 style={{ marginTop: 0 }}>Add Library Book</h2>

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
            {/* Show manual entry button only on "Book not found" error and not already in manual mode */}
            {error.includes('Book not found') && !manualEntry && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  Enter Book Details Manually
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ISBN Input and Lookup - Only show if not in manual entry mode */}
          {!manualEntry && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                ISBN: *
              </label>
            
            {scanning ? (
              <div style={{ marginBottom: '10px' }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    backgroundColor: '#000',
                  }}
                />
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    Point camera at ISBN barcode
                  </p>
                  <button
                    type="button"
                    onClick={stopScanning}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
                    placeholder="e.g. 9780143127741"
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
                {!bookInfo && (
                  <button
                    type="button"
                    onClick={startScanning}
                    disabled={lookingUp}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: lookingUp ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: lookingUp ? 0.6 : 1,
                    }}
                  >
                    📷 Scan Barcode
                  </button>
                )}
              </>
            )}
          </div>
          )}

          {/* Manual Entry Form */}
          {manualEntry && (
            <>
              <div style={{
                padding: '15px',
                backgroundColor: '#e7f3ff',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '2px solid #17a2b8',
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px', color: '#17a2b8' }}>
                  Manual Entry Mode
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {isbn && <><strong>ISBN:</strong> {isbn}<br /></>}
                  Enter the book details manually below.
                </p>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Title: *
                </label>
                <input
                  type="text"
                  value={manualData.title}
                  onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                  placeholder="Enter book title"
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

              {/* Author */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Author: *
                </label>
                <input
                  type="text"
                  value={manualData.authors}
                  onChange={(e) => setManualData({ ...manualData, authors: e.target.value })}
                  placeholder="Enter author name(s)"
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

              {/* Pages (Optional) */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Pages:
                </label>
                <input
                  type="text"
                  value={manualData.pages}
                  onChange={(e) => setManualData({ ...manualData, pages: e.target.value })}
                  placeholder="Number of pages (optional)"
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

              {/* Genre (Optional) */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Genre:
                </label>
                <input
                  type="text"
                  value={manualData.genres}
                  onChange={(e) => setManualData({ ...manualData, genres: e.target.value })}
                  placeholder="Genre or category (optional)"
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
            </>
          )}

          {/* Book Information Display */}
          {bookInfo && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              marginBottom: '15px',
            }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                <img
                  src={bookInfo.cover || noImage}
                  alt={bookInfo.title}
                  style={{
                    width: '80px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                  onError={(e) => {
                    e.target.src = noImage;
                  }}
                />
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

          {/* Location - Show if book is found OR in manual entry mode */}
          {(bookInfo || manualEntry) && (
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
            {(bookInfo || manualEntry) && (
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
                flex: (bookInfo || manualEntry) ? 1 : 2,
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
