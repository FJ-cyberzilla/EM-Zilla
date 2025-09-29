import IntelligenceRouter from './intelligence-router.js';
import PipelineManager from './ai-pipeline-manager.js';
import PerformanceMonitor from './ai-performance-monitor.js';
import ContextManager from './modules/ai-orchestration/context-manager.js';
import DecisionEngine from './modules/ai-orchestration/decision-engine.js';

export default class AIOrchestrator {
    constructor() {
        this.router = new IntelligenceRouter();
        this.pipeline = new PipelineManager();
        this.monitor = new PerformanceMonitor();
        this.context = new ContextManager();
        this.decisionEngine = new DecisionEngine();
        
        this.aiSystems = new Map();
        this.isInitialized = false;
        this.currentSession = null;
    }

    async initialize() {
        console.log('🚀 Initializing AI Orchestration System...');
        
        try {
            // Initialize all AI subsystems
            await this.initializeSubsystems();
            
            // Set up communication channels
            this.setupAIBus();
            
            // Start performance monitoring
            this.monitor.start();
            
            this.isInitialized = true;
            console.log('✅ AI Orchestration System Ready');
            
        } catch (error) {
            console.error('❌ AI Orchestrator initialization failed:', error);
            throw error;
        }
    }

    async initializeSubsystems() {
        const initializationTasks = [
            this.router.initialize(),
            this.pipeline.initialize(),
            this.context.initialize(),
            this.decisionEngine.initialize()
        ];

        await Promise.allSettled(initializationTasks);
    }

    setupAIBus() {
        // Create event bus for AI communication
        this.aiBus = new EventTarget();
        
        // Set up event listeners for AI coordination
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.aiBus.addEventListener('ai_task_complete', (event) => {
            this.handleTaskCompletion(event.detail);
        });

        this.aiBus.addEventListener('ai_system_error', (event) => {
            this.handleSystemError(event.detail);
        });

        this.aiBus.addEventListener('context_update', (event) => {
            this.handleContextUpdate(event.detail);
        });
    }

    async processUserRequest(userInput, context = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Start new session
        this.currentSession = this.createSession(userInput, context);
        
        console.log(`🎯 Processing user request: "${userInput.substring(0, 50)}..."`);

        try {
            // Route to appropriate intelligence handler
            const routing = await this.router.routeRequest(userInput, context);
            
            // Execute through pipeline
            const result = await this.pipeline.execute(routing);
            
            // Update context with results
            await this.context.updateSession(this.currentSession.id, result);
            
            // Learn from this interaction
            await this.learnFromInteraction(userInput, result);
            
            return result;
            
        } catch (error) {
            await this.handleProcessingError(error, userInput);
            throw error;
        }
    }

    async generateArduinoCode(description, requirements = {}) {
        const context = {
            type: 'code_generation',
            arduinoModel: requirements.arduinoModel,
            components: requirements.components || [],
            complexity: requirements.complexity || 'auto',
            optimization: requirements.optimization || true
        };

        return await this.processUserRequest(description, context);
    }

    async troubleshootCode(code, errorMessages = []) {
        const context = {
            type: 'troubleshooting',
            code: code,
            errors: errorMessages,
            urgency: 'high'
        };

        return await this.processUserRequest('Fix Arduino code issues', context);
    }

    async optimizeCode(code, target = 'performance') {
        const context = {
            type: 'optimization',
            code: code,
            target: target,
            constraints: {
                memory: true,
                speed: true,
                power: target === 'power'
            }
        };

        return await this.processUserRequest('Optimize Arduino code', context);
    }

    async detectHardware() {
        const context = {
            type: 'hardware_detection',
            methods: ['usb', 'serial', 'network'],
            priority: 'high'
        };

        return await this.processUserRequest('Detect connected Arduino hardware', context);
    }

    createSession(userInput, context) {
        return {
            id: this.generateSessionId(),
            timestamp: new Date().toISOString(),
            userInput: userInput,
            context: context,
            aiSystemsUsed: [],
            results: [],
            performance: {},
            status: 'active'
        };
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleTaskCompletion(taskResult) {
        const { sessionId, aiSystem, result, performance } = taskResult;
        
        if (sessionId === this.currentSession?.id) {
            // Update session with results
            this.currentSession.aiSystemsUsed.push(aiSystem);
            this.currentSession.results.push(result);
            this.currentSession.performance[aiSystem] = performance;
            
            // Notify decision engine for next steps
            await this.decisionEngine.processIntermediateResult(
                this.currentSession, 
                taskResult
            );
        }
    }

    async handleSystemError(errorInfo) {
        console.error('🤖 AI System Error:', errorInfo);
        
        // Implement fallback strategies
        const fallbackResult = await this.decisionEngine.triggerFallback(errorInfo);
        
        // Notify user interface
        this.aiBus.dispatchEvent(new CustomEvent('orchestrator_error', {
            detail: { error: errorInfo, fallback: fallbackResult }
        }));
    }

    async handleContextUpdate(update) {
        await this.context.processUpdate(update);
        
        // Re-route if context significantly changed
        if (update.priority === 'high') {
            await this.router.adaptRouting(this.currentSession, update);
        }
    }

    async learnFromInteraction(userInput, result) {
        const learningData = {
            input: userInput,
            result: result,
            timestamp: new Date().toISOString(),
            success: result.success,
            performance: this.monitor.getSessionMetrics(this.currentSession.id)
        };

        await this.decisionEngine.learn(learningData);
    }

    async handleProcessingError(error, userInput) {
        const errorHandling = await this.decisionEngine.handleError(error, {
            userInput: userInput,
            session: this.currentSession,
            availableSystems: this.getAvailableSystems()
        });

        return errorHandling;
    }

    getAvailableSystems() {
        return {
            tflite: this.router.tfliteAvailable,
            usb: this.router.usbAvailable,
            termux: this.router.termuxAvailable,
            codeGeneration: this.router.codeGenAvailable,
            analysis: this.router.analysisAvailable
        };
    }

    getSystemStatus() {
        return {
            orchestrator: this.isInitialized,
            router: this.router.isInitialized,
            pipeline: this.pipeline.isInitialized,
            context: this.context.isInitialized,
            decisionEngine: this.decisionEngine.isInitialized,
            performance: this.monitor.getSystemStatus()
        };
    }

    // Resource management
    async cleanup() {
        this.monitor.stop();
        await this.pipeline.cleanup();
        await this.context.cleanup();
        
        this.currentSession = null;
        console.log('🧹 AI Orchestrator cleaned up');
    }
}
