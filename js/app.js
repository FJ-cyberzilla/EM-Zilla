import UIManager from './ui-manager.js';
import CodeGenerator from './code-generator.js';
import FileManager from './file-manager.js';
import Examples from './examples.js';

class VitaCoderApp {
    constructor() {
        this.uiManager = new UIManager();
        this.codeGenerator = new CodeGenerator();
        this.fileManager = new FileManager();
        this.examples = new Examples();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.examples.loadExamples();
        this.uiManager.initializeUI();
    }
    
    setupEventListeners() {
        // Generate code button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateCode();
        });
        
        // Copy code button
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.fileManager.copyToClipboard();
        });
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.fileManager.exportCode();
        });
        
        // Example chips
        document.addEventListener('exampleSelected', (event) => {
            this.loadExample(event.detail);
        });
    }
    
    async generateCode() {
        const command = document.getElementById('commandInput').value.trim();
        
        if (!command) {
            this.uiManager.showNotification('Please describe what you want your Arduino to do', 'warning');
            return;
        }
        
        this.uiManager.showLoading();
        
        try {
            const code = await this.codeGenerator.generateFromCommand(command);
            this.uiManager.displayCode(code);
            this.uiManager.hideLoading();
            this.uiManager.showNotification('Code generated successfully!', 'success');
        } catch (error) {
            this.uiManager.hideLoading();
            this.uiManager.showNotification('Error generating code: ' + error.message, 'error');
        }
    }
    
    loadExample(example) {
        document.getElementById('commandInput').value = example.command;
        this.generateCode();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VitaCoderApp();
});
