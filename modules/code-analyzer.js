export default class CodeAnalyzer {
    analyzeCode(code) {
        const analysis = {
            lines: code.split('\n').length,
            functions: this.countFunctions(code),
            variables: this.countVariables(code),
            complexity: this.calculateComplexity(code),
            issues: this.findIssues(code),
            suggestions: []
        };

        analysis.suggestions = this.generateSuggestions(analysis);
        return analysis;
    }

    countFunctions(code) {
        const functionMatches = code.match(/\b(void|int|float|double|bool|char)\s+(\w+)\s*\(/g);
        return functionMatches ? functionMatches.length : 0;
    }

    countVariables(code) {
        const variableMatches = code.match(/\b(int|float|double|bool|char|byte)\s+(\w+)\s*[=;]/g);
        return variableMatches ? variableMatches.length : 0;
    }

    calculateComplexity(code) {
        let complexity = 1; // Base complexity
        
        // Count control structures
        const controls = code.match(/\b(if|for|while|switch)\b/g);
        if (controls) complexity += controls.length;

        // Count function calls
        const functions = code.match(/\b(\w+)\s*\(/g);
        if (functions) complexity += functions.length * 0.5;

        return Math.min(complexity, 10); // Cap at 10
    }

    findIssues(code) {
        const issues = [];

        // Check for missing semicolons
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && 
                !trimmed.endsWith(';') && 
                !trimmed.endsWith('{') && 
                !trimmed.endsWith('}') &&
                !trimmed.startsWith('//') &&
                !trimmed.startsWith('#') &&
                !trimmed.includes('if') &&
                !trimmed.includes('for') &&
                !trimmed.includes('while') &&
                !trimmed.match(/^\s*\w+\s+(\w+)\s*\([^)]*\)\s*{?\s*$/)) {
                issues.push({
                    type: 'warning',
                    line: index + 1,
                    message: 'Possible missing semicolon',
                    code: trimmed
                });
            }
        });

        // Check for common mistakes
        if (code.includes('delay(') && code.includes('millis()')) {
            issues.push({
                type: 'suggestion',
                line: 0,
                message: 'Consider replacing delay() with millis() for non-blocking code',
                code: ''
            });
        }

        return issues;
    }

    generateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.complexity > 5) {
            suggestions.push('Consider breaking down complex functions into smaller ones');
        }

        if (analysis.issues.length > 3) {
            suggestions.push('Review code for potential syntax errors');
        }

        return suggestions;
    }
}
