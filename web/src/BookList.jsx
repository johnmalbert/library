import React from 'react';
import BookCard from './BookCard';

function BookList({ books, onCheckoutClick }) {
  if (books.length === 0) {
    return <p>No books found in the library.</p>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
    }}>
      {books.map(book => (
        <BookCard
          key={book.isbn}
          book={book}
          onCheckoutClick={onCheckoutClick}
        />
      ))}
    </div>
  );
}

export default BookList;
