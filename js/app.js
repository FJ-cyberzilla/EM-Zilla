import UIManager from './ui-manager.js';
import CodeGenerator from './code-generator.js';
import FileManager from './file-manager.js';
import Examples from './examples.js';
import USBDetector from './usb-detector.js';
import USBStatusMonitor from './usb-status-monitor.js';
import MobileAdapter from './mobile.adapter.js';
import AIOrchestrator from '../ai-orchestrator.js';
import IntegrityVerifier from '../security/integrity-verifier.js';
import RuntimeGuard from '../security/runtime-guard.js';
import CloneProtector from '../security/clone-protector.js';

class VitaCoderApp {
    constructor() {
        this.integrityVerifier = new IntegrityVerifier();
        this.runtimeGuard = new RuntimeGuard();
        this.cloneProtector = new CloneProtector();
        this.aiOrchestrator = new AIOrchestrator();
        this.usbDetector = new USBDetector();
        this.usbMonitor = new USBStatusMonitor(this.usbDetector);
        this.uiManager = new UIManager();
        this.codeGenerator = new CodeGenerator();
        this.fileManager = new FileManager();
        this.examples = new Examples();
        this.mobileAdapter = new MobileAdapter();

        this.currentArduinoModel = null;
        this.init();
    }

    async init() {
        try {
            // 1. Verify clone authenticity
            const isOfficial = await this.cloneProtector.initialize();
            if (!isOfficial) {
                console.warn('Running in limited mode due to clone detection');
            }

            // 2. Verify file integrity
            const integrityValid = await this.integrityVerifier.initialize();
            if (!integrityValid) {
                this.showSecurityWarning('File integrity compromised');
                return;
            }

            // 3. Start runtime protection
            this.runtimeGuard.initialize();

            // 4. Initialize main application
            await this.initializeMainApp();

            // 5. Notify that app is ready
            window.dispatchEvent(new CustomEvent('vitaCoderReady'));

            console.log('✅ EM-Zilla - Secure Edition Ready');
            console.log('📊 Build Status:', this.cloneProtector.getBuildStatus());

        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showErrorScreen(error);
        }
    }

    async initializeMainApp() {
        try {
            await this.cloneProtector?.verifyFeatureAccess?.('ai_generation').catch(() => {});
            await this.aiOrchestrator.initialize();

            await this.cloneProtector?.verifyFeatureAccess?.('usb_access').catch(() => {});
            await this.usbDetector.initialize();
            this.usbMonitor.startMonitoring();

            // Setup UI and event listeners
            this.uiManager.initializeUI();
            this.setupEventListeners();
            this.initializeComponents();
            
        } catch (error) {
            if (error.message && error.message.includes('requires official build')) {
                this.showFeatureRestriction(error.message);
            } else {
                throw error;
            }
        }
    }

    initializeComponents() {
        if (this.examples && typeof this.examples.init === 'function') {
            this.examples.init();
        }
        if (this.mobileAdapter && typeof this.mobileAdapter.init === 'function') {
            this.mobileAdapter.init();
        }
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGenerateCode());
        }

        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => this.connectToArduino());
        }
    }

    async handleGenerateCode() {
        const commandInput = document.getElementById('commandInput');
        const prompt = commandInput ? commandInput.value : '';
        if (!prompt.trim()) {
            this.uiManager.showNotification('Please describe your project first', 'warning');
            return;
        }

        this.uiManager.showLoading();
        try {
            const code = await this.codeGenerator.generate(prompt);
            this.uiManager.displayCode(code);
        } catch (error) {
            this.uiManager.showNotification(`Generation failed: ${error.message}`, 'error');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    async connectToArduino() {
        this.uiManager.showNotification('Scanning for connected Arduino boards...', 'info');
        try {
            const model = await this.usbDetector.detectArduino();
            this.currentArduinoModel = model;
            this.uiManager.showNotification(`Connected to Arduino ${model}`, 'success');
        } catch (error) {
            this.uiManager.showNotification(`USB connection failed: ${error.message}`, 'error');
        }
    }

    showFeatureRestriction(message) {
        const restriction = document.createElement('div');
        restriction.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 152, 0, 0.95);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
        restriction.innerHTML = `
            <h3 style="margin-bottom: 15px;">🔒 Premium Feature</h3>
            <p style="margin-bottom: 20px;">${message}</p>
            <a href="https://github.com/FJ-cyberzilla/EM-Zilla" 
               style="display: inline-block; background: white; color: #FF9800; 
                      padding: 10px 20px; border-radius: 5px; text-decoration: none;
                      font-weight: bold;">
               Get Official Version
            </a>
        `;
        document.body.appendChild(restriction);
    }

    showSecurityWarning(message) {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: #1a1a2e;
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🚨</div>
                <h1 style="color: #ff4444; margin-bottom: 20px;">Security Alert</h1>
                <p style="margin-bottom: 30px; max-width: 500px;">${message}</p>
                <div style="background: #2a2a3a; padding: 20px; border-radius: 10px; max-width: 500px;">
                    <p>Please download the official version from:</p>
                    <a href="https://github.com/FJ-cyberzilla/EM-Zilla" 
                       style="color: #7877c6; text-decoration: underline;">
                       https://github.com/FJ-cyberzilla/EM-Zilla
                    </a>
                </div>
            </div>
        `;
    }

    showErrorScreen(error) {
        const errorMessage = (error && error.message) ? error.message : String(error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Application Error</h2>
                <p id="application-error-message"></p>
                <button onclick="location.reload()">Restart Application</button>
            </div>
        `;
        const errorMessageElement = document.getElementById('application-error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = errorMessage;
        }
    }
}

// Initialize application with error handling
async function initializeApplication() {
    try {
        window.vitaCoderApp = new VitaCoderApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        const initErrorMessage = (error && error.message) ? error.message : String(error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Critical Error</h2>
                <p>Failed to start EM-Zilla</p>
                <p><small id="critical-error-message"></small></p>
            </div>
        `;
        const criticalErrorMessageElement = document.getElementById('critical-error-message');
        if (criticalErrorMessageElement) {
            criticalErrorMessageElement.textContent = initErrorMessage;
        }
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}
