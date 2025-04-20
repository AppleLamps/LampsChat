const express = require('express');
const router = express.Router();

// Import provider handlers
const openaiHandler = require('./openai');
const geminiHandler = require('./gemini');
const xaiHandler = require('./xai');

// Chat endpoint
router.post('/chat', (req, res) => {
  const { provider } = req.body;

  switch (provider) {
    case 'openai':
      return openaiHandler.handleRequest(req, res);
    case 'gemini':
      return geminiHandler.handleRequest(req, res);
    case 'xai':
      return xaiHandler.handleRequest(req, res);
    default:
      return res.status(400).json({ error: 'Invalid provider' });
  }
});

module.exports = router;
