const { chat } = require('./client');

/**
 * Handle streaming response from Gemini
 * @param {Object} stream Gemini content stream
 * @param {import('express').Response} res Express response object
 */
async function handleStream(stream, res) {
  try {
    for await (const chunk of stream) {
      res.write(JSON.stringify({ delta: chunk.text }));
    }
    res.write('[DONE]');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(JSON.stringify({ error: error.message }));
    res.end();
  }
}

/**
 * Handle chat request for Gemini provider
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function handleRequest(req, res) {
  try {
    const { model, messages, stream = false, files = [] } = req.body;

    // Set up options
    const options = {
      stream,
      search: req.body.search,
      codeExec: req.body.codeExec,
      thinkingBudget: req.body.thinkingBudget
    };

    // Set up streaming headers if needed
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    // Call Gemini API
    const result = await chat({
      model,
      messages,
      files,
      options
    });

    // Handle streaming response
    if (stream) {
      return handleStream(result, res);
    }

    // Return normal response
    return res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Gemini handler error:', error);
    const status = error.message.includes('Unsupported model') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { handleRequest };
