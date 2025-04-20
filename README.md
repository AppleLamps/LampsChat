# AI Chat — Multi-Model Chat Interface with Code Preview

[Add a screenshot/GIF of the chat interface here]

## Overview

AI Chat is a powerful, modular chat interface supporting multiple AI providers (OpenAI, xAI/Grok, Google/Gemini) with real-time messaging, file handling, and live code preview capabilities. Built with vanilla JavaScript and a modular Node.js backend, it offers a clean, modern UI with advanced features like streaming responses, file uploads, and interactive code editing.

The project demonstrates a scalable, provider-based architecture that makes it easy to add new AI providers while maintaining a consistent user experience.

---

## ✨ Features

### Core Features
- **Multi-Provider Support**: OpenAI, xAI (Grok), and Google (Gemini) integration
- **Real-time Streaming**: Live message streaming with retry logic and timeout handling
- **File Handling**: Support for images, audio, and general file uploads
- **Code Preview**: Live code editor with instant preview for HTML/CSS/JavaScript
- **Voice Interaction**: Text-to-speech output and voice recording input
- **Local Storage**: Chat history and user preferences saved locally

### Technical Features
- **Pure Frontend**: Vanilla JavaScript, HTML, and CSS — no frameworks or build steps
- **Modular Backend**: Provider-based API architecture with Node.js/Express
- **Advanced UI**:
  - Syntax highlighting (Prism.js)
  - Markdown rendering (Marked)
  - Code editing (CodeMirror)
  - Sandboxed code preview
- **Robust Error Handling**:
  - Request timeouts
  - Automatic retries
  - Streaming error recovery
  - Model capability gating

---

## 🔧 Project Structure

```
E:\ai-chat\
├── frontend\
│   ├── index.html
│   ├── chat.html
│   ├── profile.html
│   ├── settings.html
│   ├── css\
│   │   └── styles.css
│   ├── js\
│   │   ├── app.js
│   │   ├── chat.js
│   │   ├── models.js
│   │   └── storage.js
│   ├── assets\
│       └── logo.svg
│
└── backend\
    ├── api\
    │   ├── index.js
    │   ├── openai\
    │   │   ├── index.js
    │   │   └── client.js
    │   ├── gemini\
    │   │   ├── index.js
    │   │   └── client.js
    │   └── xai\
    │       ├── index.js
    │       └── client.js
    ├── utils\
    │   └── stream.js
    ├── .env
    ├── package.json
    └── server.js
```

---

## 🧠 Supported Models & Capabilities

### OpenAI Models
- `chatgpt-4o-latest`: Chat with streaming and tool support
- `gpt-4.1-2025-04-14`: Advanced chat with vision capabilities
- `o4-mini-2025-04-16`: Fast reasoning-focused model
- `gpt-4o-mini-transcribe`: Audio transcription specialist

### Gemini Models
- `gemini-2.5-flash-preview-04-17`: Fast responses with file support
- `gemini-2.5-pro-preview-03-25`: Advanced thinking with file capabilities

### xAI (Grok) Models
- `grok-3-latest`: Latest chat model
- `grok-3-mini-latest`: Optimized for quick responses

Each model supports different capabilities (streaming, files, tools) which are automatically reflected in the UI.

---

## 🚀 How the Website Works

### 1. Landing Page (`index.html`)
- Simple branding and a "Start Chatting" button
- Navigates to `chat.html`

### 2. Chat Interface (`chat.html`)
- User prompted for nickname (stored locally)
- Model selector to choose OpenAI, xAI, or Gemini
- Real-time messaging via WebSocket or long-poll fallback
- Chat history is saved locally (or via lightweight SQLite backend later)

### 3. Profile Page
- Show and edit nickname
- View basic usage stats (messages sent, etc.)

### 4. Settings Page
- Choose preferred model (saved in localStorage)
- Toggle appearance settings (themes, animations, etc.)

---

## 🧩 Architecture

### Frontend Architecture
```
models.js (Provider Interface)
    ├── MODEL_MAP: Defines model capabilities
    └── callModel(): Unified API with retry/timeout
        ├── Streaming support
        ├── File upload handling
        └── Error normalization

chat.js (Core UI)
    ├── Message handling
    ├── File uploads
    └── UI state management

codePreview.js (Code Preview)
    ├── CodeMirror integration
    ├── Sandboxed preview
    └── Language-specific handling
```

### Backend Architecture
```
api/index.js (Main Router)
    ├── openai/
    │   ├── index.js: Request validation
    │   └── client.js: OpenAI API calls
    ├── gemini/
    │   ├── index.js: Request validation
    │   └── client.js: Gemini API calls
    └── xai/
        ├── index.js: Request validation
        └── client.js: xAI API calls
```

All responses are normalized to:
```json
{
  "role": "assistant",
  "content": "Response content",
  "timestamp": 1713620000000
}
```

---

## 💡 Cursor Instructions
- **Use streaming fetch where possible**
- **Keep all provider logic encapsulated**
- **Normalize all model responses into `{ role, content }` format**
- **Use localStorage for nickname and preference persistence**
- **Maintain the offwhite/grey visual theme with subtle modern UI**

---

## ✅ Setup & Deployment

### Prerequisites
- Node.js 18+ for the backend
- Modern browser (Chrome, Firefox, Safari, Edge)
- API keys for desired providers (OpenAI, Gemini, xAI)

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat.git
   cd ai-chat
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Fill in your API keys
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   ./lib/download-deps.ps1  # Downloads required libraries
   ```
   Then either:
   - Open `index.html` directly in browser
   - Use `npx http-server` or similar

### Production Deployment
- **Backend**: Deploy to Railway, Heroku, or any Node.js host
- **Frontend**: Deploy to Netlify, Vercel, or any static host
- Update `CORS_ORIGIN` in backend `.env` to match frontend URL
- Ensure all API keys are securely configured

---

## 🔐 Environment Configuration

Create a `.env` file in the backend directory:

```dotenv
# Provider API Keys
OPENAI_API_KEY=sk-xxx
OPENAI_ORG_ID=org-xxx  # Optional

GOOGLE_API_KEY=your-google-api-key

XAI_API_KEY=your-xai-key
XAI_ORG_ID=org-xxx  # Optional

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MAX_REQUEST_SIZE=50mb
```

**Security Notes:**
- Never commit `.env` to version control
- Use appropriate CORS settings in production
- Consider rate limiting for production use

---

## 📌 Future Enhancements

### Planned Features
- [ ] WebSocket support for real-time updates
- [ ] Persistent chat history with SQLite/WASM
- [ ] Light/dark theme support
- [ ] Mobile-optimized UI
- [ ] Additional model providers

### Code Quality
- [ ] Add comprehensive tests
- [ ] TypeScript migration option
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Developer Experience
- [ ] Docker deployment option
- [ ] API documentation
- [ ] Contributing guidelines
- [ ] Example provider template

---

## 📄 License

MIT License - Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.