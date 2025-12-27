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
        const isbnKey = (book.ISBN || book.isbn || '').toString().trim();

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
          title: (book.Title || book.title || '').trim(),
          authors: (book.Authors || book.author || '').trim(),
          readingLevel: (book['Reading Level'] || book.level || '').trim(),
          cover: coverUrl,
          publishers: (book.Publishers || '').trim(),
          pages: (book.Pages || '').toString().trim(),
          genres: (book.Genres || '').trim(),
          language: (book.Language || '').trim(),
          notes: (book.Notes || '').trim(),
          location: (book.Location || '').trim(),
          requestedBy: (book.RequestedBy || book.requestedBy || '').trim(),
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
