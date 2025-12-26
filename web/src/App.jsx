import React, { useState } from 'react';
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
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  async function loadBooks() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      // Sort books alphabetically by title
      const sortedBooks = data.sort((a, b) => 
        (a.title || '').localeCompare(b.title || '')
      );
      setBooks(sortedBooks);
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter books based on search query
  const filteredBooks = books.filter(book => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = (book.title || '').toLowerCase();
    const location = (book.location || '').toLowerCase();
    return title.includes(query) || location.includes(query);
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <h1 style={{ color: '#2c3e50', fontSize: '2.5rem', marginBottom: '8px', margin: 0 }}>Albert Children's Library</h1>
            <p style={{ color: '#7f8c8d', fontSize: '1.1rem', margin: 0 }}>Discover and explore our collection of children's books</p>
          </div>
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
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            + Add Book
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Search by title or location..."
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
          {searchQuery && (
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
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
          books={filteredBooks} 
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
