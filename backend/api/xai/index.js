const { chat } = require('./client');

/**
 * Handle chat request for xAI provider
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function handleRequest(req, res, next) {
  try {
    const { model, messages, options = {} } = req.body;

    // Call xAI client
    const result = await chat({
      model,
      messages,
      options,
      res: options.stream ? res : null
    });

    // If streaming, response is handled inside client.js
    if (!options.stream) {
      res.json({
        success: true,
        result
      });
    }
  } catch (error) {
    console.error('xAI handler error:', error);
    const status = error.message.includes('Unsupported Grok model') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { handleRequest };
