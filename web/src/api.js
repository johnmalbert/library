const API_BASE = '/api';

export async function getBooks() {
  const response = await fetch(`${API_BASE}/getBooks`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function checkoutBook(isbn, newLocation) {
  const response = await fetch(`${API_BASE}/checkoutBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isbn, newLocation }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to checkout book');
  }
  
  return response.json();
}

export async function getLocations() {
  const response = await fetch(`${API_BASE}/getLocations`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

export async function lookupBook(isbn) {
  const response = await fetch(`${API_BASE}/lookupBook?isbn=${encodeURIComponent(isbn)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to lookup book');
  }
  return response.json();
}

export async function addBook(bookData) {
  const response = await fetch(`${API_BASE}/addBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add book');
  }
  
  return response.json();
}
