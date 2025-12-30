const { app } = require('@azure/functions');
const { addBook } = require('../sheets');

app.http('addBook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'addBook',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { isbn, cover, title, authors, readingLevel, location, publishers, pages, genres, language, notes } = body;

      // Require title, authors, and location for manual entries
      if (!title || !authors || !location) {
        return {
          status: 400,
          jsonBody: { error: 'Title, Author, and Location are required fields' },
        };
      }

      await addBook({
        isbn,
        cover,
        title,
        authors,
        readingLevel,
        location,
        publishers,
        pages,
        genres,
        language,
        notes,
      });

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: { success: true },
      };
    } catch (error) {
      context.log('Error in addBook:', error);
      return {
        status: error.message.includes('already exists') ? 409 : 500,
        jsonBody: { error: error.message || 'Failed to add book' },
      };
    }
  },
});
