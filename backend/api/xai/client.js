const fetch = require('node-fetch');

// Supported models
const SUPPORTED_MODELS = [
  'grok-3-latest',
  'grok-3-mini-latest'
];

// API configuration
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

/**
 * Chat with Grok models
 * @param {Object} params Chat parameters
 * @param {string} params.model Model name
 * @param {Array} params.messages Array of messages
 * @param {Object} [params.options={}] Additional options
 * @param {Object} [params.res=null] Express response object for streaming
 * @returns {Promise<Object>} Chat response
 */
async function chat({ model, messages, options = {}, res = null }) {
  // Validate model
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(`Unsupported Grok model. Must be one of: ${SUPPORTED_MODELS.join(', ')}`);
  }

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`
  };

  // Build request body
  const body = {
    model,
    messages,
    stream: options.stream === true
  };

  // Add reasoning_effort for grok-3-mini-latest
  if (model === 'grok-3-mini-latest') {
    body.reasoning_effort = options.reasoningEffort || 'high';
  }

  // Make API request
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  // Handle errors
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get response from Grok API');
  }

  // Handle streaming response
  if (options.stream && res && response.body) {
    res.setHeader('Content-Type', 'text/event-stream');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        res.write(chunk);
      }
      res.write('[DONE]');
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(JSON.stringify({ error: error.message }));
    } finally {
      res.end();
    }
    return;
  }

  // Handle normal response
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    role: 'assistant',
    content,
    timestamp: Date.now()
  };
}

module.exports = { chat };
