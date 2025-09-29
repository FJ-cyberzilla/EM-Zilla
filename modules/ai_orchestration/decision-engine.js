import KnowledgeGraph from './knowledge-graph.js';

export default class DecisionEngine {
    constructor() {
        this.knowledgeGraph = new KnowledgeGraph();
        this.decisionRules = new Map();
        this.fallbackStrategies = new Map();
        this.learningData = new Map();
        this.isInitialized = false;
        
        this.confidenceThreshold = 0.7;
        this.riskTolerance = 0.3;
    }

    async initialize() {
        console.log('🎯 Initializing Decision Engine...');
        
        await this.knowledgeGraph.initialize();
        this.loadDecisionRules();
        this.loadFallbackStrategies();
        
        this.isInitialized = true;
        console.log('✅ Decision Engine Ready');
    }

    loadDecisionRules() {
        // System selection rules
        this.decisionRules.set('system_selection', {
            conditions: [
                {
                    when: { type: 'code_generation', complexity: 'high' },
                    then: { system: 'tflite_code_gen', priority: 'high' },
                    confidence: 0.8
                },
                {
                    when: { type: 'hardware_detection', method: 'usb' },
                    then: { system: 'usb_detection', priority: 'medium' },
                    confidence: 0.9
                },
                {
                    when: { type: 'analysis', depth: 'deep' },
                    then: { system: 'ml_analyzer', priority: 'high' },
                    confidence: 0.7
                }
            ]
        });

        // Error handling rules
        this.decisionRules.set('error_handling', {
            conditions: [
                {
                    when: { error: 'timeout', system: 'usb_detection' },
                    then: { action: 'retry', delay: 2000, attempts: 3 },
                    confidence: 0.6
                },
                {
                    when: { error: 'memory', system: 'tflite' },
                    then: { action: 'fallback', system: 'rule_based' },
                    confidence: 0.8
                }
            ]
        });

        // Optimization rules
        this.decisionRules.set('optimization', {
            conditions: [
                {
                    when: { target: 'performance', device: 'arduino_uno' },
                    then: { strategy: 'loop_optimization', level: 'aggressive' },
                    confidence: 0.75
                },
                {
                    when: { target: 'memory', device: 'arduino_nano' },
                    then: { strategy: 'variable_reduction', level: 'conservative' },
                    confidence: 0.85
                }
            ]
        });
    }

    loadFallbackStrategies() {
        this.fallbackStrategies.set('tflite_unavailable', {
            primary: 'ml_analyzer',
            secondary: 'rule_based',
            tertiary: 'template_based'
        });

        this.fallbackStrategies.set('usb_unavailable', {
            primary: 'manual_selection',
            secondary: 'simulation_mode',
            tertiary: 'file_based'
        });

        this.fallbackStrategies.set('analysis_failed', {
            primary: 'basic_validation',
            secondary: 'syntax_check',
            tertiary: 'manual_review'
        });
    }

    async makeDecision(decisionType, context, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Decision Engine not initialized');
        }

        console.log(`🤔 Making decision: ${decisionType}`, context);

        // Get relevant knowledge
        const knowledge = await this.knowledgeGraph.getRecommendationsForTask({
            type: decisionType,
            payload: context
        });

        // Evaluate decision rules
        const ruleBasedDecision = this.evaluateRules(decisionType, context, knowledge);
        
        // Apply machine learning insights if available
        const mlEnhancedDecision = await this.enhanceWithML(ruleBasedDecision, context, knowledge);
        
        // Calculate confidence
        const confidence = this.calculateDecisionConfidence(mlEnhancedDecision, context, knowledge);
        
        // Apply risk management
        const finalDecision = this.applyRiskManagement(mlEnhancedDecision, confidence, options);
        
        // Learn from this decision
        await this.recordDecision(decisionType, context, finalDecision, confidence);
        
        console.log(`✅ Decision made with ${(confidence * 100).toFixed(1)}% confidence`);
        
        return {
            decision: finalDecision,
            confidence: confidence,
            reasoning: this.explainDecision(finalDecision, context),
            alternatives: this.generateAlternatives(finalDecision, context),
            metadata: {
                decisionType,
                timestamp: new Date().toISOString(),
                rulesUsed: ruleBasedDecision.rulesUsed,
                knowledgeUsed: knowledge
            }
        };
    }

    evaluateRules(decisionType, context, knowledge) {
        const rules = this.decisionRules.get(decisionType);
        if (!rules) {
            return this.getDefaultDecision(decisionType, context);
        }

        const matchingRules = rules.conditions.filter(rule =>
            this.ruleMatchesContext(rule.when, context, knowledge)
        );

        if (matchingRules.length === 0) {
            return this.getDefaultDecision(decisionType, context);
        }

        // Select best matching rule
        const bestRule = matchingRules.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        return {
            action: bestRule.then,
            confidence: bestRule.confidence,
            rulesUsed: [bestRule],
            source: 'rule_based'
        };
    }

    ruleMatchesContext(conditions, context, knowledge) {
        return Object.entries(conditions).every(([key, value]) => {
            if (key === 'type' || key === 'method' || key === 'target') {
                return context[key] === value;
            }
            
            if (key === 'complexity' || key === 'depth') {
                return this.evaluateComplexityCondition(context, value);
            }
            
            if (key === 'error') {
                return context.error?.includes(value);
            }
            
            return context[key] === value;
        });
    }

    evaluateComplexityCondition(context, expectedComplexity) {
        const actualComplexity = context.complexity || 'medium';
        const complexityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
        
        return complexityLevels[actualComplexity] >= complexityLevels[expectedComplexity];
    }

    async enhanceWithML(ruleDecision, context, knowledge) {
        // Use knowledge graph patterns to enhance decision
        const patterns = knowledge.relevantPatterns;
        
        if (patterns.length > 0) {
            const patternWeights = patterns.map(pattern => ({
                pattern,
                weight: pattern.successRate * pattern.frequency
            }));
            
            const totalWeight = patternWeights.reduce((sum, pw) => sum + pw.weight, 0);
            
            if (totalWeight > 0) {
                // Adjust decision based on patterns
                const patternInfluence = patternWeights.reduce((influence, pw) => {
                    const pattern = pw.pattern;
                    if (pattern.typicalDuration && pattern.typicalDuration < 5000) {
                        influence.speedBoost = true;
                    }
                    if (pattern.successRate > 0.8) {
                        influence.confidenceBoost = 0.1;
                    }
                    return influence;
                }, { speedBoost: false, confidenceBoost: 0 });
                
                return {
                    ...ruleDecision,
                    action: {
                        ...ruleDecision.action,
                        ...(patternInfluence.speedBoost && { priority: 'high' })
                    },
                    confidence: Math.min(1.0, ruleDecision.confidence + patternInfluence.confidenceBoost),
                    source: 'ml_enhanced',
                    patternsUsed: patterns.map(p => p.name)
                };
            }
        }
        
        return ruleDecision;
    }

    calculateDecisionConfidence(decision, context, knowledge) {
        let confidence = decision.confidence || 0.5;
        
        // Boost confidence based on historical success
        const similarTasks = knowledge.similarTasks;
        if (similarTasks.length > 0) {
            const successRate = similarTasks.filter(t => t.success).length / similarTasks.length;
            confidence = (confidence + successRate) / 2;
        }
        
        // Reduce confidence for high-risk contexts
        if (context.urgency === 'high') {
            confidence *= 0.9; // Slightly reduce confidence for urgent tasks
        }
        
        // Boost confidence for familiar patterns
        if (decision.patternsUsed && decision.patternsUsed.length > 0) {
            confidence *= 1.1;
        }
        
        return Math.min(confidence, 1.0);
    }

    applyRiskManagement(decision, confidence, options) {
        const riskTolerance = options.riskTolerance || this.riskTolerance;
        
        if (confidence < riskTolerance) {
            // High risk - apply conservative approach
            return {
                ...decision,
                action: this.applyConservativeMeasures(decision.action),
                riskLevel: 'high',
                fallbackPrepared: true
            };
        } else if (confidence < this.confidenceThreshold) {
            // Medium risk - prepare fallbacks
            return {
                ...decision,
                riskLevel: 'medium',
                fallbackPlan: this.generateFallbackPlan(decision.action)
            };
        } else {
            // Low risk - proceed confidently
            return {
                ...decision,
                riskLevel: 'low'
            };
        }
    }

    applyConservativeMeasures(action) {
        // For high-risk decisions, use more conservative approaches
        return {
            ...action,
            level: 'conservative',
            validation: 'extensive',
            timeout: (action.timeout || 30000) * 1.5 // Increase timeout
        };
    }

    generateFallbackPlan(primaryAction) {
        const actionType = primaryAction.system || primaryAction.strategy;
        
        for (const [scenario, strategies] of this.fallbackStrategies) {
            if (scenario.includes(actionType)) {
                return {
                    primary: strategies.primary,
                    secondary: strategies.secondary,
                    tertiary: strategies.tertiary
                };
            }
        }
        
        // Default fallback plan
        return {
            primary: 'rule_based',
            secondary: 'template_based',
            tertiary: 'manual'
        };
    }

    getDefaultDecision(decisionType, context) {
        const defaults = {
            'system_selection': { system: 'ai_code_gen', priority: 'medium' },
            'error_handling': { action: 'retry', attempts: 2, delay: 1000 },
            'optimization': { strategy: 'basic_optimization', level: 'moderate' }
        };
        
        return {
            action: defaults[decisionType] || { action: 'proceed' },
            confidence: 0.5,
            rulesUsed: [],
            source: 'default'
        };
    }

    explainDecision(decision, context) {
        const explanations = [];
        
        if (decision.rulesUsed && decision.rulesUsed.length > 0) {
            explanations.push(`Based on ${decision.rulesUsed.length} matching rule(s)`);
        }
        
        if (decision.patternsUsed && decision.patternsUsed.length > 0) {
            explanations.push(`Leveraging ${decision.patternsUsed.length} historical pattern(s)`);
        }
        
        if (decision.riskLevel === 'high') {
            explanations.push('Applied conservative measures due to high risk');
        } else if (decision.riskLevel === 'medium') {
            explanations.push('Proceeding with fallback plan prepared');
        } else {
            explanations.push('High confidence decision based on historical data');
        }
        
        return explanations.join('. ');
    }

    generateAlternatives(primaryDecision, context) {
        const alternatives = [];
        
        // Always include rule-based alternative
        if (primaryDecision.source !== 'rule_based') {
            alternatives.push({
                action: this.getDefaultDecision('system_selection', context).action,
                confidence: 0.6,
                description: 'Rule-based approach'
            });
        }
        
        // Include template-based alternative for code generation
        if (context.type === 'code_generation') {
            alternatives.push({
                action: { system: 'template_based', priority: 'low' },
                confidence: 0.7,
                description: 'Template-based code generation'
            });
        }
        
        return alternatives;
    }

    async recordDecision(decisionType, context, decision, confidence) {
        const decisionId = `decision_${Date.now()}`;
        
        this.learningData.set(decisionId, {
            id: decisionId,
            type: decisionType,
            context,
            decision,
            confidence,
            timestamp: new Date().toISOString(),
            outcome: 'pending' // Will be updated when result is known
        });
        
        // Also record in knowledge graph
        await this.knowledgeGraph.addNode('decision', decisionId, {
            type: decisionType,
            context,
            action: decision.action,
            confidence,
            timestamp: new Date().toISOString()
        });
    }

    async updateDecisionOutcome(decisionId, outcome, result) {
        const decision = this.learningData.get(decisionId);
        if (decision) {
            decision.outcome = outcome;
            decision.result = result;
            decision.completedAt = new Date().toISOString();
            
            // Learn from this outcome
            await this.learnFromDecisionOutcome(decision);
        }
    }

    async learnFromDecisionOutcome(decision) {
        const success = decision.outcome === 'success';
        
        // Update rule confidences
        if (decision.decision.rulesUsed) {
            decision.decision.rulesUsed.forEach(rule => {
                const adjustment = success ? 0.05 : -0.1;
                rule.confidence = Math.max(0.1, Math.min(0.95, rule.confidence + adjustment));
            });
        }
        
        // Update knowledge graph
        await this.knowledgeGraph.addEdge(
            decision.id,
            success ? 'led_to_success' : 'led_to_failure',
            decision.type,
            { confidence: decision.confidence }
        );
    }

    async triggerFallback(errorInfo) {
        console.log(`🔄 Triggering fallback for:`, errorInfo);
        
        const fallbackDecision = await this.makeDecision('error_handling', {
            error: errorInfo.error?.message || errorInfo.type,
            system: errorInfo.system,
            context: errorInfo.context
        });
        
        return {
            action: fallbackDecision.decision.action,
            originalError: errorInfo,
            fallbackStrategy: fallbackDecision.decision.fallbackPlan
        };
    }

    async handleError(error, context) {
        const errorType = this.classifyError(error);
        
        const handlingDecision = await this.makeDecision('error_handling', {
            error: errorType,
            system: context.system,
            urgency: context.urgency || 'medium',
            ...context
        });
        
        return {
            ...handlingDecision,
            errorType,
            recoveryStrategy: this.getRecoveryStrategy(errorType)
        };
    }

    classifyError(error) {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('memory')) return 'memory';
        if (message.includes('network')) return 'network';
        if (message.includes('permission')) return 'permission';
        if (message.includes('not found')) return 'not_found';
        
        return 'unknown';
    }

    getRecoveryStrategy(errorType) {
        const strategies = {
            'timeout': { action: 'retry', delay: 2000, maxAttempts: 3 },
            'memory': { action: 'cleanup', restart: true },
            'network': { action: 'wait', checkConnection: true },
            'permission': { action: 'request_access', userAction: true },
            'not_found': { action: 'fallback', useAlternative: true },
            'unknown': { action: 'log', notifyUser: true }
        };
        
        return strategies[errorType] || strategies.unknown;
    }

    // Analytics and insights
    getDecisionStats() {
        const decisions = Array.from(this.learningData.values());
        const completed = decisions.filter(d => d.outcome !== 'pending');
        
        return {
            total: decisions.length,
            completed: completed.length,
            successRate: completed.filter(d => d.outcome === 'success').length / completed.length || 0,
            averageConfidence: completed.reduce((sum, d) => sum + d.confidence, 0) / completed.length || 0,
            recentDecisions: decisions.slice(-10)
        };
    }

    async learn(interactionData) {
        // Learn from user interactions
        const { input, result, success, performance } = interactionData;
        
        // Update decision rules based on outcomes
        await this.adjustRulesFromInteraction(input, result, success);
        
        // Update confidence thresholds
        this.adjustConfidenceThreshold(success, performance);
        
        console.log('🧠 Learned from interaction:', { success, performance: performance.duration });
    }

    async adjustRulesFromInteraction(input, result, success) {
        // Simple rule adjustment based on outcomes
        // In a real implementation, this would use more sophisticated ML
        const adjustment = success ? 0.02 : -0.05;
        
        for (const [ruleType, rules] of this.decisionRules) {
            rules.conditions.forEach(rule => {
                if (this.ruleMatchesInteraction(rule, input)) {
                    rule.confidence = Math.max(0.1, Math.min(0.95, rule.confidence + adjustment));
                }
            });
        }
    }

    ruleMatchesInteraction(rule, input) {
        // Check if rule conditions match the interaction input
        const inputStr = JSON.stringify(input).toLowerCase();
        const conditionStr = JSON.stringify(rule.when).toLowerCase();
        
        return Object.entries(rule.when).some(([key, value]) =>
            inputStr.includes(value?.toString().toLowerCase())
        );
    }

    adjustConfidenceThreshold(success, performance) {
        // Adjust confidence threshold based on system performance
        if (success && performance.duration < 5000) {
            // Successful and fast - can be more confident
            this.confidenceThreshold = Math.min(0.9, this.confidenceThreshold + 0.01);
        } else if (!success) {
            // Failure - be more conservative
            this.confidenceThreshold = Math.max(0.5, this.confidenceThreshold - 0.02);
        }
    }

    async cleanup() {
        await this.knowledgeGraph.cleanup();
        console.log('🧹 Decision Engine cleaned up');
    }
        }
