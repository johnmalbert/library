const { app } = require('@azure/functions');
const { getValidationRules } = require('../sheets');

app.http('getLocations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Fetching location validation rules');

    try {
      // Get sheetName from query parameters, default to 'Inventory'
      const sheetName = request.query.get('sheetName') || 'Inventory';
      
      // Location column is the 6th column (F) in the Inventory sheet
      const locations = await getValidationRules(sheetName, 'F');
      
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
