import TFLiteIntegration from './tflite-integration.js';
import AICache from './ai_orchestration/ai-cache.js';

export default class MLCodeAnalyzer {
    constructor() {
        this.tflite = new TFLiteIntegration();
        this.cache = new AICache(150, 60 * 60 * 1000); // 150 items, 1 hour TTL
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.tflite.initialize();
            this.initialized = true;
        }
    }

    async analyzeCode(code) {
        await this.initialize();

        const cached = this.cache.get('ml_analysis', code);
        if (cached) {
            return { ...cached, cached: true };
        }

        const analysis = await this.tflite.analyzeCodeWithML(code, 'full');
        
        // Enhance with traditional analysis & deep structural checks
        const traditionalAnalysis = this.traditionalCodeAnalysis(code);
        const structuralAnalysis = this.deepStructuralInspection(code);

        const result = {
            ...analysis,
            traditional: traditionalAnalysis,
            structural: structuralAnalysis,
            combinedScore: this.combineScores(analysis, traditionalAnalysis, structuralAnalysis),
            timestamp: new Date().toISOString(),
            cached: false
        };

        this.cache.set('ml_analysis', code, result);
        return result;
    }

    deepStructuralInspection(code) {
        const lines = code.split('\n');
        let maxNestDepth = 0;
        let currentNestDepth = 0;
        let blockingDelayCount = 0;
        let digitalReadWriteCount = 0;
        let analogReadWriteCount = 0;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes('{')) currentNestDepth++;
            if (trimmed.includes('}')) currentNestDepth = Math.max(0, currentNestDepth - 1);
            maxNestDepth = Math.max(maxNestDepth, currentNestDepth);

            if (trimmed.startsWith('delay(')) blockingDelayCount++;
            if (trimmed.includes('digitalRead') || trimmed.includes('digitalWrite')) digitalReadWriteCount++;
            if (trimmed.includes('analogRead') || trimmed.includes('analogWrite')) analogReadWriteCount++;
        });

        return {
            maxNestDepth,
            blockingDelayCount,
            digitalReadWriteCount,
            analogReadWriteCount,
            hasBlockingDelays: blockingDelayCount > 0,
            structuralHealthScore: Math.max(0, 100 - (maxNestDepth * 5) - (blockingDelayCount * 10))
        };
    }

    combineScores(mlAnalysis, traditionalAnalysis, structuralAnalysis) {
        const mlScore = mlAnalysis.overallScore || 0;
        const tradScore = traditionalAnalysis.maintainability / 100;
        const structScore = (structuralAnalysis.structuralHealthScore || 100) / 100;
        
        return (mlScore * 0.5 + tradScore * 0.3 + structScore * 0.2);
    }

    async getSmartSuggestions(code, context = {}) {
        await this.initialize();
        
        const analysis = await this.analyzeCode(code);
        const suggestions = [];
        
        // ML-based suggestions
        if (analysis.recommendations) {
            suggestions.push(...analysis.recommendations);
        }
        
        // Context-aware suggestions
        if (context.arduinoModel) {
            suggestions.push(...this.getModelSpecificSuggestions(context.arduinoModel));
        }
        
        // Performance suggestions
        if (analysis.complexity.score > 0.7) {
            suggestions.push({
                type: 'performance',
                message: 'High complexity detected',
                suggestion: 'Consider optimizing critical sections'
            });
        }
        
        return this.prioritizeSuggestions(suggestions);
    }

    getModelSpecificSuggestions(arduinoModel) {
        const suggestions = [];
        
        if (arduinoModel === 'nano') {
            suggestions.push({
                type: 'memory_optimization',
                message: 'Arduino Nano has limited memory',
                suggestion: 'Use PROGMEM for large data and optimize variable sizes'
            });
        }
        
        if (arduinoModel === 'uno') {
            suggestions.push({
                type: 'performance',
                message: 'Arduino Uno has limited processing power',
                suggestion: 'Avoid complex calculations in loop(), use efficient algorithms'
            });
        }
        
        return suggestions;
    }

    prioritizeSuggestions(suggestions) {
        const priorityWeights = {
            'error_prevention': 10,
            'memory_optimization': 8,
            'performance': 6,
            'pattern_optimization': 4,
            'complexity_reduction': 3
        };
        
        return suggestions.sort((a, b) => {
            const weightA = priorityWeights[a.type] || 1;
            const weightB = priorityWeights[b.type] || 1;
            return weightB - weightA;
        });
    }
}
