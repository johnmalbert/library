const { app } = require('@azure/functions');
const { getValidationRules } = require('../sheets');

app.http('getLocations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Fetching location validation rules');

    try {
      // Location column is the 6th column (F) in the Inventory sheet
      const locations = await getValidationRules('Inventory', 'F');
      
      return {
        status: 200,
        jsonBody: locations,
      };
    } catch (error) {
      context.error('Error fetching locations:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch location options' },
      };
    }
  },
});
