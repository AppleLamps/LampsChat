const callOpenAI = require('./client');

// Supported models configuration
const SUPPORTED_MODELS = {
  'chatgpt-4o-latest': { type: 'chat', supportsTools: true },
  'gpt-4.1-2025-04-14': { type: 'chat', supportsTools: true },
  'o4-mini-2025-04-16': { type: 'reasoning' },
  'gpt-4o-mini-transcribe': { type: 'transcription' }
};

/**
 * Handle chat request for OpenAI provider
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function handleRequest(req, res) {
  try {
    const { model, messages, stream = false, tools, input, audio, detail } = req.body;

    // Validate model
    if (!SUPPORTED_MODELS[model]) {
      return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    // Set up options for the OpenAI client
    const options = {
      stream,
      tools,
      tool_choice: req.body.tool_choice,
      audio,
      detail,
      max_output_tokens: req.body.max_output_tokens
    };

    // Add response object if streaming
    if (stream) {
      options.res = res;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    // Call OpenAI with normalized parameters
    const response = await callOpenAI(
      model,
      input || messages,
      options
    );

    // For streaming responses, the client handles the response
    if (stream) return;

    // For normal responses, send the JSON response
    return res.json(response);

  } catch (error) {
    console.error('OpenAI handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

module.exports = { handleRequest };
