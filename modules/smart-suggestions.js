import MLCodeAnalyzer from './ml-code-analyzer.js';

export default class SmartSuggestions {
    constructor() {
        this.mlAnalyzer = new MLCodeAnalyzer();
        this.suggestionHistory = new Map();
    }

    async getCodeSuggestions(code, cursorPosition, context = {}) {
        const line = this.getCurrentLine(code, cursorPosition);
        const analysis = await this.mlAnalyzer.analyzeCode(code);
        
        const suggestions = {
            completions: await this.getCompletions(line, context),
            improvements: await this.getImprovementSuggestions(analysis),
            optimizations: await this.getOptimizationSuggestions(analysis, context),
            warnings: await this.getWarningSuggestions(analysis)
        };

        this.updateSuggestionHistory(suggestions);
        return suggestions;
    }

    async getCompletions(currentLine, context) {
        const completions = [];
        const line = currentLine.toLowerCase();

        // Function completions
        if (line.includes('pinmode')) {
            completions.push(...this.getPinModeCompletions());
        }
        
        if (line.includes('digitalwrite')) {
            completions.push(...this.getDigitalWriteCompletions());
        }
        
        if (line.includes('serial.')) {
            completions.push(...this.getSerialCompletions());
        }

        // Library-specific completions
        if (context.libraries && context.libraries.includes('LiquidCrystal')) {
            completions.push(...this.getLcdCompletions());
        }

        return completions;
    }

    getPinModeCompletions() {
        return [
            { text: 'INPUT', description: 'Set pin as input' },
            { text: 'OUTPUT', description: 'Set pin as output' },
            { text: 'INPUT_PULLUP', description: 'Set pin as input with pullup resistor' }
        ];
    }

    getDigitalWriteCompletions() {
        return [
            { text: 'HIGH', description: 'Set pin to high voltage' },
            { text: 'LOW', description: 'Set pin to low voltage' }
        ];
    }

    getSerialCompletions() {
        return [
            { text: 'begin(9600)', description: 'Initialize serial communication' },
            { text: 'print("")', description: 'Print text to serial' },
            { text: 'println("")', description: 'Print line to serial' },
            { text: 'available()', description: 'Check if data is available' },
            { text: 'read()', description: 'Read data from serial' }
        ];
    }

    getLcdCompletions() {
        return [
            { text: 'begin(16, 2)', description: 'Initialize 16x2 LCD' },
            { text: 'print("")', description: 'Print text to LCD' },
            { text: 'setCursor(0, 0)', description: 'Set cursor position' },
            { text: 'clear()', description: 'Clear LCD display' }
        ];
    }

    async getImprovementSuggestions(analysis) {
        const improvements = [];
        
        if (analysis.complexity.level === 'advanced') {
            improvements.push({
                type: 'refactor',
                message: 'High complexity detected',
                suggestion: 'Break down complex functions into smaller ones',
                codeExample: this.getRefactoringExample()
            });
        }

        if (analysis.features.commentDensity < 0.1) {
            improvements.push({
                type: 'documentation',
                message: 'Low comment density',
                suggestion: 'Add comments to explain complex logic',
                codeExample: '// Explain what this function does\nvoid complexFunction() { ... }'
            });
        }

        return improvements;
    }

    async getOptimizationSuggestions(analysis, context) {
        const optimizations = [];
        
        // Memory optimizations
        if (context.arduinoModel === 'nano' || context.arduinoModel === 'uno') {
            optimizations.push({
                type: 'memory',
                message: 'Memory optimization for limited boards',
                suggestion: 'Use PROGMEM for constant strings and data',
                codeExample: 'const char message[] PROGMEM = "Hello World";'
            });
        }

        // Performance optimizations
        if (analysis.patterns.patterns.some(p => p.type === 'blink_pattern')) {
            optimizations.push({
                type: 'performance',
                message: 'Replace delay() with non-blocking code',
                suggestion: 'Use millis() for timing to avoid blocking',
                codeExample: this.getMillisExample()
            });
        }

        return optimizations;
    }

    async getWarningSuggestions(analysis) {
        const warnings = [];
        
        analysis.errors.potentialErrors.forEach(error => {
            if (error.probability > 0.7) {
                warnings.push({
                    type: 'warning',
                    message: `Potential ${error.type}`,
                    suggestion: error.solution,
                    severity: 'high'
                });
            }
        });

        return warnings;
    }

    getCurrentLine(code, cursorPosition) {
        const lines = code.split('\n');
        let currentPos = 0;
        
        for (let i = 0; i < lines.length; i++) {
            currentPos += lines[i].length + 1; // +1 for newline
            if (currentPos >= cursorPosition) {
                return lines[i];
            }
        }
        
        return '';
    }

    getRefactoringExample() {
        return `// Instead of one complex function:
void doEverything() {
    // ... complex code ...
}

// Break into smaller functions:
void setupHardware() { ... }
void readSensors() { ... }
void updateDisplay() { ... }`;
    }

    getMillisExample() {
        return `// Non-blocking delay example:
unsigned long previousMillis = 0;
const long interval = 1000;

void loop() {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval) {
        previousMillis = currentMillis;
        // Your code here
    }
}`;
    }

    updateSuggestionHistory(suggestions) {
        const timestamp = Date.now();
        this.suggestionHistory.set(timestamp, suggestions);
        
        // Keep only last 100 entries
        if (this.suggestionHistory.size > 100) {
            const oldestKey = Math.min(...this.suggestionHistory.keys());
            this.suggestionHistory.delete(oldestKey);
        }
    }
}
