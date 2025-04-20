// Import utilities
import { callModel, MODEL_MAP, REQUEST_CONFIG } from './models.js';
import {
    getSettings,
    incrementMessageCount,
    incrementChatCount
    // Removed applyTheme, getNickname as they are global
} from './storage.js';
import { exportChat } from './export.js';
import { attachCodePreviewHandlers } from './codePreview.js';

// Import marked for markdown parsing
import { marked } from './lib/marked.esm.js';

// Only execute chat-specific code if we're on a chat page
if (document.querySelector('#chat-container')) {

// Configure marked for safe rendering
marked.setOptions({
    headerIds: false,
    mangle: false,
    headerPrefix: '',
    highlight: function(code, lang) {
        if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
    }
});

// Configure DOMPurify for safe HTML
DOMPurify.setConfig({
    ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
        'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'div', 'span', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class', 'src', 'alt', 'title'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
    SANITIZE_DOM: true
});

// DOM Elements
const prompt = document.querySelector('#prompt');
const sendButton = document.querySelector('#send');
const messagesContainer = document.querySelector('#messages');
const modelSelect = document.querySelector('#modelSelect');
const newChatBtn = document.querySelector('#newChatBtn');
const settingsBtn = document.querySelector('#settingsBtn');
const fileUploadBtn = document.querySelector('#fileUploadBtn');
const imageUploadBtn = document.querySelector('#imageUploadBtn');
const chatWrapper = document.querySelector('.chat-wrapper');

// Create microphone button if it doesn't exist
if (!document.querySelector('#micBtn')) {
    const micBtn = document.createElement('button');
    micBtn.id = 'micBtn';
    micBtn.className = 'icon-btn';
    micBtn.title = 'Record Voice';
    micBtn.textContent = '🎤';
    prompt.parentElement.insertBefore(micBtn, sendButton);
}
const micBtn = document.querySelector('#micBtn');

// Create recording status indicator
const recordingStatus = document.createElement('span');
recordingStatus.className = 'recording-status';
recordingStatus.style.display = 'none';
recordingStatus.textContent = 'Recording...';
prompt.parentElement.insertBefore(recordingStatus, sendButton);

// Create hidden file inputs
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const imageInput = document.createElement('input');
imageInput.type = 'file';
imageInput.accept = 'image/*';
imageInput.style.display = 'none';
document.body.appendChild(imageInput);

// State management
let isProcessing = false;
let isRecording = false;
let mediaRecorder = null;
let recordingTimeout = null;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

// Initialize speech synthesis
let currentUtterance = null;

// Add styles
const style = document.createElement('style');
style.textContent = `
    #micBtn {
        padding: 8px;
        margin-right: 8px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 1.2em;
    }
    #micBtn.recording {
        color: #f44336;
        animation: pulse 1s infinite;
    }
    .recording-status {
        color: #f44336;
        margin-right: 8px;
        font-size: 0.9em;
    }
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .chat-wrapper.drag-over {
        border: 2px dashed #4a90e2;
        background-color: rgba(74, 144, 226, 0.1);
    }
    .message.user .preview-container {
        margin-top: 8px;
    }
    .message.user img.preview {
        max-width: 300px;
        max-height: 200px;
        border-radius: 4px;
        display: block;
    }
    .message.user audio.preview {
        width: 100%;
        max-width: 300px;
        margin-top: 4px;
    }

    /* Markdown Styles */
    .message.bot {
        line-height: 1.6;
    }
    .message.bot p {
        margin: 0.5em 0;
    }
    .message.bot h1, .message.bot h2, .message.bot h3,
    .message.bot h4, .message.bot h5, .message.bot h6 {
        margin: 1em 0 0.5em;
        font-weight: 600;
    }
    .message.bot ul, .message.bot ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
    }
    .message.bot li {
        margin: 0.25em 0;
    }
    .message.bot pre {
        background: var(--input-bg);
        border-radius: var(--radius-m);
        padding: 1em;
        margin: 0.5em 0;
        overflow-x: auto;
    }
    .message.bot code {
        font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
        font-size: 0.9em;
    }
    .message.bot p code {
        background: var(--input-bg);
        padding: 0.2em 0.4em;
        border-radius: var(--radius-s);
    }
    .message.bot blockquote {
        border-left: 4px solid var(--border-medium);
        margin: 0.5em 0;
        padding: 0.5em 1em;
        color: var(--text-secondary);
    }
    .message.bot img {
        max-width: 100%;
        border-radius: var(--radius-m);
    }
    .message.bot a {
        color: var(--primary);
        text-decoration: none;
    }
    .message.bot a:hover {
        text-decoration: underline;
    }

    /* Action buttons */
    .message-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        opacity: 0.7;
    }
    .message-actions:hover {
        opacity: 1;
    }
    .action-btn {
        padding: 4px 8px;
        border: none;
        background: var(--input-bg);
        border-radius: var(--radius-s);
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary);
    }
    .action-btn:hover {
        background: var(--border-medium);
    }
    .action-btn.speaking {
        background: var(--primary);
        color: white;
    }
    .regenerated-message {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-light);
    }
`;
document.head.appendChild(style);

// Message regeneration
async function regenerateMessage(messageDiv) {
    if (isProcessing) return;

    const userMessage = messageDiv.textContent.replace('🔁 Regenerate', '').trim();
    const model = modelSelect.value;

    // Disable the regenerate button
    const regenBtn = messageDiv.querySelector('.regen-btn');
    regenBtn.disabled = true;
    regenBtn.style.opacity = '0.5';

    try {
        await handleModelCall(model, userMessage, null, true);
    } finally {
        regenBtn.disabled = false;
        regenBtn.style.opacity = '1';
    }
}

// Text-to-speech functionality
function speakMessage(messageDiv) {
    if (!window.speechSynthesis) {
        alert('Speech synthesis is not supported in your browser');
        return;
    }

    // Stop any ongoing speech
    if (currentUtterance) {
        window.speechSynthesis.cancel();
        const speakingBtn = document.querySelector('.tts-btn.speaking');
        if (speakingBtn) {
            speakingBtn.classList.remove('speaking');
            speakingBtn.innerHTML = '🔊 Play';
        }
    }

    const ttsBtn = messageDiv.querySelector('.tts-btn');
    const text = messageDiv.textContent.replace('🔊 Play', '').trim();

    // Create and configure the utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Update button state
    ttsBtn.classList.add('speaking');
    ttsBtn.innerHTML = '⏹️ Stop';

    // Handle speech end
    utterance.onend = () => {
        ttsBtn.classList.remove('speaking');
        ttsBtn.innerHTML = '🔊 Play';
        currentUtterance = null;
    };

    // Start speaking
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
}

/**
 * Update UI elements based on selected model capabilities
 */
function updateModelCapabilityUI(selectedModel) {
    const model = MODEL_MAP[selectedModel];
    if (!model) return;

    // Update file upload buttons
    const supportsFiles = model.supportsFiles || model.type === 'transcribe';
    fileUploadBtn.disabled = !supportsFiles;
    imageUploadBtn.disabled = !supportsFiles;
    fileUploadBtn.title = supportsFiles ? 'Upload File' : 'Not supported by this model';
    imageUploadBtn.title = supportsFiles ? 'Upload Image' : 'Not supported by this model';

    // Update voice recording button
    micBtn.disabled = model.type !== 'transcribe';
    micBtn.title = model.type === 'transcribe' ? 'Record Voice' : 'Not supported by this model';

    // Update tool-related UI elements if they exist
    const toolsContainer = document.querySelector('#toolsContainer');
    if (toolsContainer) {
        toolsContainer.style.display = model.supportsTools ? 'block' : 'none';
    }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Apply theme and settings - Theme application moved to app.js
    const settings = getSettings();
    
    // Set default model
    if (settings.defaultModel && MODEL_MAP[settings.defaultModel]) {
        modelSelect.value = settings.defaultModel;
    }

    // Update UI based on settings and model capabilities
    if (settings.enableStreaming) {
        document.body.classList.add('streaming-enabled');
    }
    updateModelCapabilityUI(modelSelect.value);

    // Initialize chat
    prompt.focus();
    updateSendButton();
    setupDragAndDrop();
    loadChatHistory();

    // Start new chat session
    incrementChatCount();

    // Listen for model changes
    modelSelect.addEventListener('change', (e) => {
        updateModelCapabilityUI(e.target.value);
    });
});

// Auto-resize textarea
prompt.addEventListener('input', () => {
    updateSendButton();
    prompt.style.height = 'auto';
    prompt.style.height = prompt.scrollHeight + 'px';
});

// Handle form submission
document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = prompt.value.trim();
    if (!message || isProcessing) return;

    await handleModelCall(modelSelect.value, message);
});

// Utility functions
function addMessage(text, role, skipHistory = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    if (role === 'bot') {
        // For bot messages, render markdown and sanitize HTML
        const rawHtml = marked(text);

        // Add TTS button for bot messages
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        const ttsBtn = document.createElement('button');
        ttsBtn.className = 'action-btn tts-btn';
        ttsBtn.innerHTML = '🔊 Play';
        ttsBtn.onclick = () => speakMessage(messageDiv);
        actions.appendChild(ttsBtn);

        // Add regenerate button for user messages
        if (isRegenerated) {
            messageDiv.classList.add('regenerated-message');
        }

        messageDiv.appendChild(actions);

        // Set the sanitized HTML content
        messageDiv.innerHTML = DOMPurify.sanitize(rawHtml);

        // Add code preview buttons
        attachCodePreviewHandlers();
    } else {
        messageDiv.textContent = text;

        // Add regenerate button for user messages
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        const regenBtn = document.createElement('button');
        regenBtn.className = 'action-btn regen-btn';
        regenBtn.innerHTML = '🔁 Regenerate';
        regenBtn.onclick = () => regenerateMessage(messageDiv);
        actions.appendChild(regenBtn);
        messageDiv.appendChild(actions);
    }

    if (isRegenerated) {
        messageDiv.classList.add('regenerated-message');
    }

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    // Save to history if not loading from history
    if (!skipHistory) {
        chatHistory.push({ role: role === 'user' ? 'user' : 'assistant', content: text });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    // Update stats
    if (!skipHistory) {
        if (role === 'user') {
            incrementMessageCount('sent');
        } else {
            incrementMessageCount('received');
        }
    }

    return messageDiv;
}

function getMessageHistory() {
    return Array.from(messagesContainer.children).map(msg => ({
        role: msg.classList.contains('user') ? 'user' : 'assistant',
        content: msg.textContent
    }));
}

function updateSendButton() {
    sendButton.disabled = !prompt.value.trim() || isProcessing;
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function clearChat() {
    messagesContainer.innerHTML = '';
    prompt.value = '';
    prompt.style.height = 'auto';
    updateSendButton();
    prompt.focus();
    chatHistory = [];
    localStorage.removeItem('chatHistory');
}

function setProcessingState(processing) {
    isProcessing = processing;
    updateSendButton();
    fileUploadBtn.disabled = processing;
    imageUploadBtn.disabled = processing;
}

function isAudioFile(file) {
    return file.type.startsWith('audio/') || 
           file.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i);
}

async function handleModelCall(model, message, file = null, isRegenerated = false) {
    setProcessingState(true);
    
    try {
        if (message) {
            addMessage(message, 'user');
            prompt.value = '';
            prompt.style.height = 'auto';
            updateSendButton();
        }

        let response;
        if (file && isAudioFile(file)) {
            // Handle audio transcription
            response = await callModel({
                model: 'gpt-4o-mini-transcribe',
                audio: file
            });
            addMessage(response.content, 'bot');
        } else {
            // Handle normal chat or file input
            const modelConfig = MODEL_MAP[model];
            const settings = getSettings();
            const stream = settings.enableStreaming && !file;

            response = await callModel({
                model,
                messages: [
                    ...getMessageHistory(),
                    message ? { role: 'user', content: message } : null
                ].filter(Boolean),
                stream,
                files: file ? [file] : undefined
            });

            if (stream) {
                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                const botMessage = addMessage('', 'bot');
                let streamError = false;

                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value, { stream: true });
                        botMessage.textContent += chunk;
                        scrollToBottom();
                    }
                } catch (streamErr) {
                    streamError = true;
                    // Add retry button
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'action-btn retry-btn';
                    retryBtn.innerHTML = '🔄 Retry';
                    retryBtn.onclick = () => regenerateMessage(botMessage);
                    
                    const actions = botMessage.querySelector('.message-actions') || 
                        document.createElement('div');
                    actions.className = 'message-actions';
                    actions.appendChild(retryBtn);
                    
                    if (!botMessage.querySelector('.message-actions')) {
                        botMessage.appendChild(actions);
                    }
                    
                    botMessage.textContent += '\n\nConnection lost. Please try again.';
                    throw new Error('Stream interrupted');
                } finally {
                    // Ensure reader is released
                    reader.releaseLock();
                }
            } else {
                // Handle non-streaming response
                addMessage(response.content, 'bot');
            }
        }
    } catch (error) {
        const errorMsg = error.message === 'Request timed out' ? 
            'The request took too long. Please try again.' :
            'Error: ' + error.message;
        addMessage(errorMsg, 'bot error');
    } finally {
        setProcessingState(false);
        scrollToBottom();
    }
}

// Wire up sidebar actions
newChatBtn.addEventListener('click', clearChat);

fileUploadBtn.addEventListener('click', () => {
    if (!isProcessing) fileInput.click();
});

imageUploadBtn.addEventListener('click', () => {
    if (!isProcessing) imageInput.click();
});

settingsBtn.addEventListener('click', () => {
    alert('Settings functionality will be implemented in a future update.');
});

// Export chat
document.querySelector('#exportBtn').addEventListener('click', () => {
    if (chatHistory.length === 0) {
        alert('No messages to export');
        return;
    }
    exportChat('markdown');
});

// Voice recording setup
let audioChunks = [];

async function setupVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioChunks = [];
            
            try {
                setProcessingState(true);
                const response = await callModel({
                    model: 'gpt-4o-mini-transcribe',
                    audio: audioBlob
                });
                addMessage(response.content, 'bot');
            } catch (error) {
                addMessage('Error transcribing audio: ' + error.message, 'bot error');
            } finally {
                setProcessingState(false);
            }
        });

        return true;
    } catch (error) {
        alert('Error accessing microphone: ' + error.message);
        return false;
    }
}

// Handle voice recording
micBtn.addEventListener('click', async () => {
    if (isProcessing) return;

    if (!mediaRecorder && !(await setupVoiceRecording())) {
        return;
    }

    if (!isRecording) {
        // Start recording
        audioChunks = [];
        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        recordingStatus.style.display = 'inline';

        // Auto-stop after 15 seconds
        recordingTimeout = setTimeout(() => {
            if (isRecording) {
                stopRecording();
            }
        }, 15000);
    } else {
        stopRecording();
    }
});

function stopRecording() {
    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    mediaRecorder.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
    recordingStatus.style.display = 'none';
}

// Chat history functions
function loadChatHistory() {
    chatHistory.forEach(msg => {
        addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot', true);
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    const dropZone = chatWrapper || messagesContainer;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    chatWrapper?.classList.add('drag-over');
}

function unhighlight(e) {
    chatWrapper?.classList.remove('drag-over');
}

async function handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file) {
        await processFile(file);
    }
}

// Handle file inputs
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await processFile(file);
        fileInput.value = ''; // Reset for future uploads
    }
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await processFile(file);
        imageInput.value = ''; // Reset for future uploads
    }
});

// File processing
async function processFile(file) {
    const model = modelSelect.value;
    
    if (!isAudioFile(file) && !MODEL_MAP[model]?.supportsFiles) {
        alert('Selected model does not support file uploads');
        return;
    }

    // Create message container with filename
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = `Uploaded: ${file.name}`;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    messageDiv.appendChild(previewContainer);

    // Add preview based on file type
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'preview';
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.onload = () => URL.revokeObjectURL(objectUrl);
        previewContainer.appendChild(img);
    } else if (isAudioFile(file)) {
        const audio = document.createElement('audio');
        audio.className = 'preview';
        audio.controls = true;
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        audio.oncanplay = () => URL.revokeObjectURL(objectUrl);
        previewContainer.appendChild(audio);
    }

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    // Process the file
    await handleModelCall(model, null, file);
}

} // End of #chat-container check
