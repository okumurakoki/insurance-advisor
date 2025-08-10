// Vercel serverless function entry point
const app = require('../src/app');

// Vercel requires a default export for serverless functions
module.exports = (req, res) => {
  // Handle the request with Express app
  app(req, res);
};