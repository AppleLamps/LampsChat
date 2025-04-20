// Export functionality
export function exportChat(format = 'markdown') {
    const messages = document.querySelectorAll('.message');
    let content = '';
    
    // Generate markdown content
    messages.forEach(msg => {
        const role = msg.classList.contains('user') ? 'You' : 'Bot';
        const text = msg.textContent
            .replace('🔁 Regenerate', '')
            .replace('🔊 Play', '')
            .replace('⏹️ Stop', '')
            .trim();
        
        content += `**${role}:** ${text}\n\n`;
    });
    
    // Create file name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `chat-export-${timestamp}`;
    
    if (format === 'markdown') {
        // Download as markdown
        downloadFile(`${fileName}.md`, content, 'text/markdown');
    } else if (format === 'pdf') {
        // For future PDF support
        alert('PDF export will be supported in a future update');
    }
}

function downloadFile(fileName, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
