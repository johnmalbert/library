const API_BASE = '/api';

export async function getBooks(sheetName = 'Inventory') {
  const response = await fetch(`${API_BASE}/getBooks?sheetName=${encodeURIComponent(sheetName)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function checkoutBook(isbn, newLocation, sheetName = 'Inventory') {
  const response = await fetch(`${API_BASE}/checkoutBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isbn, newLocation, sheetName }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to checkout book');
  }
  
  return response.json();
}

export async function getLocations(sheetName = 'Inventory') {
  const response = await fetch(`${API_BASE}/getLocations?sheetName=${encodeURIComponent(sheetName)}`);
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

export async function addBook(bookData, sheetName = 'Inventory') {
  const response = await fetch(`${API_BASE}/addBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...bookData, sheetName }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add book');
  }
  
  return response.json();
}

export async function requestBook(isbn, requestedBy, sheetName = 'Inventory') {
  const response = await fetch(`${API_BASE}/requestBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isbn, requestedBy, sheetName }),
  });
  
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request book');
    } catch (e) {
      throw new Error(`Failed to request book (${response.status}: ${response.statusText})`);
    }
  }
  
  return response.json();
}
