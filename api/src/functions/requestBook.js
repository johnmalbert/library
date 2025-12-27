const { app } = require('@azure/functions');
const { requestBook: requestBookSheet } = require('../sheets');

app.http('requestBook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'requestBook',
  handler: async (request, context) => {
    context.log('Request book function triggered');

    try {
      const body = await request.json();
      const { isbn, requestedBy } = body;

      if (!isbn || !requestedBy) {
        return {
          status: 400,
          jsonBody: { error: 'ISBN and requestedBy are required' },
        };
      }

      await requestBookSheet(isbn, requestedBy);

      return {
        status: 200,
        jsonBody: { message: 'Book requested successfully' },
      };
    } catch (error) {
      context.log('Error requesting book:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});
