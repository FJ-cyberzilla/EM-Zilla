export default class ContextManager {
    constructor() {
        this.sessionContext = new Map();
        this.userContext = new Map();
        this.systemContext = new Map();
        this.historicalContext = new Map();
        this.contextListeners = new Set();
        this.isInitialized = false;
        
        this.contextRetentionTime = 24 * 60 * 60 * 1000; // 24 hours
    }

    async initialize() {
        console.log('🎭 Initializing Context Manager...');
        
        // Load persisted context
        await this.loadPersistedContext();
        
        // Initialize default contexts
        this.initializeDefaultContexts();
        
        // Start cleanup interval
        this.startCleanupInterval();
        
        this.isInitialized = true;
        console.log('✅ Context Manager Ready');
    }

    initializeDefaultContexts() {
        // System context
        this.systemContext.set('capabilities', {
            ai_systems: ['code_generation', 'analysis', 'optimization'],
            hardware_support: ['usb_detection', 'serial_communication'],
            ml_capabilities: ['pattern_recognition', 'complexity_analysis']
        });

        this.systemContext.set('performance', {
            average_response_time: 2500,
            success_rate: 0.95,
            resource_usage: 'moderate'
        });

        // User context defaults
        this.userContext.set('preferences', {
            code_style: 'descriptive',
            optimization_level: 'balanced',
            feedback_level: 'detailed'
        });

        this.userContext.set('expertise', {
            level: 'intermediate',
            familiar_concepts: ['variables', 'functions', 'loops'],
            learning_goals: ['iot', 'sensors', 'displays']
        });
    }

    // Session Management
    createSession(sessionId, initialContext = {}) {
        const session = {
            id: sessionId,
            startTime: new Date().toISOString(),
            context: { ...initialContext },
            interactions: [],
            metadata: {
                device: this.getDeviceInfo(),
                userAgent: navigator.userAgent,
                platform: navigator.platform
            }
        };

        this.sessionContext.set(sessionId, session);
        this.notifyContextChange('session_created', { sessionId, context: initialContext });
        
        return sessionId;
    }

    async updateSession(sessionId, updates) {
        const session = this.sessionContext.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Deep merge updates
        session.context = this.deepMerge(session.context, updates);
        session.lastUpdate = new Date().toISOString();

        // Record interaction
        if (updates.interaction) {
            session.interactions.push({
                timestamp: new Date().toISOString(),
                type: updates.interaction.type,
                input: updates.interaction.input,
                result: updates.interaction.result
            });
        }

        this.sessionContext.set(sessionId, session);
        this.notifyContextChange('session_updated', { sessionId, updates });

        // Persist important context changes
        await this.persistContext();
        
        return session.context;
    }

    getSession(sessionId) {
        return this.sessionContext.get(sessionId);
    }

    getCurrentContext(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) return {};
        
        return {
            session: session.context,
            user: Object.fromEntries(this.userContext),
            system: Object.fromEntries(this.systemContext),
            historical: this.getRelevantHistory(sessionId)
        };
    }

    // User Context Management
    updateUserContext(updates) {
        this.userContext = new Map([...this.userContext, ...Object.entries(updates)]);
        this.notifyContextChange('user_updated', { updates });
    }

    getUserPreference(key, defaultValue = null) {
        const preferences = this.userContext.get('preferences') || {};
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }

    updateUserPreference(key, value) {
        const preferences = this.userContext.get('preferences') || {};
        preferences[key] = value;
        this.userContext.set('preferences', preferences);
        this.notifyContextChange('preference_updated', { key, value });
    }

    // System Context Management
    updateSystemContext(updates) {
        this.systemContext = new Map([...this.systemContext, ...Object.entries(updates)]);
        this.notifyContextChange('system_updated', { updates });
    }

    getSystemCapability(capability) {
        const capabilities = this.systemContext.get('capabilities') || {};
        return capabilities[capability] || false;
    }

    // Historical Context
    getRelevantHistory(sessionId, limit = 5) {
        const currentSession = this.getSession(sessionId);
        if (!currentSession) return [];

        const relevant = Array.from(this.historicalContext.values())
            .filter(history => this.isHistoryRelevant(history, currentSession))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        return relevant;
    }

    isHistoryRelevant(history, currentSession) {
        // Simple relevance check - could be enhanced with ML
        const currentConcepts = this.extractConcepts(currentSession.context);
        const historicalConcepts = this.extractConcepts(history.context);
        
        const commonConcepts = currentConcepts.filter(concept =>
            historicalConcepts.includes(concept)
        );
        
        return commonConcepts.length > 0;
    }

    extractConcepts(context) {
        const concepts = new Set();
        
        const walkObject = (obj) => {
            if (typeof obj === 'string') {
                // Simple concept extraction from strings
                const words = obj.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                words.forEach(word => concepts.add(word));
            } else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(walkObject);
            }
        };
        
        walkObject(context);
        return Array.from(concepts);
    }

    async archiveSession(sessionId) {
        const session = this.sessionContext.get(sessionId);
        if (!session) return;

        session.endTime = new Date().toISOString();
        session.archived = true;

        // Move to historical context
        this.historicalContext.set(sessionId, session);
        this.sessionContext.delete(sessionId);

        // Clean up old history
        await this.cleanupOldHistory();
        
        this.notifyContextChange('session_archived', { sessionId });
    }

    // Context Processing
    async processUpdate(update) {
        const { type, data, sessionId, priority = 'medium' } = update;
        
        console.log(`🔄 Processing context update: ${type}`, { priority, sessionId });

        switch (type) {
            case 'hardware_connected':
                await this.processHardwareUpdate(data, sessionId);
                break;
                
            case 'code_generated':
                await this.processCodeGeneration(data, sessionId);
                break;
                
            case 'error_occurred':
                await this.processError(data, sessionId);
                break;
                
            case 'user_feedback':
                await this.processUserFeedback(data, sessionId);
                break;
                
            case 'performance_metric':
                await this.processPerformanceMetric(data);
                break;
                
            default:
                console.warn(`Unknown context update type: ${type}`);
        }

        this.notifyContextChange('update_processed', { type, data, sessionId });
    }

    async processHardwareUpdate(data, sessionId) {
        const updates = {
            connected_hardware: {
                device: data.device,
                model: data.model,
                capabilities: data.capabilities,
                connected_at: new Date().toISOString()
            },
            system: {
                current_device: data.model,
                available_interfaces: ['usb', 'serial']
            }
        };

        await this.updateSession(sessionId, updates);
        
        // Update user context with hardware preferences
        this.updateUserContext({
            last_used_device: data.model,
            preferred_interfaces: ['usb']
        });
    }

    async processCodeGeneration(data, sessionId) {
        const updates = {
            last_generation: {
                timestamp: new Date().toISOString(),
                type: data.type,
                complexity: data.complexity,
                success: data.success
            },
            coding_patterns: this.extractCodingPatterns(data)
        };

        if (data.success) {
            updates.successful_generations = (
                this.getSession(sessionId)?.context.successful_generations || 0
            ) + 1;
        }

        await this.updateSession(sessionId, updates);
        
        // Update system performance metrics
        this.updateSystemContext({
            performance: {
                last_generation_time: data.duration,
                total_generations: (
                    this.systemContext.get('performance')?.total_generations || 0
                ) + 1
            }
        });
    }

    extractCodingPatterns(data) {
        const patterns = [];
        
        if (data.code?.includes('void loop()')) {
            patterns.push('standard_arduino_structure');
        }
        
        if (data.code?.includes('Serial.')) {
            patterns.push('serial_communication');
        }
        
        if (data.code?.includes('analogRead') || data.code?.includes('digitalRead')) {
            patterns.push('sensor_reading');
        }
        
        return patterns;
    }

    async processError(data, sessionId) {
        const updates = {
            recent_errors: [
                ...(this.getSession(sessionId)?.context.recent_errors || []),
                {
                    type: data.type,
                    message: data.message,
                    timestamp: new Date().toISOString(),
                    resolved: false
                }
            ].slice(-10) // Keep only last 10 errors
        };

        await this.updateSession(sessionId, updates);
        
        // Update system error statistics
        this.updateSystemContext({
            errors: {
                total: (this.systemContext.get('errors')?.total || 0) + 1,
                by_type: {
                    ...this.systemContext.get('errors')?.by_type,
                    [data.type]: (this.systemContext.get('errors')?.by_type?.[data.type] || 0) + 1
                }
            }
        });
    }

    async processUserFeedback(data, sessionId) {
        const updates = {
            user_feedback: {
                ...data,
                timestamp: new Date().toISOString()
            }
        };

        await this.updateSession(sessionId, updates);
        
        // Learn from feedback
        if (data.rating !== undefined) {
            this.learnFromRating(data.rating, data.comments);
        }
    }

    async processPerformanceMetric(data) {
        this.updateSystemContext({
            performance: {
                ...this.systemContext.get('performance'),
                ...data,
                last_updated: new Date().toISOString()
            }
        });
    }

    learnFromRating(rating, comments) {
        // Simple learning from user ratings
        if (rating >= 4) {
            // Positive feedback - reinforce current approaches
            this.updateUserPreference('satisfaction_level', 'high');
        } else if (rating <= 2) {
            // Negative feedback - adjust approaches
            this.updateUserPreference('satisfaction_level', 'low');
            
            // Extract learning from comments
            if (comments?.toLowerCase().includes('slow')) {
                this.updateSystemContext({
                    performance: { needs_optimization: true }
                });
            }
        }
    }

    // Context Querying
    queryContext(query, sessionId) {
        const context = this.getCurrentContext(sessionId);
        
        switch (query.type) {
            case 'capability_check':
                return this.queryCapabilities(query, context);
                
            case 'preference_check':
                return this.queryPreferences(query, context);
                
            case 'history_search':
                return this.queryHistory(query, context);
                
            case 'system_status':
                return this.querySystemStatus(query, context);
                
            default:
                return { available: false, reason: 'unknown_query_type' };
        }
    }

    queryCapabilities(query, context) {
        const { required_capabilities } = query;
        const available = this.systemContext.get('capabilities') || {};
        
        const missing = required_capabilities.filter(cap => !available[cap]);
        
        return {
            available: missing.length === 0,
            missing_capabilities: missing,
            available_capabilities: available
        };
    }

    queryPreferences(query, context) {
        const { preference_keys } = query;
        const preferences = this.userContext.get('preferences') || {};
        
        const results = {};
        preference_keys.forEach(key => {
            results[key] = preferences[key] !== undefined ? preferences[key] : null;
        });
        
        return results;
    }

    queryHistory(query, context) {
        const { search_terms, max_results = 5 } = query;
        const relevantHistory = this.getRelevantHistory(context.session?.id, max_results);
        
        const matching = relevantHistory.filter(history =>
            this.historyMatchesSearch(history, search_terms)
        );
        
        return {
            matches: matching,
            total_found: matching.length,
            search_terms
        };
    }

    historyMatchesSearch(history, searchTerms) {
        const historyText = JSON.stringify(history).toLowerCase();
        return searchTerms.some(term =>
            historyText.includes(term.toLowerCase())
        );
    }

    querySystemStatus(query, context) {
        return {
            system: context.system,
            performance: context.system.performance,
            errors: context.system.errors,
            recommendations: this.generateSystemRecommendations(context)
        };
    }

    generateSystemRecommendations(context) {
        const recommendations = [];
        const performance = context.system.performance || {};
        
        if (performance.average_response_time > 5000) {
            recommendations.push({
                type: 'performance',
                message: 'System response time is high',
                suggestion: 'Consider optimizing AI model loading'
            });
        }
        
        if (context.system.errors?.total > 10) {
            recommendations.push({
                type: 'reliability',
                message: 'High error rate detected',
                suggestion: 'Review error handling and fallback strategies'
            });
        }
        
        return recommendations;
    }

    // Event Handling
    onContextChange(callback) {
        this.contextListeners.add(callback);
    }

    notifyContextChange(eventType, data) {
        this.contextListeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('Context change callback error:', error);
            }
        });
    }

    // Persistence
    async persistContext() {
        try {
            const context = {
                userContext: Array.from(this.userContext.entries()),
                systemContext: Array.from(this.systemContext.entries()),
                historicalContext: Array.from(this.historicalContext.entries()),
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('vita_coder_context', JSON.stringify(context));
        } catch (error) {
            console.warn
