export default class KnowledgeGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.taskHistory = new Map();
        this.patterns = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🧠 Initializing Knowledge Graph...');
        
        // Load existing knowledge if available
        await this.loadPersistedKnowledge();
        
        // Initialize core concepts
        this.initializeCoreConcepts();
        
        this.isInitialized = true;
        console.log('✅ Knowledge Graph Ready');
    }

    initializeCoreConcepts() {
        // Arduino concepts
        this.addNode('concept', 'arduino_uno', {
            pins: { digital: 14, analog: 6, pwm: 6 },
            memory: '2KB',
            flash: '32KB',
            common_uses: ['prototyping', 'education', 'iot']
        });

        this.addNode('concept', 'arduino_nano', {
            pins: { digital: 14, analog: 8, pwm: 6 },
            memory: '2KB',
            flash: '32KB',
            common_uses: ['compact_projects', 'wearables']
        });

        this.addNode('concept', 'sensor_reading', {
            patterns: ['analog_read', 'digital_read', 'i2c', 'spi'],
            best_practices: ['filtering', 'calibration', 'error_handling']
        });

        this.addNode('concept', 'motor_control', {
            patterns: ['pwm_control', 'h_bridge', 'servo_library'],
            considerations: ['power_requirements', 'back_emf']
        });

        // Create relationships
        this.addEdge('arduino_uno', 'supports', 'sensor_reading');
        this.addEdge('arduino_uno', 'supports', 'motor_control');
        this.addEdge('sensor_reading', 'requires', 'analog_read');
        this.addEdge('motor_control', 'requires', 'pwm_control');
    }

    addNode(type, id, properties = {}) {
        this.nodes.set(id, {
            id,
            type,
            properties,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    addEdge(fromId, relationship, toId, properties = {}) {
        const edgeId = `${fromId}-${relationship}-${toId}`;
        
        this.edges.set(edgeId, {
            id: edgeId,
            from: fromId,
            to: toId,
            relationship,
            properties,
            createdAt: new Date().toISOString()
        });
    }

    async recordTaskSuccess(task, result) {
        const taskId = task.id;
        
        this.taskHistory.set(taskId, {
            ...task,
            result,
            success: true,
            completedAt: new Date().toISOString()
        });

        // Extract patterns from successful task
        await this.extractPatterns(task, result);
        
        // Update concept relationships
        await this.updateConceptRelationships(task, result);
        
        // Persist knowledge
        await this.persistKnowledge();
    }

    async recordTaskFailure(task, error) {
        const taskId = task.id;
        
        this.taskHistory.set(taskId, {
            ...task,
            error,
            success: false,
            completedAt: new Date().toISOString()
        });

        // Learn from failure patterns
        await this.extractFailurePatterns(task, error);
        
        await this.persistKnowledge();
    }

    async extractPatterns(task, result) {
        const patterns = this.analyzeTaskForPatterns(task, result);
        
        patterns.forEach(pattern => {
            const patternId = this.generatePatternId(pattern);
            const existing = this.patterns.get(patternId);
            
            if (existing) {
                existing.frequency++;
                existing.lastSeen = new Date().toISOString();
                existing.examples.push({ taskId: task.id, result });
            } else {
                this.patterns.set(patternId, {
                    ...pattern,
                    frequency: 1,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    examples: [{ taskId: task.id, result }],
                    successRate: 1.0
                });
            }
        });
    }

    analyzeTaskForPatterns(task, result) {
        const patterns = [];
        
        // Code generation patterns
        if (task.type === 'code_generation') {
            const description = task.payload.description.toLowerCase();
            
            if (description.includes('blink') || description.includes('led')) {
                patterns.push({
                    type: 'code_pattern',
                    name: 'led_blink',
                    triggers: ['blink', 'led', 'flash'],
                    complexity: 'low',
                    typicalDuration: 2000
                });
            }
            
            if (description.includes('sensor') || description.includes('read')) {
                patterns.push({
                    type: 'code_pattern',
                    name: 'sensor_reading',
                    triggers: ['sensor', 'read', 'measure'],
                    complexity: 'medium',
                    typicalDuration: 3000
                });
            }
        }
        
        // Analysis patterns
        if (task.type === 'analysis' && result.complexity > 0.7) {
            patterns.push({
                type: 'complexity_pattern',
                name: 'high_complexity',
                triggers: ['complex', 'nested', 'multiple'],
                typicalIssues: ['memory', 'readability']
            });
        }
        
        return patterns;
    }

    async extractFailurePatterns(task, error) {
        const errorPattern = {
            type: 'error_pattern',
            taskType: task.type,
            errorMessage: error.message,
            context: task.payload,
            timestamp: new Date().toISOString()
        };
        
        // Update pattern success rates
        const relatedPatterns = this.findRelatedPatterns(task);
        relatedPatterns.forEach(pattern => {
            pattern.successRate = (pattern.successRate * pattern.frequency) / (pattern.frequency + 1);
        });
    }

    async findSimilarTasks(currentTask) {
        const similarities = [];
        
        for (const [taskId, historicalTask] of this.taskHistory) {
            if (historicalTask.success) {
                const similarity = this.calculateTaskSimilarity(currentTask, historicalTask);
                
                if (similarity > 0.6) { // Threshold for similarity
                    similarities.push({
                        task: historicalTask,
                        similarity,
                        relevance: this.calculateRelevance(historicalTask, currentTask)
                    });
                }
            }
        }
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5)
            .map(s => s.task);
    }

    calculateTaskSimilarity(taskA, taskB) {
        let similarity = 0;
        
        // Type similarity
        if (taskA.type === taskB.type) similarity += 0.3;
        
        // Payload similarity
        const payloadSimilarity = this.calculatePayloadSimilarity(taskA.payload, taskB.payload);
        similarity += payloadSimilarity * 0.5;
        
        // Context similarity
        if (taskA.context && taskB.context) {
            const contextSimilarity = this.calculateContextSimilarity(taskA.context, taskB.context);
            similarity += contextSimilarity * 0.2;
        }
        
        return Math.min(similarity, 1.0);
    }

    calculatePayloadSimilarity(payloadA, payloadB) {
        // Simple text-based similarity for demonstration
        const textA = JSON.stringify(payloadA).toLowerCase();
        const textB = JSON.stringify(payloadB).toLowerCase();
        
        const wordsA = new Set(textA.split(/\W+/));
        const wordsB = new Set(textB.split(/\W+/));
        
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        
        return intersection.size / union.size;
    }

    calculateContextSimilarity(contextA, contextB) {
        // Compare context objects
        const keysA = Object.keys(contextA);
        const keysB = Object.keys(contextB);
        
        const commonKeys = keysA.filter(key => keysB.includes(key));
        if (commonKeys.length === 0) return 0;
        
        let matches = 0;
        commonKeys.forEach(key => {
            if (contextA[key] === contextB[key]) {
                matches++;
            }
        });
        
        return matches / commonKeys.length;
    }

    calculateRelevance(historicalTask, currentTask) {
        // Calculate how relevant historical task is to current task
        const timeDiff = Date.now() - new Date(historicalTask.completedAt);
        const recency = Math.max(0, 1 - (timeDiff / (30 * 24 * 60 * 60 * 1000))); // 30 days
        
        const similarity = this.calculateTaskSimilarity(historicalTask, currentTask);
        
        return (similarity * 0.7) + (recency * 0.3);
    }

    async updateConceptRelationships(task, result) {
        // Extract concepts from task and result
        const concepts = this.extractConcepts(task, result);
        
        concepts.forEach(concept => {
            if (!this.nodes.has(concept)) {
                this.addNode('concept', concept, {
                    discovered: new Date().toISOString(),
                    source: 'task_analysis'
                });
            }
            
            // Create relationship to task type
            this.addEdge(concept, 'related_to', task.type, {
                strength: 1.0,
                lastUsed: new Date().toISOString()
            });
        });
    }

    extractConcepts(task, result) {
        const concepts = new Set();
        
        // Extract from task description
        const description = task.payload.description?.toLowerCase() || '';
        const words = description.split(/\W+/).filter(word => word.length > 3);
        
        words.forEach(word => {
            if (this.isTechnicalTerm(word)) {
                concepts.add(word);
            }
        });
        
        // Extract from result
        if (result.code) {
            const codeWords = result.code.toLowerCase().split(/\W+/);
            codeWords.forEach(word => {
                if (this.isArduinoConcept(word)) {
                    concepts.add(word);
                }
            });
        }
        
        return Array.from(concepts);
    }

    isTechnicalTerm(word) {
        const technicalTerms = [
            'sensor', 'motor', 'display', 'serial', 'pwm', 'analog', 
            'digital', 'input', 'output', 'protocol', 'interface'
        ];
        
        return technicalTerms.includes(word);
    }

    isArduinoConcept(word) {
        const arduinoConcepts = [
            'pinmode', 'digitalwrite', 'analogread', 'serial', 'begin',
            'print', 'println', 'delay', 'millis', 'micros'
        ];
        
        return arduinoConcepts.includes(word);
    }

    findRelatedPatterns(task) {
        const related = [];
        
        for (const [patternId, pattern] of this.patterns) {
            if (pattern.triggers.some(trigger => 
                task.payload.description?.toLowerCase().includes(trigger))) {
                related.push(pattern);
            }
        }
        
        return related;
    }

    generatePatternId(pattern) {
        return `${pattern.type}_${pattern.name}_${pattern.triggers.join('_')}`;
    }

    // Knowledge query methods
    async getRecommendationsForTask(task) {
        const similarTasks = await this.findSimilarTasks(task);
        const patterns = this.findRelatedPatterns(task);
        
        return {
            similarTasks: similarTasks.slice(0, 3),
            relevantPatterns: patterns.slice(0, 5),
            estimatedDuration: this.estimateTaskDuration(task),
            potentialIssues: this.predictPotentialIssues(task),
            bestPractices: this.getBestPractices(task)
        };
    }

    estimateTaskDuration(task) {
        const similarTasks = Array.from(this.taskHistory.values())
            .filter(t => t.type === task.type && t.success)
            .slice(0, 10);
            
        if (similarTasks.length === 0) return 5000;
        
        const durations = similarTasks.map(t => 
            new Date(t.completedAt) - new Date(t.startedAt)
        );
        
        return durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    predictPotentialIssues(task) {
        const issues = [];
        const patterns = this.findRelatedPatterns(task);
        
        patterns.forEach(pattern => {
            if (pattern.successRate < 0.7) {
                issues.push({
                    pattern: pattern.name,
                    confidence: 1 - pattern.successRate,
                    description: `Historical low success rate for ${pattern.name}`
                });
            }
        });
        
        return issues;
    }

    getBestPractices(task) {
        const practices = [];
        
        if (task.type === 'code_generation') {
            practices.push('Use descriptive variable names');
            practices.push('Add comments for complex logic');
            practices.push('Validate sensor readings');
        }
        
        if (task.type === 'optimization') {
            practices.push('Profile before optimizing');
            practices.push('Focus on bottleneck areas');
            practices.push('Consider memory constraints');
        }
        
        return practices;
    }

    // Persistence
    async persistKnowledge() {
        try {
            const knowledge = {
                nodes: Array.from(this.nodes.entries()),
                edges: Array.from(this.edges.entries()),
                patterns: Array.from(this.patterns.entries()),
                taskHistory: Array.from(this.taskHistory.entries()),
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('vita_coder_knowledge_graph', JSON.stringify(knowledge));
        } catch (error) {
            console.warn('Failed to persist knowledge graph:', error);
        }
    }

    async loadPersistedKnowledge() {
        try {
            const stored = localStorage.getItem('vita_coder_knowledge_graph');
            if (stored) {
                const knowledge = JSON.parse(stored);
                
                this.nodes = new Map(knowledge.nodes);
                this.edges = new Map(knowledge.edges);
                this.patterns = new Map(knowledge.patterns);
                this.taskHistory = new Map(knowledge.taskHistory);
                
                console.log('📚 Loaded persisted knowledge graph');
            }
        } catch (error) {
            console.warn('Failed to load persisted knowledge graph:', error);
        }
    }

    // Statistics and insights
    getKnowledgeStats() {
        return {
            nodes: this.nodes.size,
            edges: this.edges.size,
            patterns: this.patterns.size,
            taskHistory: this.taskHistory.size,
            successRate: this.calculateOverallSuccessRate(),
            mostCommonPatterns: this.getMostCommonPatterns(5)
        };
    }

    calculateOverallSuccessRate() {
        const tasks = Array.from(this.taskHistory.values());
        if (tasks.length === 0) return 0;
        
        const successful = tasks.filter(t => t.success).length;
        return successful / tasks.length;
    }

    getMostCommonPatterns(limit = 10) {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit)
            .map(p => ({ name: p.name, frequency: p.frequency, successRate: p.successRate }));
    }

    async cleanup() {
        await this.persistKnowledge();
        console.log('🧹 Knowledge Graph persisted and cleaned up');
    }
    }
