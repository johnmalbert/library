const { app } = require('@azure/functions');

// Import all function definitions
require('./functions/getBooks');
require('./functions/checkoutBook');
require('./functions/getLocations');
require('./functions/lookupBook');
require('./functions/addBook');

// Export for Azure Functions
module.exports = app;
