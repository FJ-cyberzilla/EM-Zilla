import SyntaxHighlighter from '../modules/syntax-highlighter.js';

export default class UIManager {
    constructor() {
        this.syntaxHighlighter = new SyntaxHighlighter();
    }
    
    initializeUI() {
        this.createStatusBar();
        this.createActionButtons();
        this.createDPadControls();
    }
    
    createStatusBar() {
        const statusBar = document.getElementById('statusBar');
        statusBar.innerHTML = `
            <div class="status-item">
                <i class="fas fa-bolt"></i>
                <span>AI Ready</span>
            </div>
            <div class="status-item">
                <i class="fas fa-wifi"></i>
                <span>Online</span>
            </div>
            <div class="status-item">
                <i class="fas fa-battery-three-quarters"></i>
                <span>85%</span>
            </div>
        `;
    }
    
    createActionButtons() {
        const primaryActions = document.getElementById('primaryActions');
        const secondaryActions = document.getElementById('secondaryActions');
        
        primaryActions.innerHTML = `
            <button class="vita-button primary" id="generateBtn">
                <i class="fas fa-robot"></i>
                <span>Generate Code</span>
            </button>
            <button class="vita-button secondary" id="copyBtn">
                <i class="fas fa-copy"></i>
                <span>Copy Code</span>
            </button>
            <button class="vita-button secondary" id="exportBtn">
                <i class="fas fa-download"></i>
                <span>Export</span>
            </button>
        `;
        
        secondaryActions.innerHTML = `
            <button class="vita-button secondary" id="historyBtn">
                <i class="fas fa-history"></i>
                <span>History</span>
            </button>
            <button class="vita-button secondary" id="settingsBtn">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </button>
        `;
    }
    
    createDPadControls() {
        const dpad = document.getElementById('dpadControls');
        dpad.innerHTML = `
            <div class="dpad-row">
                <div class="dpad-button"></div>
                <div class="dpad-button"><i class="fas fa-chevron-up"></i></div>
                <div class="dpad-button"></div>
            </div>
            <div class="dpad-row">
                <div class="dpad-button"><i class="fas fa-chevron-left"></i></div>
                <div class="dpad-button"></div>
                <div class="dpad-button"><i class="fas fa-chevron-right"></i></div>
            </div>
            <div class="dpad-row">
                <div class="dpad-button"></div>
                <div class="dpad-button"><i class="fas fa-chevron-down"></i></div>
                <div class="dpad-button"></div>
            </div>
        `;
    }
    
    showLoading() {
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('codeOutput').style.opacity = '0.5';
    }
    
    hideLoading() {
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('codeOutput').style.opacity = '1';
    }
    
    displayCode(code) {
        const codeOutput = document.getElementById('codeOutput');
        const formattedCode = this.syntaxHighlighter.highlight(code);
        codeOutput.innerHTML = formattedCode;
    }
    
    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
