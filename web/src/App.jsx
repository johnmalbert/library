import React, { useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import BookList from './BookList';
import CheckoutModal from './CheckoutModal';
import AddBookModal from './AddBookModal';
import { getBooks, checkoutBook } from './api';

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotesFilters, setSelectedNotesFilters] = useState([]);
  const [selectedLocationFilters, setSelectedLocationFilters] = useState([]);
  const [showNotesFilter, setShowNotesFilter] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scanningCheckout, setScanningCheckout] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  React.useEffect(() => {
    loadBooks();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    // Cleanup barcode reader on unmount
    return () => {
      stopCheckoutScanning();
    };
  }, []);

  async function loadBooks() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(isbn, newLocation) {
    try {
      await checkoutBook(isbn, newLocation);
      await loadBooks();
      setSelectedBook(null);
    } catch (err) {
      alert('Failed to update book location. Please try again.');
      console.error(err);
    }
  }

  async function handleAddBook() {
    await loadBooks();
    setShowAddBook(false);
  }

  async function startCheckoutScanning() {
    setScanningCheckout(true);
    setScanError('');
    
    // Ensure books are loaded
    if (books.length === 0) {
      setScanError('Loading books... Please wait and try again.');
      setScanningCheckout(false);
      return;
    }
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setScanError('No camera found on this device');
        setScanningCheckout(false);
        return;
      }

      const selectedDevice = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Scanned ISBN:', scannedText);
            console.log('Books in library:', books.length);
            console.log('Sample ISBNs:', books.slice(0, 5).map(b => ({ title: b.title, isbn: b.isbn })));
            
            // ISBN can be 10 or 13 digits
            if (/^\d{10}(\d{3})?$/.test(scannedText)) {
              const book = books.find(b => b.isbn === scannedText);
              if (book) {
                console.log('Book found:', book.title);
                setSelectedBook(book);
                stopCheckoutScanning();
              } else {
                console.log('Book NOT found for ISBN:', scannedText);
                setScanError(`Book with ISBN ${scannedText} not found in library. (${books.length} books loaded)`);
              }
            }
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setScanError('Failed to start camera. Please check permissions.');
      setScanningCheckout(false);
    }
  }

  function stopCheckoutScanning() {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanningCheckout(false);
    setScanError('');
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get unique notes values for filter options
  const uniqueNotes = React.useMemo(() => {
    const notesSet = new Set();
    books.forEach(book => {
      const notes = (book.notes || '').trim();
      if (notes) {
        notesSet.add(notes);
      }
    });
    return Array.from(notesSet).sort();
  }, [books]);

  // Get unique locations for filter options
  const uniqueLocations = React.useMemo(() => {
    const locationSet = new Set();
    books.forEach(book => {
      const location = (book.location || '').trim();
      if (location) {
        locationSet.add(location);
      }
    });
    return Array.from(locationSet).sort();
  }, [books]);

  // Toggle notes filter selection
  const toggleNotesFilter = (notesValue) => {
    setSelectedNotesFilters(prev => 
      prev.includes(notesValue)
        ? prev.filter(v => v !== notesValue)
        : [...prev, notesValue]
    );
  };

  // Toggle location filter selection
  const toggleLocationFilter = (locationValue) => {
    setSelectedLocationFilters(prev => 
      prev.includes(locationValue)
        ? prev.filter(v => v !== locationValue)
        : [...prev, locationValue]
    );
  };

  // Filter books based on search query, notes filters, and location filters
  const filteredBooks = books.filter(book => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (book.title || '').toLowerCase();
      const authors = (book.authors || '').toLowerCase();
      const location = (book.location || '').toLowerCase();
      if (!title.includes(query) && !authors.includes(query) && !location.includes(query)) {
        return false;
      }
    }

    // Notes filter
    if (selectedNotesFilters.length > 0) {
      const bookNotes = (book.notes || '').trim();
      if (!selectedNotesFilters.includes(bookNotes)) {
        return false;
      }
    }

    // Location filter
    if (selectedLocationFilters.length > 0) {
      const bookLocation = (book.location || '').trim();
      if (!selectedLocationFilters.includes(bookLocation)) {
        return false;
      }
    }

    return true;
  });

  // Always sort alphabetically by title
  const sortedBooks = [...filteredBooks].sort((a, b) => 
    (a.title || '').localeCompare(b.title || '')
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <h1 style={{ color: '#2c3e50', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '8px', margin: 0 }}>Albert Children's Library</h1>
          <p style={{ color: '#7f8c8d', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', margin: 0 }}>Discover and explore our collection of children's books</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            onClick={() => startCheckoutScanning()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            📷 Scan to Move
          </button>
          <button
            onClick={() => setShowAddBook(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            + Add New Book
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Search by title, author, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '12px 16px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {uniqueNotes.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div
              onClick={() => setShowNotesFilter(!showNotesFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '10px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginBottom: showNotesFilter ? '12px' : '0',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                {showNotesFilter ? '▼' : '▶'}
              </span>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#555', margin: 0, cursor: 'pointer' }}>
                Filter by Reading Level
                {selectedNotesFilters.length > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#007bff', fontWeight: 'bold' }}>
                    ({selectedNotesFilters.length} selected)
                  </span>
                )}
              </label>
            </div>
            {showNotesFilter && (
              <>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {uniqueNotes.map(notesValue => (
                    <label
                      key={notesValue}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: selectedNotesFilters.includes(notesValue) ? '#e7f3ff' : 'white',
                        borderColor: selectedNotesFilters.includes(notesValue) ? '#007bff' : '#ddd',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotesFilters.includes(notesValue)}
                        onChange={() => toggleNotesFilter(notesValue)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333' }}>{notesValue}</span>
                    </label>
                  ))}
                </div>
                {selectedNotesFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedNotesFilters([])}
                    style={{
                      marginTop: '10px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    Clear Reading Level Filters
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {uniqueLocations.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div
              onClick={() => setShowLocationFilter(!showLocationFilter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '10px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #ddd',
                marginBottom: showLocationFilter ? '12px' : '0',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                {showLocationFilter ? '▼' : '▶'}
              </span>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#555', margin: 0, cursor: 'pointer' }}>
                Filter by Location
                {selectedLocationFilters.length > 0 && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#ff9800', fontWeight: 'bold' }}>
                    ({selectedLocationFilters.length} selected)
                  </span>
                )}
              </label>
            </div>
            {showLocationFilter && (
              <>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {uniqueLocations.map(locationValue => (
                    <label
                      key={locationValue}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: selectedLocationFilters.includes(locationValue) ? '#fff3e0' : 'white',
                        borderColor: selectedLocationFilters.includes(locationValue) ? '#ff9800' : '#ddd',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationFilters.includes(locationValue)}
                        onChange={() => toggleLocationFilter(locationValue)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333' }}>{locationValue}</span>
                    </label>
                  ))}
                </div>
                {selectedLocationFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedLocationFilters([])}
                    style={{
                      marginTop: '10px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                  >
                    Clear Location Filters
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {(searchQuery || selectedNotesFilters.length > 0 || selectedLocationFilters.length > 0) && (
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
          </p>
        )}
      </header>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee', 
          color: '#c00', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <BookList 
          books={sortedBooks} 
          onCheckoutClick={(book) => setSelectedBook(book)} 
        />
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'background-color 0.2s',
            zIndex: 1000,
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          title="Back to top"
        >
          ↑
        </button>
      )}

      {scanningCheckout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ marginTop: 0 }}>Scan Book to Move</h2>
            
            {scanError && (
              <div style={{
                padding: '10px',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
              }}>
                {scanError}
              </div>
            )}

            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                backgroundColor: '#000',
                marginBottom: '15px',
              }}
            />
            
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '15px' }}>
              Point camera at the ISBN barcode on the back of the book
            </p>

            <button
              onClick={stopCheckoutScanning}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedBook && (
        <CheckoutModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSubmit={handleCheckout}
        />
      )}

      {showAddBook && (
        <AddBookModal
          onClose={() => setShowAddBook(false)}
          onSuccess={handleAddBook}
        />
      )}
    </div>
  );
}

export default App;
