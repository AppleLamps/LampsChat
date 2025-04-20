/**
 * Configuration for request timeouts and retries
 */
const REQUEST_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 1,
  RETRY_DELAY_MS: 1000,
  RETRY_STATUS_CODES: [502, 503, 504]
};

/**
 * Map of supported models and their capabilities
 */
const MODEL_MAP = {
  // OpenAI models
  'chatgpt-4o-latest': { provider: 'openai', type: 'chat', supportsTools: true },
  'gpt-4.1-2025-04-14': { provider: 'openai', type: 'chat', supportsTools: true },
  'o4-mini-2025-04-16': { provider: 'openai', type: 'reasoning' },
  'gpt-4o-mini-transcribe': { provider: 'openai', type: 'transcribe' },

  // Gemini models
  'gemini-2.5-flash-preview-04-17': { provider: 'gemini', type: 'thinking', supportsFiles: true },
  'gemini-2.5-pro-preview-03-25': { provider: 'gemini', type: 'thinking', supportsFiles: true },

  // xAI models
  'grok-3-latest': { provider: 'xai', type: 'chat' },
  'grok-3-mini-latest': { provider: 'xai', type: 'thinking' }
};

/**
 * Sleep for a specified duration
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make a fetch request with timeout
 * @param {string} url Request URL
 * @param {Object} options Fetch options
 * @param {number} timeoutMs Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Make a fetch request with retries
 * @param {string} url Request URL
 * @param {Object} options Fetch options
 * @param {number} maxRetries Maximum number of retries
 * @param {number} retryDelay Delay between retries in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options, maxRetries = 1, retryDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, REQUEST_CONFIG.TIMEOUT_MS);
      
      // Only retry on network errors or specific status codes
      if (!response.ok && !REQUEST_CONFIG.RETRY_STATUS_CODES.includes(response.status)) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        // Use exponential backoff
        const backoffDelay = retryDelay * Math.pow(2, attempt);
        await sleep(backoffDelay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Call a model with the given parameters
 * @param {Object} params Request parameters
 * @param {string} params.model Model identifier
 * @param {Array} params.messages Array of chat messages
 * @param {boolean} [params.stream=false] Whether to stream the response
 * @param {Array} [params.files=[]] Array of files to process
 * @param {Array} [params.input=null] Structured input (for vision)
 * @param {Object} [params.audio=null] Audio input for transcription
 * @param {Array} [params.tools=null] Tools configuration
 * @param {string|Object} [params.tool_choice=null] Tool choice configuration
 * @param {boolean} [params.reasoning=false] Whether to use reasoning mode
 * @param {number} [params.budget=null] Thinking budget
 * @param {string} [params.detail=null] Detail level
 * @returns {Promise<Object|ReadableStream>} Response data or stream
 */
async function callModel(params) {
  const {
    model,
    messages = [],
    stream = false,
    files = [],
    input = null,
    audio = null,
    tools = null,
    tool_choice = null,
    reasoning = false,
    budget = null,
    detail = null
  } = params;

  // Get model configuration
  const modelConfig = MODEL_MAP[model];
  if (!modelConfig) {
    throw new Error(`Invalid model: ${model}`);
  }

  // Build request payload
  const payload = {
    provider: modelConfig.provider,
    model,
    messages,
    stream,
    options: {}
  };

  // Add optional parameters if present
  if (files?.length) payload.files = files;
  if (input) payload.input = input;
  if (audio) payload.audio = audio;
  if (tools) {
    payload.tools = tools;
    payload.tool_choice = tool_choice || 'auto';
  }
  if (reasoning) payload.options.reasoning = reasoning;
  if (budget) payload.options.budget = budget;
  if (detail) payload.options.detail = detail;

  try {
    // Make API request with timeout and retry
    const response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, REQUEST_CONFIG.MAX_RETRIES, REQUEST_CONFIG.RETRY_DELAY_MS);

    // Return raw response for streaming
    if (stream) {
      return response;
    }

    // Parse and return result for normal requests
    const data = await response.json();
    return data.result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export { MODEL_MAP, callModel, REQUEST_CONFIG };
