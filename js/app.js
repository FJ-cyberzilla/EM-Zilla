import UIManager from './ui-manager.js';
import CodeGenerator from './code-generator.js';
import FileManager from './file-manager.js';
import Examples from './examples.js';
import USBDetector from './usb-detector.js';
import TermuxBridge from './termux-bridge.js';
import MobileAdapter from './mobile-adapter.js';
import RealTimeCompiler from '../modules/real-time-compiler.js';
import CodeOptimizer from '../modules/code-optimizer.js';
import MLCodeAnalyzer from '../modules/ml-code-analyzer.js';
import SmartSuggestions from '../modules/smart-suggestions.js';
import AIOrchestrator from '../ai-orchestrator.js';
// ... 

class VitaCoderApp {
    constructor() {
        // ... existing initializations
        this.aiOrchestrator = new AIOrchestrator();
        
        this.init();
    }
    
    async init() {
        // ... existing initialization
        await this.initializeAIOrchestration();
    }
    
    async initializeAIOrchestration() {
        try {
            await this.aiOrchestrator.initialize();
            
            // Set up AI event listeners
            this.setupAIEventListeners();
            
            console.log('🎯 AI Orchestration System Ready');
            
        } catch (error) {
            console.warn('⚠️ AI Orchestration not available:', error);
        }
    }
    
    setupAIEventListeners() {
        // Listen for AI system events
        this.aiOrchestrator.aiBus.addEventListener('orchestrator_error', (event) => {
            this.handleAIError(event.detail);
        });
        
        this.aiOrchestrator.aiBus.addEventListener('ai_progress', (event) => {
            this.updateAIProgress(event.detail);
        });
    }
    
    async generateCodeWithAI(description, requirements = {}) {
        this.uiManager.showAILoading('AI is generating your code...');
        
        try {
            const result = await this.aiOrchestrator.generateArduinoCode(description, requirements);
            
            this.uiManager.displayAICodeResult(result);
            this.uiManager.hideAILoading();
            
        } catch (error) {
            this.uiManager.hideAILoading();
            this.uiManager.showAIError(error);
        }
    }
    
    async detectHardwareWithAI() {
        this.uiManager.showAILoading('AI is detecting hardware...');
        
        try {
            const result = await this.aiOrchestrator.detectHardware();
            
            this.uiManager.displayHardwareDetection(result);
            this.uiManager.hideAILoading();
            
        } catch (error) {
            this.uiManager.hideAILoading();
            this.uiManager.showAIError(error);
        }
    }
    
    async troubleshootWithAI(code, errors = []) {
        this.uiManager.showAILoading('AI is analyzing your code...');
        
        try {
            const result = await this.aiOrchestrator.troubleshootCode(code, errors);
            
            this.uiManager.displayTroubleshootingResult(result);
            this.uiManager.hideAILoading();
            
        } catch (error) {
            this.uiManager.hideAILoading();
            this.uiManager.showAIError(error);
        }
    }
    
    async optimizeWithAI(code, target = 'performance') {
        this.uiManager.showAILoading('AI is optimizing your code...');
        
        try {
            const result = await this.aiOrchestrator.optimizeCode(code, target);
            
            this.uiManager.displayOptimizationResult(result);
            this.uiManager.hideAILoading();
            
        } catch (error) {
            this.uiManager.hideAILoading();
            this.uiManager.showAIError(error);
        }
    }
    
    handleAIError(errorInfo) {
        console.error('🤖 AI System Error:', errorInfo);
        
        // Show user-friendly error message
        this.uiManager.showNotification(
            `AI system issue: ${errorInfo.error.message}. Using fallback approach.`,
            'warning'
        );
    }
    
    updateAIProgress(progress) {
        this.uiManager.updateAIProgress(progress);
    }
    
    getAIStatus() {
        return this.aiOrchestrator.getSystemStatus();
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.vitaCoderApp = new VitaCoderApp();
});
class VitaCoderApp {
    constructor() {
        // ... existing initializations
        this.mlAnalyzer = new MLCodeAnalyzer();
        this.smartSuggestions = new SmartSuggestions();
        
        this.init();
    }
    
    async init() {
        // ... existing initialization
        await this.initializeML();
    }
    
    async initializeML() {
        try {
            await this.mlAnalyzer.initialize();
            console.log('✅ ML features initialized');
        } catch (error) {
            console.warn('⚠️ ML features not available:', error);
        }
    }
    
    async generateCode() {
        // ... 
        
        // Enhanced with ML analysis
        if (this.mlAnalyzer.initialized) {
            const mlAnalysis = await this.mlAnalyzer.analyzeCode(code);
            this.uiManager.displayMLAnalysis(mlAnalysis);
        }
    }
    
    async getSmartSuggestions() {
        const code = document.getElementById('commandInput').value;
        const cursorPos = this.getCursorPosition();
        
        const suggestions = await this.smartSuggestions.getCodeSuggestions(
            code, 
            cursorPos,
            { arduinoModel: this.currentArduinoModel }
        );
        
        this.uiManager.displaySmartSuggestions(suggestions);
    }
}
class VitaCoderApp {
    constructor() {
        this.uiManager = new UIManager();
        this.codeGenerator = new CodeGenerator();
        this.fileManager = new FileManager();
        this.examples = new Examples();
        this.usbDetector = new USBDetector();
        this.termuxBridge = new TermuxBridge();
        this.mobileAdapter = new MobileAdapter();
        this.compiler = new RealTimeCompiler();
        this.optimizer = new CodeOptimizer();
        
        this.currentArduinoModel = null;
        this.isConnected = false;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.checkUSBSupport();
        this.examples.loadExamples();
        this.uiManager.initializeUI();
        
        // Start with demo code
        this.showCyberzillaDemo();
    }
    
    async checkUSBSupport() {
        const usbSupported = await this.usbDetector.checkSupport();
        this.uiManager.updateUSBStatus(usbSupported);
        
        if (this.mobileAdapter.isTermux) {
            this.uiManager.showTermuxMode();
        }
    }
    
    async detectArduino() {
        try {
            this.uiManager.showLoading('Detecting Arduino...');
            const model = await this.usbDetector.detectArduino();
            this.currentArduinoModel = model;
            this.isConnected = true;
            
            this.uiManager.updateArduinoModel(model);
            this.uiManager.showNotification(`Arduino ${model.toUpperCase()} detected!`, 'success');
            
        } catch (error) {
            this.uiManager.showNotification('Arduino detection failed: ' + error.message, 'error');
        } finally {
            this.uiManager.hideLoading();
        }
    }
    
    async generateCode() {
        const command = document.getElementById('commandInput').value.trim();
        const optimize = document.getElementById('optimizeCode').checked;
        const checkErrors = document.getElementById('errorChecking').checked;
        
        if (!command) {
            this.uiManager.showNotification('Please describe your project', 'warning');
            return;
        }
        
        this.uiManager.showLoading('Generating optimized code...');
        
        try {
            let code = await this.codeGenerator.generateFromCommand(command, this.currentArduinoModel);
            
            // Apply optimizations if requested
            if (optimize) {
                const optimized = this.optimizer.optimize(code, 'medium');
                code = optimized.code;
                this.uiManager.showOptimizationStats(optimized);
            }
            
            // Real-time compilation check
            if (checkErrors) {
                const compileResult = await this.compiler.compileCode(code);
                this.uiManager.displayCompilationResult(compileResult);
            }
            
            this.uiManager.displayCode(code);
            this.uiManager.hideLoading();
            
        } catch (error) {
            this.uiManager.hideLoading();
            this.uiManager.showNotification('Error: ' + error.message, 'error');
        }
    }
    
    async uploadToArduino() {
        if (!this.isConnected) {
            this.uiManager.showNotification('Please connect Arduino first', 'warning');
            return;
        }
        
        const code = document.getElementById('codeOutput').textContent;
        
        try {
            this.uiManager.showLoading('Uploading to Arduino...');
            
            if (this.mobileAdapter.isTermux) {
                await this.termuxBridge.flashArduino(code, this.currentPort);
            } else {
                await this.usbDetector.sendCodeToArduino(code);
            }
            
            this.uiManager.showNotification('Code uploaded successfully!', 'success');
            
        } catch (error) {
            this.uiManager.showNotification('Upload failed: ' + error.message, 'error');
        } finally {
            this.uiManager.hideLoading();
        }
    }`
    
    showCyberzillaDemo() {
        const demoCode = `// Cyberzilla™ Presents - VitaCoder Pro Demo
// Advanced Arduino IDE with AI-Powered Code Generation

#include <LiquidCrystal.h>

// Initialize LCD
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  // Start serial communication
  Serial.begin(9600);
  
  // Initialize LCD
  lcd.begin(16, 2);
  
  // Display welcome message
  lcd.setCursor(0, 0);
  lcd.print("Cyberzilla™");
  lcd.setCursor(0, 1);
  lcd.print("VitaCoder Pro");
  
  Serial.println("VitaCoder Pro - Ready!");
  delay(2000);
  lcd.clear();
}

void loop() {
  // Demo functionality
  displayWelcome();
  delay(3000);
  displayStats();
  delay(3000);
}

void displayWelcome() {
  lcd.setCursor(0, 0);
  lcd.print("AI-Powered IDE");
  lcd.setCursor(0, 1);
  lcd.print("Code Generation");
}

void displayStats() {
  lcd.setCursor(0, 0);
  lcd.print("Lines: 42");
  lcd.setCursor(0, 1);
  lcd.print("Errors: 0");
};

        this.uiManager.displayCode(demoCode);
    }
});

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new VitaCoderApp();
});

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 New Service Worker found:', newWorker);
            });
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }
}

// Initialize PWA features
function initializePWA() {
    registerServiceWorker();
    
    // Add beforeinstallprompt event handler
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or notification
        showInstallPrompt();
    });
}

function showInstallPrompt() {
    // Implementation for showing install prompt
    console.log('📱 App can be installed');
}
