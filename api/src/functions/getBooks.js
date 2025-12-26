const { app } = require('@azure/functions');
const { readSheet } = require('../sheets');

app.http('getBooks', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'getBooks',
  handler: async (request, context) => {
    try {
      // Read inventory sheet
      const inventory = await readSheet('Inventory');

      // Map inventory to book objects
      const books = inventory.map(book => {
        const isbnKey = book.ISBN || book.isbn;

        // Extract URL from IMAGE formula if present
        let coverUrl = book.Cover || book.cover || '';
        if (coverUrl.startsWith('=IMAGE(')) {
          const match = coverUrl.match(/=IMAGE\("([^"]+)"/);
          if (match) {
            coverUrl = match[1];
          }
        }

        return {
          isbn: isbnKey,
          title: book.Title || book.title,
          authors: book.Authors || book.author,
          readingLevel: book['Reading Level'] || book.level,
          cover: coverUrl,
          publishers: book.Publishers || '',
          pages: book.Pages || '',
          genres: book.Genres || '',
          language: book.Language || '',
          notes: book.Notes || '',
          location: book.Location || '',
        };
      });

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: books,
      };
    } catch (error) {
      context.log('Error in getBooks:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch books', details: error.message },
      };
    }
  },
});
