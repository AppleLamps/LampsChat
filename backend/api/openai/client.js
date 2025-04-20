const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Structure input for vision models
 * @param {Array} input Array of messages potentially containing image inputs
 * @param {Object} options Configuration options
 * @returns {Array} Properly structured input for the API
 */
function structureVisionInput(input, options) {
  return input.map(msg => {
    if (!Array.isArray(msg.content)) return msg;

    return {
      role: msg.role,
      content: msg.content.map(item => {
        if (item.type === 'input_text') {
          return { type: 'text', text: item.text };
        }
        if (item.type === 'input_image') {
          return {
            type: 'image_url',
            url: item.image_url,
            detail: options.detail || 'auto'
          };
        }
        return item;
      })
    };
  });
}

/**
 * Handle streaming response
 * @param {Object} stream OpenAI response stream
 * @param {Object} res Express response object
 */
async function handleStream(stream, res) {
  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      res.write(JSON.stringify({ delta, done: false }));
    }
    res.write(JSON.stringify({ done: true }));
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(JSON.stringify({ error: error.message, done: true }));
    res.end();
  }
}

/**
 * Call OpenAI API with various model types and input formats
 * @param {string} model OpenAI model identifier
 * @param {Array} input Array of messages or content
 * @param {Object} options Configuration options
 * @returns {Promise<Object>} Normalized response
 */
async function callOpenAI(model, input, options = {}) {
  try {
    // Handle audio transcription
    if (model === 'gpt-4o-mini-transcribe') {
      if (!options.audio) {
        throw new Error('Audio input is required for transcription');
      }

      const transcription = await openai.audio.transcriptions.create({
        file: options.audio,
        model: model
      });

      return {
        role: 'assistant',
        content: transcription.text,
        timestamp: Date.now()
      };
    }

    // Handle reasoning model
    if (model === 'o4-mini-2025-04-16') {
      const response = await openai.responses.create({
        model,
        input,
        reasoning: { effort: 'medium' },
        max_output_tokens: options.max_output_tokens
      });

      return {
        role: 'assistant',
        content: response.output,
        timestamp: Date.now(),
        reasoning_cost: response.reasoning_cost
      };
    }

    // Handle chat and vision models
    const payload = {
      model,
      messages: input.some(msg => msg.content?.some?.(item => item.type === 'input_image'))
        ? structureVisionInput(input, options)
        : input,
      stream: options.stream || false
    };

    // Add tool support if requested
    if (options.tools) {
      payload.tools = options.tools;
      payload.tool_choice = options.tool_choice || 'auto';
    }

    const response = await openai.chat.completions.create(payload);

    // Handle streaming response
    if (options.stream && options.res) {
      return handleStream(response, options.res);
    }

    // Return normalized response
    return {
      role: 'assistant',
      content: response.choices[0].message.content,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

module.exports = callOpenAI;
