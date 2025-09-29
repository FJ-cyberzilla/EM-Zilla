import TFLiteIntegration from './modules/tflite-integration.js';
import USBDetector from './js/usb-detector.js';
import TermuxBridge from './js/termux-bridge.js';
import MLCodeAnalyzer from './modules/ml-code-analyzer.js';

export default class IntelligenceRouter {
    constructor() {
        this.tflite = new TFLiteIntegration();
        this.usbDetector = new USBDetector();
        this.termuxBridge = new TermuxBridge();
        this.mlAnalyzer = new MLCodeAnalyzer();
        
        this.availableSystems = new Set();
        this.routingRules = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🛣️ Initializing Intelligence Router...');
        
        // Check system availability
        await this.checkSystemAvailability();
        
        // Load routing rules
        await this.loadRoutingRules();
        
        this.isInitialized = true;
        console.log('✅ Intelligence Router Ready');
    }

    async checkSystemAvailability() {
        const availabilityChecks = [
            this.checkTFLite(),
            this.checkUSB(),
            this.checkTermux(),
            this.checkMLAnalyzer()
        ];

        const results = await Promise.allSettled(availabilityChecks);
        
        this.tfliteAvailable = results[0].status === 'fulfilled';
        this.usbAvailable = results[1].status === 'fulfilled';
        this.termuxAvailable = results[2].status === 'fulfilled';
        this.mlAnalyzerAvailable = results[3].status === 'fulfilled';
        this.codeGenAvailable = true; // Always available as fallback
        this.analysisAvailable = this.mlAnalyzerAvailable || true; // Fallback available

        console.log('📊 System Availability:', {
            tflite: this.tfliteAvailable,
            usb: this.usbAvailable,
            termux: this.termuxAvailable,
            mlAnalyzer: this.mlAnalyzerAvailable
        });
    }

    async checkTFLite() {
        try {
            await this.tflite.initialize();
            this.availableSystems.add('tflite');
            return true;
        } catch (error) {
            console.warn('⚠️ TFLite not available:', error.message);
            return false;
        }
    }

    async checkUSB() {
        try {
            const supported = await this.usbDetector.checkSupport();
            if (supported) {
                this.availableSystems.add('usb');
            }
            return supported;
        } catch (error) {
            console.warn('⚠️ USB detection not available:', error.message);
            return false;
        }
    }

    async checkTermux() {
        try {
            const isTermux = await this.termuxBridge.detectTermux();
            if (isTermux) {
                this.availableSystems.add('termux');
            }
            return isTermux;
        } catch (error) {
            console.warn('⚠️ Termux not available:', error.message);
            return false;
        }
    }

    async checkMLAnalyzer() {
        try {
            await this.mlAnalyzer.initialize();
            this.availableSystems.add('ml_analyzer');
            return true;
        } catch (error) {
            console.warn('⚠️ ML Analyzer not available:', error.message);
            return false;
        }
    }

    async loadRoutingRules() {
        // Define intelligent routing rules
        this.routingRules.set('code_generation', this.getCodeGenerationRoute());
        this.routingRules.set('hardware_detection', this.getHardwareDetectionRoute());
        this.routingRules.set('troubleshooting', this.getTroubleshootingRoute());
        this.routingRules.set('optimization', this.getOptimizationRoute());
        this.routingRules.set('analysis', this.getAnalysisRoute());
    }

    async routeRequest(userInput, context) {
        const requestType = this.classifyRequest(userInput, context);
        const route = this.routingRules.get(requestType) || this.getFallbackRoute();
        
        // Enhance route with current system status
        const enhancedRoute = this.enhanceRoute(route, context);
        
        console.log(`🛣️ Routing to: ${enhancedRoute.primarySystem} for ${requestType}`);
        
        return {
            type: requestType,
            route: enhancedRoute,
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    classifyRequest(userInput, context) {
        const input = userInput.toLowerCase();
        
        // Code generation patterns
        if (input.includes('create') || input.includes('generate') || input.includes('make') || 
            input.includes('code for') || input.includes('how to')) {
            return 'code_generation';
        }
        
        // Hardware detection
        if (input.includes('detect') || input.includes('connect') || input.includes('find') ||
            input.includes('arduino') || input.includes('board')) {
            return 'hardware_detection';
        }
        
        // Troubleshooting
        if (input.includes('error') || input.includes('fix') || input.includes('problem') ||
            input.includes('not working') || input.includes('help with')) {
            return 'troubleshooting';
        }
        
        // Optimization
        if (input.includes('optimize') || input.includes('improve') || input.includes('better') ||
            input.includes('faster') || input.includes('smaller')) {
            return 'optimization';
        }
        
        // Analysis
        if (input.includes('analyze') || input.includes('check') || input.includes('review') ||
            input.includes('what\'s wrong') || input.includes('examine')) {
            return 'analysis';
        }
        
        return context.type || 'code_generation';
    }

    getCodeGenerationRoute() {
        return {
            primarySystem: this.tfliteAvailable ? 'tflite_code_gen' : 'ai_code_gen',
            fallbackSystems: ['ai_code_gen', 'template_based'],
            requirements: ['code_quality', 'correctness', 'efficiency'],
            priority: 'high',
            timeout: 30000
        };
    }

    getHardwareDetectionRoute() {
        const systems = [];
        
        if (this.usbAvailable) systems.push('usb_detection');
        if (this.termuxAvailable) systems.push('termux_detection');
        systems.push('manual_selection'); // Always available
        
        return {
            primarySystem: systems[0],
            fallbackSystems: systems.slice(1),
            requirements: ['accuracy', 'speed'],
            priority: 'medium',
            timeout: 15000
        };
    }

    getTroubleshootingRoute() {
        const systems = [];
        
        if (this.tfliteAvailable) systems.push('tflite_analysis');
        if (this.mlAnalyzerAvailable) systems.push('ml_analyzer');
        systems.push('rule_based'); // Always available
        
        return {
            primarySystem: systems[0],
            fallbackSystems: systems.slice(1),
            requirements: ['accuracy', 'detailed_explanations'],
            priority: 'high',
            timeout: 25000
        };
    }

    getOptimizationRoute() {
        return {
            primarySystem: this.tfliteAvailable ? 'tflite_optimization' : 'rule_optimization',
            fallbackSystems: ['rule_optimization', 'basic_optimization'],
            requirements: ['performance', 'memory', 'readability'],
            priority: 'medium',
            timeout: 20000
        };
    }

    getAnalysisRoute() {
        const systems = [];
        
        if (this.tfliteAvailable) systems.push('tflite_analysis');
        if (this.mlAnalyzerAvailable) systems.push('ml_analyzer');
        systems.push('basic_analysis');
        
        return {
            primarySystem: systems[0],
            fallbackSystems: systems.slice(1),
            requirements: ['comprehensive', 'insights'],
            priority: 'medium',
            timeout: 15000
        };
    }

    getFallbackRoute() {
        return {
            primarySystem: 'ai_code_gen',
            fallbackSystems: ['template_based'],
            requirements: ['basic_functionality'],
            priority: 'low',
            timeout: 10000
        };
    }

    enhanceRoute(route, context) {
        const enhanced = { ...route };
        
        // Add context-specific enhancements
        if (context.arduinoModel) {
            enhanced.requirements.push('model_specific');
        }
        
        if (context.urgency === 'high') {
            enhanced.priority = 'high';
            enhanced.timeout = Math.min(enhanced.timeout, 10000);
        }
        
        // Adjust based on available systems
        if (!this.isSystemAvailable(enhanced.primarySystem)) {
            enhanced.primarySystem = enhanced.fallbackSystems[0];
            enhanced.fallbackSystems = enhanced.fallbackSystems.slice(1);
        }
        
        return enhanced;
    }

    isSystemAvailable(systemName) {
        const systemMap = {
            'tflite_code_gen': this.tfliteAvailable,
            'tflite_analysis': this.tfliteAvailable,
            'tflite_optimization': this.tfliteAvailable,
            'usb_detection': this.usbAvailable,
            'termux_detection': this.termuxAvailable,
            'ml_analyzer': this.mlAnalyzerAvailable,
            'ai_code_gen': true, // Always available
            'rule_based': true,
            'template_based': true,
            'basic_analysis': true,
            'manual_selection': true
        };
        
        return systemMap[systemName] || false;
    }

    async adaptRouting(session, contextUpdate) {
        // Re-route based on new context
        const newRoute = await this.routeRequest(session.userInput, {
            ...session.context,
            ...contextUpdate
        });
        
        return newRoute;
    }

    getSystemCapabilities() {
        return {
            tflite: {
                available: this.tfliteAvailable,
                capabilities: ['code_generation', 'analysis', 'optimization', 'pattern_detection']
            },
            usb: {
                available: this.usbAvailable,
                capabilities: ['hardware_detection', 'serial_communication']
            },
            termux: {
                available: this.termuxAvailable,
                capabilities: ['hardware_detection', 'android_integration']
            },
            ml_analyzer: {
                available: this.mlAnalyzerAvailable,
                capabilities: ['code_analysis', 'complexity_scoring', 'suggestions']
            }
        };
    }
}
