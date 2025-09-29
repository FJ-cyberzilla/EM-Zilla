export default class TFLiteIntegration {
    constructor() {
        this.tflite = null;
        this.models = new Map();
        this.isInitialized = false;
        this.modelBasePath = './ml-models/';
    }

    async initialize() {
        try {
            // Load TFLite WebAssembly
            await this.loadTFLiteWASM();
            
            // Preload essential models
            await this.preloadModels();
            
            this.isInitialized = true;
            console.log('✅ TFLite integration initialized');
            
        } catch (error) {
            console.error('❌ TFLite initialization failed:', error);
            throw error;
        }
    }

    async loadTFLiteWASM() {
        // Load TFLite WebAssembly runtime
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@latest/dist/tf-tflite.min.js';
        document.head.appendChild(script);

        return new Promise((resolve, reject) => {
            script.onload = () => {
                this.tflite = tflite;
                resolve();
            };
            script.onerror = reject;
        });
    }

    async preloadModels() {
        const modelsToLoad = [
            { name: 'codePatterns', file: 'code-patterns.tflite' },
            { name: 'errorPrediction', file: 'error-prediction.tflite' },
            { name: 'complexityAnalysis', file: 'complexity-analysis.tflite' },
            { name: 'codeOptimization', file: 'code-optimization.tflite' }
        ];

        for (const modelInfo of modelsToLoad) {
            await this.loadModel(modelInfo.name, modelInfo.file);
        }
    }

    async loadModel(modelName, modelFile) {
        try {
            const modelPath = `${this.modelBasePath}${modelFile}`;
            const response = await fetch(modelPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load model: ${modelFile}`);
            }

            const modelArrayBuffer = await response.arrayBuffer();
            const model = await this.tflite.loadModel(modelArrayBuffer);
            
            this.models.set(modelName, model);
            console.log(`✅ Loaded TFLite model: ${modelName}`);
            
        } catch (error) {
            console.warn(`⚠️ Could not load model ${modelName}:`, error);
        }
    }

    async analyzeCodeWithML(code, analysisType = 'full') {
        if (!this.isInitialized) {
            throw new Error('TFLite not initialized');
        }

        const features = this.extractCodeFeatures(code);
        const tensor = this.convertFeaturesToTensor(features);

        let results = {};
        
        switch (analysisType) {
            case 'pattern':
                results.patterns = await this.detectCodePatterns(tensor);
                break;
            case 'errors':
                results.errors = await this.predictErrors(tensor);
                break;
            case 'complexity':
                results.complexity = await this.analyzeComplexity(tensor);
                break;
            case 'full':
            default:
                results = await this.fullCodeAnalysis(tensor, features);
                break;
        }

        return results;
    }

    extractCodeFeatures(code) {
        const lines = code.split('\n');
        
        return {
            lineCount: lines.length,
            functionCount: (code.match(/\b(void|int|float|double)\s+\w+\s*\(/g) || []).length,
            variableCount: (code.match(/\b(int|float|double|bool|char)\s+\w+/g) || []).length,
            loopCount: (code.match(/\b(for|while)\s*\(/g) || []).length,
            conditionCount: (code.match(/\b(if|else if|switch)\s*\(/g) || []).length,
            commentDensity: (code.match(/\/\/|\/\*/g) || []).length / lines.length,
            averageLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length,
            libraryCount: (code.match(/#include\s+<[^>]+>/g) || []).length
        };
    }

    convertFeaturesToTensor(features) {
        const featureArray = [
            features.lineCount / 100, // Normalize
            features.functionCount / 10,
            features.variableCount / 20,
            features.loopCount / 5,
            features.conditionCount / 5,
            features.commentDensity,
            features.averageLineLength / 50,
            features.libraryCount / 5
        ];

        return this.tflite.tensor(featureArray, [1, featureArray.length]);
    }

    async detectCodePatterns(tensor) {
        const model = this.models.get('codePatterns');
        if (!model) return { patterns: [] };

        const output = model.predict(tensor);
        const patterns = this.decodePatterns(output.dataSync());
        
        return {
            patterns: patterns,
            confidence: Math.max(...output.dataSync())
        };
    }

    async predictErrors(tensor) {
        const model = this.models.get('errorPrediction');
        if (!model) return { potentialErrors: [] };

        const output = model.predict(tensor);
        const errors = this.decodeErrors(output.dataSync());
        
        return {
            potentialErrors: errors,
            riskLevel: this.calculateRiskLevel(output.dataSync())
        };
    }

    async analyzeComplexity(tensor) {
        const model = this.models.get('complexityAnalysis');
        if (!model) return { score: 0, level: 'unknown' };

        const output = model.predict(tensor);
        const complexityScore = output.dataSync()[0];
        
        return {
            score: complexityScore,
            level: this.getComplexityLevel(complexityScore),
            suggestions: this.getComplexitySuggestions(complexityScore)
        };
    }

    async fullCodeAnalysis(tensor, features) {
        const [patterns, errors, complexity] = await Promise.all([
            this.detectCodePatterns(tensor),
            this.predictErrors(tensor),
            this.analyzeComplexity(tensor)
        ]);

        return {
            features: features,
            patterns: patterns,
            errors: errors,
            complexity: complexity,
            overallScore: this.calculateOverallScore(patterns, errors, complexity),
            recommendations: this.generateRecommendations(patterns, errors, complexity)
        };
    }

    decodePatterns(outputArray) {
        const patterns = [];
        const patternTypes = [
            'blink_pattern', 'sensor_reading', 'motor_control', 
            'serial_communication', 'lcd_display', 'pwm_control',
            'interrupt_handler', 'state_machine', 'data_processing'
        ];

        outputArray.forEach((confidence, index) => {
            if (confidence > 0.7 && patternTypes[index]) {
                patterns.push({
                    type: patternTypes[index],
                    confidence: confidence,
                    description: this.getPatternDescription(patternTypes[index])
                });
            }
        });

        return patterns;
    }

    decodeErrors(outputArray) {
        const errors = [];
        const errorTypes = [
            'memory_overflow', 'logic_error', 'syntax_risk',
            'performance_issue', 'resource_leak', 'timing_problem'
        ];

        outputArray.forEach((probability, index) => {
            if (probability > 0.6 && errorTypes[index]) {
                errors.push({
                    type: errorTypes[index],
                    probability: probability,
                    solution: this.getErrorSolution(errorTypes[index])
                });
            }
        });

        return errors;
    }

    getComplexityLevel(score) {
        if (score < 0.3) return 'beginner';
        if (score < 0.6) return 'intermediate';
        if (score < 0.8) return 'advanced';
        return 'expert';
    }

    getComplexitySuggestions(score) {
        const suggestions = [];
        
        if (score > 0.7) {
            suggestions.push('Consider breaking down complex functions');
            suggestions.push('Add more comments for complex logic');
            suggestions.push('Use helper functions to reduce complexity');
        }
        
        if (score < 0.3) {
            suggestions.push('Code is well-structured and maintainable');
        }

        return suggestions;
    }

    calculateOverallScore(patterns, errors, complexity) {
        const patternScore = patterns.confidence || 0;
        const errorScore = 1 - (errors.riskLevel || 0);
        const complexityScore = 1 - Math.min(complexity.score || 0, 1);
        
        return (patternScore + errorScore + complexityScore) / 3;
    }

    generateRecommendations(patterns, errors, complexity) {
        const recommendations = [];
        
        // Pattern-based recommendations
        patterns.patterns.forEach(pattern => {
            if (pattern.confidence > 0.8) {
                recommendations.push({
                    type: 'pattern_optimization',
                    message: `High confidence ${pattern.type} detected`,
                    suggestion: this.getPatternOptimization(pattern.type)
                });
            }
        });

        // Error prevention recommendations
        errors.potentialErrors.forEach(error => {
            if (error.probability > 0.7) {
                recommendations.push({
                    type: 'error_prevention',
                    message: `Potential ${error.type} detected`,
                    suggestion: error.solution
                });
            }
        });

        // Complexity recommendations
        if (complexity.level === 'advanced' || complexity.level === 'expert') {
            recommendations.push({
                type: 'complexity_reduction',
                message: 'Code complexity is high',
                suggestion: 'Consider refactoring complex sections'
            });
        }

        return recommendations;
    }

    // Helper methods for pattern and error descriptions
    getPatternDescription(patternType) {
        const descriptions = {
            'blink_pattern': 'Basic LED blinking with timing control',
            'sensor_reading': 'Reading values from sensors with calibration',
            'motor_control': 'Controlling motors with PWM signals',
            'serial_communication': 'Data exchange via serial interface',
            'lcd_display': 'Text and graphics display on LCD screens',
            'pwm_control': 'Pulse Width Modulation for analog control',
            'interrupt_handler': 'Event-driven programming with interrupts',
            'state_machine': 'Program state management with clear transitions',
            'data_processing': 'Data manipulation and transformation'
        };
        
        return descriptions[patternType] || 'Unknown pattern';
    }

    getErrorSolution(errorType) {
        const solutions = {
            'memory_overflow': 'Reduce variable sizes or use PROGMEM for constants',
            'logic_error': 'Add debug statements and validate conditions',
            'syntax_risk': 'Review syntax and use consistent formatting',
            'performance_issue': 'Optimize loops and reduce function calls',
            'resource_leak': 'Ensure proper cleanup in setup/loop functions',
            'timing_problem': 'Use millis() instead of delay() for timing'
        };
        
        return solutions[errorType] || 'Review code structure';
    }

    getPatternOptimization(patternType) {
        const optimizations = {
            'blink_pattern': 'Use millis() for non-blocking delays',
            'sensor_reading': 'Implement sensor calibration and filtering',
            'motor_control': 'Add acceleration/deceleration for smooth operation',
            'serial_communication': 'Use SerialEvent for async communication',
            'lcd_display': 'Implement custom characters for better visuals',
            'pwm_control': 'Use analogWriteResolution for higher precision',
            'interrupt_handler': 'Keep ISR functions short and efficient',
            'state_machine': 'Use enum for state definitions',
            'data_processing': 'Implement data validation and error handling'
        };
        
        return optimizations[patternType] || 'Consider code optimization';
    }

    // Memory management
    cleanup() {
        this.models.forEach(model => {
            model.dispose();
        });
        this.models.clear();
    }
          }
