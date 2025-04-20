const { GoogleGenerativeAI, createPartFromUri } = require('@google/generative-ai');
const fs = require('fs');

// Initialize Gemini client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Supported models
const SUPPORTED_MODELS = [
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-pro-preview-03-25'
];

/**
 * Process file for Gemini input
 * @param {Object} file File object with path and mimeType
 * @returns {Promise<Object>} Processed file part
 */
async function processFile(file) {
  const fileSize = fs.statSync(file.path).size;
  const MAX_INLINE_SIZE = 20 * 1024 * 1024; // 20MB

  if (fileSize > MAX_INLINE_SIZE) {
    // Upload large files
    const upload = await ai.files.upload({
      file: fs.createReadStream(file.path),
      mimeType: file.mimeType
    });
    return createPartFromUri(upload.uri, upload.mimeType);
  } else {
    // Inline small files
    const data = fs.readFileSync(file.path, 'base64');
    return {
      inlineData: {
        mimeType: file.mimeType,
        data
      }
    };
  }
}

/**
 * Chat with Gemini models
 * @param {Object} params Chat parameters
 * @param {string} params.model Model name
 * @param {Array} params.messages Array of messages
 * @param {Array} [params.files=[]] Array of file objects
 * @param {Object} [params.options={}] Additional options
 * @returns {Promise<Object>} Chat response
 */
async function chat({ model, messages, files = [], options = {} }) {
  // Validate model
  if (!SUPPORTED_MODELS.includes(model)) {
    throw new Error(`Unsupported model: ${model}. Must be one of: ${SUPPORTED_MODELS.join(', ')}`);
  }

  // Build contents array
  const contents = [];

  // Process messages and files
  for (const message of messages) {
    contents.push(message.content);
  }

  // Process files if any
  if (files.length > 0) {
    const processedFiles = await Promise.all(files.map(processFile));
    contents.push(...processedFiles);
  }

  // Set up configuration
  const config = {
    thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 1024 },
    ...(options.search && { tools: [{ type: 'web_search_preview' }] }),
    ...(options.codeExec && { tools: [{ type: 'code_interpreter' }] })
  };

  // Handle streaming
  if (options.stream) {
    return ai.models.generateContentStream({ model, contents, config });
  }

  // Handle normal request
  const response = await ai.models.generateContent({ model, contents, config });

  // Return normalized response
  return {
    role: 'assistant',
    content: response.text,
    timestamp: Date.now()
  };
}

module.exports = { chat };
