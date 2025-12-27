const { google } = require('googleapis');

/**
 * Creates and returns an authenticated Google Sheets API client
 */
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Reads all rows from a specific sheet tab
 * @param {string} sheetName - Name of the sheet tab (e.g., "Inventory")
 * @returns {Promise<Array>} Array of row objects with column headers as keys
 */
async function readSheet(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
      valueRenderOption: 'FORMULA',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .filter(row => {
        // Filter out completely empty rows
        return row && row.some(cell => cell && cell.toString().trim() !== '');
      })
      .map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      })
      // Filter out rows with no ISBN (primary key)
      .filter(book => {
        const isbn = (book.ISBN || book.isbn || '').toString().trim();
        return isbn !== '';
      });

    return data;
  } catch (error) {
    // If sheet doesn't exist, return empty array
    if (error.code === 400 || error.message?.includes('Unable to parse range')) {
      console.log(`Sheet "${sheetName}" not found, returning empty array`);
      return [];
    }
    throw error;
  }
}

/**
 * Updates the location for a book in the Inventory sheet
 * Also clears the RequestedBy column when moving
 * @param {string} isbn - Book ISBN
 * @param {string} location - New location
 */
async function updateLocation(isbn, location) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  const sheetName = 'Inventory';

  // Normalize the ISBN for comparison
  const normalizedIsbn = isbn.toString().trim();

  // Read inventory to find the book
  const inventory = await readSheet(sheetName);
  const bookIndex = inventory.findIndex(book => {
    const bookIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return bookIsbn === normalizedIsbn;
  });

  if (bookIndex === -1) {
    throw new Error(`Book with ISBN ${normalizedIsbn} not found`);
  }

  // Update the Location column (column F) and clear RequestedBy column (column L)
  const rowNumber = bookIndex + 2; // +2 because row 1 is header and arrays are 0-indexed
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'RAW',
      data: [
        {
          range: `${sheetName}!F${rowNumber}`,
          values: [[location]],
        },
        {
          range: `${sheetName}!L${rowNumber}`,
          values: [['']],
        }
      ],
    },
  });
}

/**
 * Gets data validation rules for a specific column in a sheet
 * @param {string} sheetName - Name of the sheet tab (e.g., "Inventory")
 * @param {string} columnLetter - Column letter (e.g., "F" for Location column)
 * @returns {Promise<Array>} Array of valid values
 */
async function getValidationRules(sheetName, columnLetter) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;

  try {
    // Get spreadsheet metadata including data validation
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: [`${sheetName}!${columnLetter}:${columnLetter}`],
    });

    const sheet = response.data.sheets?.[0];
    if (!sheet) return [];

    // Look for data validation in the column
    const columnData = sheet.data?.[0]?.rowData || [];
    
    for (const row of columnData) {
      const cell = row.values?.[0];
      if (cell?.dataValidation) {
        const validation = cell.dataValidation;
        
        // Handle list validation from range
        if (validation.condition?.type === 'ONE_OF_RANGE') {
          const rangeFormula = validation.condition.values?.[0]?.userEnteredValue;
          if (rangeFormula) {
            // Extract the range (e.g., "Locations!A2:A")
            const match = rangeFormula.match(/=(.+)/);
            if (match) {
              const range = match[1];
              const valuesResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
              });
              return (valuesResponse.data.values || []).flat().filter(v => v);
            }
          }
        }
        
        // Handle explicit list validation
        if (validation.condition?.type === 'ONE_OF_LIST') {
          const values = validation.condition.values || [];
          return values.map(v => v.userEnteredValue).filter(v => v);
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    return [];
  }
}

/**
 * Adds a new book to the Inventory sheet
 * @param {Object} bookData - Book data with ISBN, Cover, Title, Authors, Reading Level, Location, Publishers, Pages, Genres, Language, Notes
 */
async function addBook(bookData) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  const sheetName = 'Inventory';

  // Normalize ISBN for comparison
  const normalizedIsbn = (bookData.isbn || '').toString().trim();
  
  if (!normalizedIsbn) {
    throw new Error('ISBN is required');
  }

  // Check if book already exists
  const inventory = await readSheet(sheetName);
  const exists = inventory.some(book => {
    const existingIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return existingIsbn === normalizedIsbn;
  });
  
  if (exists) {
    throw new Error(`Book with ISBN ${normalizedIsbn} already exists in the library`);
  }

  // Create row in the order: ISBN, Cover, Title, Authors, Reading Level, Location, Publishers, Pages, Genres, Language, Notes
  // Note: Cover should be a formula like =IMAGE("url") to match the sheet's pattern
  const coverFormula = bookData.cover ? `=IMAGE("${bookData.cover}")` : '';
  
  const newRow = [
    bookData.isbn,
    coverFormula,
    bookData.title,
    bookData.authors,
    bookData.readingLevel || '',
    bookData.location,
    bookData.publishers,
    bookData.pages,
    bookData.genres,
    bookData.language,
    bookData.notes || '',
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:K`,
    valueInputOption: 'USER_ENTERED', // This allows formulas to be processed
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [newRow],
    },
  });
}

/**
 * Updates the RequestedBy field for a book in the Inventory sheet
 * @param {string} isbn - Book ISBN
 * @param {string} requestedBy - Name/location of who requested the book
 */
async function requestBook(isbn, requestedBy) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.SHEET_ID;
  const sheetName = 'Inventory';

  // Normalize the ISBN for comparison
  const normalizedIsbn = isbn.toString().trim();

  // Read inventory to find the book
  const inventory = await readSheet(sheetName);
  const bookIndex = inventory.findIndex(book => {
    const bookIsbn = (book.ISBN || book.isbn || '').toString().trim();
    return bookIsbn === normalizedIsbn;
  });

  if (bookIndex === -1) {
    throw new Error(`Book with ISBN ${normalizedIsbn} not found`);
  }

  // Update the RequestedBy column (column L, 12th column)
  const rowNumber = bookIndex + 2; // +2 because row 1 is header and arrays are 0-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!L${rowNumber}`,
    valueInputOption: 'RAW',
    resource: {
      values: [[requestedBy]],
    },
  });
}

module.exports = {
  readSheet,
  updateLocation,
  requestBook,
  getValidationRules,
  addBook,
};
