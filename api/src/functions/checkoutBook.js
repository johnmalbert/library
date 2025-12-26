const { app } = require('@azure/functions');
const { updateLocation } = require('../sheets');

app.http('checkoutBook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'checkoutBook',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { isbn, newLocation } = body;

      if (!isbn || !newLocation) {
        return {
          status: 400,
          jsonBody: { error: 'Missing required fields: isbn, newLocation' },
        };
      }

      await updateLocation(isbn, newLocation);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        jsonBody: { success: true },
      };
    } catch (error) {
      context.log('Error in checkoutBook:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to update book location', details: error.message },
      };
    }
  },
});
