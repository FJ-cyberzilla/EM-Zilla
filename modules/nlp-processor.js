export default class NLPProcessor {
    constructor() {
        this.keywords = {
            'sensors': ['sensor', 'detect', 'measure', 'read', 'temperature', 'humidity', 'distance', 'light', 'motion'],
            'actuators': ['motor', 'servo', 'led', 'light', 'display', 'lcd', 'buzzer', 'relay'],
            'communication': ['serial', 'bluetooth', 'wifi', 'ethernet', 'i2c', 'spi'],
            'timing': ['delay', 'timer', 'interval', 'millis', 'micros'],
            'control': ['if', 'else', 'for', 'while', 'switch', 'case']
        };
    }

    analyzeCommand(command) {
        const tokens = command.toLowerCase().split(/\s+/);
        const analysis = {
            components: [],
            actions: [],
            parameters: {},
            complexity: 'basic'
        };

        // Detect components
        tokens.forEach(token => {
            if (this.keywords.sensors.includes(token)) analysis.components.push('sensor');
            if (this.keywords.actuators.includes(token)) analysis.components.push('actuator');
            if (this.keywords.communication.includes(token)) analysis.components.push('communication');
        });

        // Detect actions
        if (command.includes('blink') || command.includes('flash')) analysis.actions.push('blink');
        if (command.includes('read') || command.includes('measure')) analysis.actions.push('read_sensor');
        if (command.includes('control') || command.includes('move')) analysis.actions.push('control_actuator');
        if (command.includes('display') || command.includes('show')) analysis.actions.push('display');

        // Extract parameters
        const timeMatch = command.match(/(\d+)\s*(second|sec|millisecond|ms|minute|min)/);
        if (timeMatch) analysis.parameters.interval = timeMatch[1];

        const pinMatch = command.match(/pin\s*(\d+)/i);
        if (pinMatch) analysis.parameters.pin = pinMatch[1];

        // Determine complexity
        if (analysis.components.length > 2 || analysis.actions.length > 1) {
            analysis.complexity = 'advanced';
        } else if (analysis.components.length > 1) {
            analysis.complexity = 'intermediate';
        }

        return analysis;
    }

    extractRequirements(command) {
        const requirements = {
            libraries: [],
            pins: [],
            functions: []
        };

        if (command.includes('lcd') || command.includes('display')) {
            requirements.libraries.push('LiquidCrystal');
        }
        if (command.includes('servo')) {
            requirements.libraries.push('Servo');
        }
        if (command.includes('temperature') || command.includes('dht')) {
            requirements.libraries.push('DHT');
        }

        return requirements;
    }
}
