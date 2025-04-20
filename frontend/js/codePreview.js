/**
 * Code Preview module for chat.js
 * Adds live code preview functionality to code blocks
 */

// Keep track of the current CodeMirror instance
let currentEditor = null;
let originalCode = '';

/**
 * Create the modal UI if it doesn't exist
 */
function ensureModalExists() {
    if (document.getElementById('codePreviewModal')) return;

    const modal = document.createElement('div');
    modal.id = 'codePreviewModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-overlay" tabindex="-1" data-micromodal-close>
            <div class="modal-container" role="dialog" aria-modal="true">
                <header class="modal-header">
                    <h2>Code Preview</h2>
                    <div class="modal-actions">
                        <button id="runPreviewBtn" class="action-btn">▶️ Run</button>
                        <button id="resetPreviewBtn" class="action-btn">🔄 Reset</button>
                        <button class="action-btn" data-micromodal-close>✖️ Close</button>
                    </div>
                </header>
                <main class="modal-content">
                    <div id="codeEditorContainer"></div>
                    <div class="preview-container">
                        <iframe id="previewIframe"
                                sandbox="allow-scripts"
                                title="Code Preview"></iframe>
                    </div>
                </main>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .modal.is-open {
            display: flex;
        }

        .modal-container {
            background: var(--bg);
            width: 90vw;
            max-width: 1200px;
            max-height: 90vh;
            border-radius: var(--radius-l);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .modal-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-medium);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.2rem;
            color: var(--text-primary);
        }

        .modal-actions {
            display: flex;
            gap: 8px;
        }

        .modal-content {
            padding: 1rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            overflow: auto;
            height: calc(90vh - 100px);
        }

        #codeEditorContainer {
            min-height: 300px;
            border: 1px solid var(--border-medium);
            border-radius: var(--radius-m);
            overflow: hidden;
        }

        .preview-container {
            border: 1px solid var(--border-medium);
            border-radius: var(--radius-m);
            overflow: hidden;
            background: white;
        }

        #previewIframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        }

        /* CodeMirror Customization */
        .CodeMirror {
            height: 100% !important;
            font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace;
            font-size: 14px;
            line-height: 1.6;
        }
    `;
    document.head.appendChild(style);

    // Initialize MicroModal
    if (window.MicroModal) {
        MicroModal.init({
            onClose: () => {
                if (currentEditor) {
                    currentEditor.toTextArea();
                    currentEditor = null;
                }
            }
        });
    }

    // Bind event handlers
    document.getElementById('runPreviewBtn').addEventListener('click', updatePreview);
    document.getElementById('resetPreviewBtn').addEventListener('click', resetEditor);
}

/**
 * Update the preview iframe with current editor content
 */
function updatePreview() {
    if (!currentEditor) return;

    const code = currentEditor.getValue();
    const iframe = document.getElementById('previewIframe');
    
    // For HTML, inject directly
    if (currentEditor.getMode().name === 'htmlmixed') {
        iframe.srcdoc = code;
        return;
    }

    // For CSS, wrap in style tag
    if (currentEditor.getMode().name === 'css') {
        iframe.srcdoc = `
            <style>${code}</style>
            <div class="preview-content">
                <h1>CSS Preview</h1>
                <p>Your styles are applied to this content.</p>
                <button>Sample Button</button>
                <ul>
                    <li>List Item 1</li>
                    <li>List Item 2</li>
                </ul>
            </div>
        `;
        return;
    }

    // For JavaScript, provide a basic HTML structure
    if (currentEditor.getMode().name === 'javascript') {
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>JavaScript Preview</title>
            </head>
            <body>
                <div id="output"></div>
                <script>
                    // Redirect console.log to the output div
                    const output = document.getElementById('output');
                    console.log = (...args) => {
                        const line = document.createElement('pre');
                        line.textContent = args.join(' ');
                        output.appendChild(line);
                    };
                    
                    // Run the code
                    try {
                        ${code}
                    } catch (error) {
                        console.log('Error:', error.message);
                    }
                </script>
            </body>
            </html>
        `;
    }
}

/**
 * Reset editor content to original code
 */
function resetEditor() {
    if (currentEditor) {
        currentEditor.setValue(originalCode);
        updatePreview();
    }
}

/**
 * Open the preview modal with the given code
 * @param {string} code - The code to preview
 * @param {string} language - The code language
 */
function openPreview(code, language) {
    ensureModalExists();
    originalCode = code;

    // Map language to CodeMirror mode
    const modeMap = {
        'html': 'htmlmixed',
        'css': 'css',
        'javascript': 'javascript'
    };

    const mode = modeMap[language] || 'javascript';

    // Create textarea for CodeMirror
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.getElementById('codeEditorContainer').innerHTML = '';
    document.getElementById('codeEditorContainer').appendChild(textarea);

    // Initialize CodeMirror
    currentEditor = CodeMirror.fromTextArea(textarea, {
        mode: mode,
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        autofocus: true
    });

    // Open modal and update preview
    MicroModal.show('codePreviewModal');
    updatePreview();
}

/**
 * Add preview buttons to code blocks in chat messages
 */
export function attachCodePreviewHandlers() {
    // Find all code blocks in bot messages
    document.querySelectorAll('.message.bot pre code').forEach(codeBlock => {
        const language = Array.from(codeBlock.classList)
            .find(cls => cls.startsWith('language-'))
            ?.replace('language-', '');

        // Only add preview for HTML, CSS, and JavaScript
        if (!['html', 'css', 'javascript'].includes(language)) return;

        // Check if preview button already exists
        const actions = codeBlock.parentElement.querySelector('.code-actions');
        if (actions?.querySelector('.preview-btn')) return;

        // Create or get actions container
        let actionsDiv = actions || document.createElement('div');
        actionsDiv.className = 'code-actions';
        
        // Add preview button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'action-btn preview-btn';
        previewBtn.innerHTML = '👁️ Preview';
        previewBtn.onclick = () => openPreview(codeBlock.textContent, language);
        
        if (!actions) {
            actionsDiv.appendChild(previewBtn);
            codeBlock.parentElement.insertBefore(actionsDiv, codeBlock);
        } else {
            actions.appendChild(previewBtn);
        }
    });
}
