import React, { useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import BookList from './BookList';
import CheckoutModal from './CheckoutModal';
import RequestModal from './RequestModal';
import AddBookModal from './AddBookModal';
import { getBooks, checkoutBook, requestBook } from './api';
import logo from './logo.png';

function App() {
  const [library, setLibrary] = useState('Inventory'); // 'Inventory' or 'Adult Inventory'
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestBook, setSelectedRequestBook] = useState(null);
  const [showAddBook, setShowAddBook] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationFilters, setSelectedLocationFilters] = useState([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scanningCheckout, setScanningCheckout] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  React.useEffect(() => {
    loadBooks();
  }, [library]);

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
      const data = await getBooks(library);
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
      await checkoutBook(isbn, newLocation, library);
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

  async function handleRequest(isbn, requestedBy) {
    try {
      await requestBook(isbn, requestedBy, library);
      await loadBooks();
      setShowRequestModal(false);
      setSelectedRequestBook(null);
    } catch (err) {
      alert('Failed to request book. Please try again.');
      console.error(err);
    }
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
      const isbn = (book.isbn || '').toLowerCase();
      const location = (book.location || '').toLowerCase();
      if (!title.includes(query) && !authors.includes(query) && !isbn.includes(query) && !location.includes(query)) {
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
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <img 
            src={logo} 
            alt="Albert Children's Library" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: '300px',
              marginBottom: '8px'
            }} 
          />
          <p style={{ color: '#7f8c8d', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', margin: '0 0 20px 0' }}>Discover and explore our collection of children's books</p>
        </div>
        
        {/* Library selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '10px',
        }}>
          <button
            onClick={() => setLibrary('Inventory')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid #007bff',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: library === 'Inventory' ? '#007bff' : 'white',
              color: library === 'Inventory' ? 'white' : '#007bff',
              transition: 'all 0.2s',
            }}
          >
            📚 Children's Library
          </button>
          <button
            onClick={() => setLibrary('Adult Inventory')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid #6f42c1',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: library === 'Adult Inventory' ? '#6f42c1' : 'white',
              color: library === 'Adult Inventory' ? 'white' : '#6f42c1',
              transition: 'all 0.2s',
            }}
          >
            📖 Adult Library
          </button>
        </div>
        
        {/* Action buttons - centered and responsive */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '10px',
          maxWidth: '600px',
          margin: '0 auto 20px auto'
        }}>
          <button
            onClick={() => startCheckoutScanning()}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#0056b3';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,123,255,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#007bff';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>📷</span>
            <span>Scan to Move</span>
          </button>
          <button
            onClick={() => setShowAddBook(true)}
            style={{
              flex: '1 1 200px',
              minWidth: '200px',
              padding: '14px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(40,167,69,0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#218838';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(40,167,69,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#28a745';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(40,167,69,0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>➕</span>
            <span>Add New Book</span>
          </button>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            placeholder="Search by title, author, ISBN, or location..."
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

        {(searchQuery || selectedLocationFilters.length > 0) && (
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
          onRequestClick={(book) => {
            setSelectedRequestBook(book);
            setShowRequestModal(true);
          }}
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

      {showRequestModal && selectedRequestBook && (
        <RequestModal
          book={selectedRequestBook}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedRequestBook(null);
          }}
          onSubmit={handleRequest}
        />
      )}

      {showAddBook && (
        <AddBookModal
          onClose={() => setShowAddBook(false)}
          onSuccess={handleAddBook}
          library={library}
        />
      )}
    </div>
  );
}

export default App;
