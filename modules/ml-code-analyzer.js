import TFLiteIntegration from './tflite-integration.js';

export default class MLCodeAnalyzer {
    constructor() {
        this.tflite = new TFLiteIntegration();
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

        const analysis = await this.tflite.analyzeCodeWithML(code, 'full');
        
        // Enhance with traditional analysis
        const traditionalAnalysis = this.traditionalCodeAnalysis(code);
        
        return {
            ...analysis,
            traditional: traditionalAnalysis,
            combinedScore: this.combineScores(analysis, traditionalAnalysis),
            timestamp: new Date().toISOString()
        };
    }

    traditionalCodeAnalysis(code) {
        return {
            lineCount: code.split('\n').length,
            functionCount: (code.match(/\b\w+\s+\w+\s*\([^)]*\)\s*{/g) || []).length,
            complexity: this.calculateCyclomaticComplexity(code),
            readability: this.calculateReadabilityScore(code),
            maintainability: this.calculateMaintainabilityIndex(code)
        };
    }

    calculateCyclomaticComplexity(code) {
        let complexity = 1;
        
        // Count decision points
        complexity += (code.match(/\bif\s*\(/g) || []).length;
        complexity += (code.match(/\bfor\s*\(/g) || []).length;
        complexity += (code.match(/\bwhile\s*\(/g) || []).length;
        complexity += (code.match(/\bcase\s+/g) || []).length;
        complexity += (code.match(/\bcatch\s*\(/g) || []).length;
        
        return complexity;
    }

    calculateReadabilityScore(code) {
        const lines = code.split('\n');
        let score = 100;
        
        // Penalize long lines
        lines.forEach(line => {
            if (line.length > 80) score -= 2;
            if (line.length > 120) score -= 5;
        });
        
        // Reward comments
        const commentLines = lines.filter(line => 
            line.trim().startsWith('//') || line.includes('/*')
        ).length;
        
        score += Math.min(commentLines * 2, 20);
        
        return Math.max(0, score);
    }

    calculateMaintainabilityIndex(code) {
        const complexity = this.calculateCyclomaticComplexity(code);
        const lines = code.split('\n').length;
        const commentDensity = (code.match(/\/\/|\/\*/g) || []).length / lines;
        
        // Simplified maintainability index calculation
        return Math.max(0, 171 - 5.2 * Math.log(complexity) - 0.23 * lines + 16.2 * Math.log(commentDensity + 1));
    }

    combineScores(mlAnalysis, traditionalAnalysis) {
        const mlScore = mlAnalysis.overallScore || 0;
        const tradScore = traditionalAnalysis.maintainability / 100;
        
        return (mlScore * 0.7 + tradScore * 0.3);
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
