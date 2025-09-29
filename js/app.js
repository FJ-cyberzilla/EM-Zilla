import UIManager from './ui-manager.js';
import CodeGenerator from './code-generator.js';
import FileManager from './file-manager.js';
import Examples from './examples.js';
import USBDetector from './usb-detector.js';
import TermuxBridge from './termux-bridge.js';
import MobileAdapter from './mobile-adapter.js';
import RealTimeCompiler from '../modules/real-time-compiler.js';
import CodeOptimizer from '../modules/code-optimizer.js';

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
    }
    
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
}`;

        this.uiManager.displayCode(demoCode);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new VitaCoderApp();
});
