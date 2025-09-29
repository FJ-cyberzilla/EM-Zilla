export default class ErrorChecker {
    constructor() {
        this.commonErrors = {
            'not declared in this scope': 'Variable or function not declared. Check spelling and scope.',
            'expected primary-expression': 'Syntax error. Check for missing operators or parentheses.',
            'expected \';\' before': 'Missing semicolon at the end of statement.',
            'no matching function for call': 'Function called with wrong arguments or not declared.',
            'undefined reference to': 'Function declared but not defined. Check implementation.',
            'expected unqualified-id': 'Syntax error in variable or function declaration.',
            'cannot convert': 'Type mismatch in assignment or function call.',
            'expected \')\'': 'Missing closing parenthesis.',
            'expected \'}\'': 'Missing closing brace.',
            'redefinition of': 'Variable or function defined multiple times.'
        };
    }

    analyzeErrors(errorText) {
        const errors = errorText.split('\n').filter(line => line.trim());
        const analysis = {
            errors: [],
            suggestions: [],
            severity: 'low'
        };

        errors.forEach(error => {
            const matchedError = this.matchError(error);
            if (matchedError) {
                analysis.errors.push(matchedError);
            }
        });

        analysis.severity = this.determineSeverity(analysis.errors);
        analysis.suggestions = this.generateErrorSuggestions(analysis.errors);

        return analysis;
    }

    matchError(errorLine) {
        for (const [pattern, solution] of Object.entries(this.commonErrors)) {
            if (errorLine.toLowerCase().includes(pattern.toLowerCase())) {
                return {
                    pattern: pattern,
                    message: errorLine,
                    solution: solution,
                    line: this.extractLineNumber(errorLine)
                };
            }
        }
        return null;
    }

    extractLineNumber(errorLine) {
        const match = errorLine.match(/:(\d+):/);
        return match ? parseInt(match[1]) : null;
    }

    determineSeverity(errors) {
        const criticalPatterns = ['undefined reference', 'redefinition', 'cannot convert'];
        
        for (const error of errors) {
            if (criticalPatterns.some(pattern => error.pattern.includes(pattern))) {
                return 'high';
            }
        }
        
        return errors.length > 0 ? 'medium' : 'low';
    }

    generateErrorSuggestions(errors) {
        const suggestions = [];
        
        errors.forEach(error => {
            suggestions.push(`Line ${error.line || 'unknown'}: ${error.solution}`);
        });

        if (errors.length > 3) {
            suggestions.push('Multiple errors detected. Start by fixing the first error as it might be causing others.');
        }

        return suggestions;
    }
}
