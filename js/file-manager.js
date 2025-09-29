export default class FileManager {
    copyToClipboard() {
        const code = document.getElementById('codeOutput').textContent;
        navigator.clipboard.writeText(code)
            .then(() => {
                this.showNotification('Code copied to clipboard!', 'success');
            })
            .catch(err => {
                this.showNotification('Failed to copy code', 'error');
            });
    }
    
    exportCode() {
        const code = document.getElementById('codeOutput').textContent;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'arduino_sketch.ino';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Code exported successfully!', 'success');
    }
    
    showNotification(message, type) {
        // Implementation for showing notifications
        console.log(`${type}: ${message}`);
    }
}
