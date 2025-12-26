const { app } = require('@azure/functions');

app.http('lookupBook', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'lookupBook',
  handler: async (request, context) => {
    try {
      const isbn = request.query.get('isbn');

      if (!isbn) {
        return {
          status: 400,
          jsonBody: { error: 'ISBN is required' },
        };
      }

      // Call Google Books API
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Books API');
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Book not found' },
        };
      }

      const book = data.items[0].volumeInfo;

      // Extract and format book information
      const bookInfo = {
        isbn: isbn,
        title: book.title || '',
        authors: (book.authors || []).join(', '),
        publishers: (book.publisher || ''),
        pages: book.pageCount ? book.pageCount.toString() : '',
        genres: (book.categories || []).join(', '),
        language: book.language || '',
        cover: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
        description: book.description || '',
      };

      return {
        status: 200,
        jsonBody: bookInfo,
      };
    } catch (error) {
      context.error('Error in lookupBook:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to lookup book', details: error.message },
      };
    }
  },
});
