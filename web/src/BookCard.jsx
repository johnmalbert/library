import React from 'react';
import noImage from './no-image-available.png';

function BookCard({ book, onCheckoutClick, onRequestClick }) {
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
      <p style={{ color: '#666', fontSize: '14px', margin: '5px 0', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        by {book.authors || 'Author unavailable'}
      </p>
      
      <p style={{ fontSize: '12px', color: '#888', margin: '5px 0' }}>
        Notes: {book.notes || 'Not specified'}
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
        height: '60px',
        overflow: 'hidden',
      }}>
        <strong>Location:</strong> {book.location || 'Not set'}
        {book.requestedBy && (
          <div style={{ marginTop: '5px', color: '#d9534f', fontWeight: 'bold' }}>
            Requested by: {book.requestedBy}
          </div>
        )}
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
      
      <button
        onClick={() => onRequestClick(book)}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '8px',
          backgroundColor: '#5cb85c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#449d44'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#5cb85c'}
      >
        Request Book
      </button>
    </div>
  );
}

export default BookCard;
