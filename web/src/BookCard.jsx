import React from 'react';

function BookCard({ book, onCheckoutClick }) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        width: '100%',
        height: '180px',
        borderRadius: '4px',
        marginBottom: '10px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="color: #999; font-size: 14px; text-align: center;">No Image Available</div>';
            }}
          />
        ) : (
          <div style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>
            No Image Available
          </div>
        )}
      </div>
      
      <h3 style={{ 
        margin: '10px 0', 
        fontSize: '16px',
        lineHeight: '1.4',
        height: '67px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
      }}>
        {book.title}
      </h3>
      <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
        by {book.authors || 'Author unavailable'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#888', margin: '5px 0' }}>
        Level: {book.readingLevel || 'Not specified'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#888', margin: '5px 0' }}>
        Genre: {book.genres || 'Not specified'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#888', margin: '5px 0' }}>
        {book.pages ? `${book.pages} pages` : 'Page count unavailable'}
      </p>
      
      <div style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '13px',
      }}>
        <strong>Location:</strong> {book.location || 'Not set'}
      </div>
      
      <button
        onClick={() => onCheckoutClick(book)}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '8px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        Move / Check Out
      </button>
    </div>
  );
}

export default BookCard;
