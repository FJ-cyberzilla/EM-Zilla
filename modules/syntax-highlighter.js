export default class SyntaxHighlighter {
    highlight(code) {
        return code
            .split('\n')
            .map(line => this.highlightLine(line))
            .join('\n');
    }
    
    highlightLine(line) {
        let highlighted = line;
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\/.*$/g, '<span class="code-comment">$&</span>');
        
        // Highlight keywords
        const keywords = ['void', 'setup', 'loop', 'int', 'float', 'double', 'if', 'else', 'for', 'while', 'return'];
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="code-keyword">${keyword}</span>`);
        });
        
        // Highlight functions
        const functions = ['pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'delay', 'Serial\\.\\w+'];
        functions.forEach(func => {
            const regex = new RegExp(`\\b${func}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="code-function">$&</span>`);
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="code-string">"$1"</span>');
        
        return `<div class="code-line">${highlighted}</div>`;
    }
}
