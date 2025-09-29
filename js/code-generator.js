import ArduinoTemplates from '../modules/arduino-templates.js';
import AIService from '../modules/ai-service.js';

export default class CodeGenerator {
    constructor() {
        this.templates = new ArduinoTemplates();
        this.aiService = new AIService();
    }
    
    async generateFromCommand(command) {
        // First try to match with templates for common patterns
        const templateCode = this.templates.matchTemplate(command);
        if (templateCode) {
            return templateCode;
        }
        
        // If no template matches, use AI service
        return await this.aiService.generateCode(command);
    }
}
