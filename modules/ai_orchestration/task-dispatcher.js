import KnowledgeGraph from './knowledge-graph.js';
import PerformanceMonitor from '../ai-performance-monitor.js';

export default class TaskDispatcher {
    constructor() {
        this.knowledgeGraph = new KnowledgeGraph();
        this.performanceMonitor = new PerformanceMonitor();
        this.taskQueue = new Map();
        this.workerPool = new Map();
        this.priorityQueue = [];
        this.isInitialized = false;
        
        this.taskHistory = new Map();
        this.concurrentLimit = 3;
        this.activeTasks = new Set();
    }

    async initialize() {
        console.log('🚀 Initializing Task Dispatcher...');
        
        await this.knowledgeGraph.initialize();
        await this.performanceMonitor.initialize();
        
        this.setupWorkers();
        this.startDispatcherLoop();
        
        this.isInitialized = true;
        console.log('✅ Task Dispatcher Ready');
    }

    setupWorkers() {
        // Define specialized AI workers
        const workers = {
            'code_generation': {
                type: 'ai_worker',
                capabilities: ['code_gen', 'template_fill', 'syntax_check'],
                maxConcurrent: 2,
                timeout: 30000
            },
            'hardware_detection': {
                type: 'io_worker',
                capabilities: ['usb_scan', 'device_id', 'port_management'],
                maxConcurrent: 1,
                timeout: 15000
            },
            'analysis': {
                type: 'ml_worker',
                capabilities: ['code_analysis', 'pattern_detection', 'complexity'],
                maxConcurrent: 3,
                timeout: 20000
            },
            'optimization': {
                type: 'optimization_worker',
                capabilities: ['performance_opt', 'memory_opt', 'size_opt'],
                maxConcurrent: 2,
                timeout: 25000
            },
            'troubleshooting': {
                type: 'diagnostic_worker',
                capabilities: ['error_detection', 'solution_gen', 'validation'],
                maxConcurrent: 2,
                timeout: 30000
            }
        };

        Object.entries(workers).forEach(([name, config]) => {
            this.workerPool.set(name, {
                ...config,
                activeTasks: new Set(),
                performance: { success: 0, failure: 0, avgTime: 0 }
            });
        });
    }

    startDispatcherLoop() {
        setInterval(() => {
            this.processQueue();
        }, 100); // Process every 100ms
    }

    async dispatchTask(taskType, payload, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Task Dispatcher not initialized');
        }

        const taskId = this.generateTaskId();
        const task = {
            id: taskId,
            type: taskType,
            payload: payload,
            options: {
                priority: options.priority || 'medium',
                timeout: options.timeout || 30000,
                retries: options.retries || 2,
                ...options
            },
            status: 'queued',
            createdAt: new Date().toISOString(),
            attempts: 0,
            metadata: {}
        };

        // Enhance task with knowledge graph insights
        await this.enhanceTaskWithKnowledge(task);
        
        // Add to priority queue
        this.addToPriorityQueue(task);
        this.taskQueue.set(taskId, task);

        console.log(`📋 Task queued: ${taskType} [${taskId}]`);
        
        return taskId;
    }

    async enhanceTaskWithKnowledge(task) {
        // Get similar historical tasks
        const similarTasks = await this.knowledgeGraph.findSimilarTasks(task);
        
        if (similarTasks.length > 0) {
            task.metadata.historicalInsights = similarTasks.slice(0, 3);
            task.metadata.expectedDuration = this.calculateExpectedDuration(similarTasks);
            task.metadata.commonIssues = this.extractCommonIssues(similarTasks);
        }

        // Get performance expectations
        const performanceData = this.performanceMonitor.getWorkerPerformance(task.type);
        task.metadata.performanceExpectation = performanceData;

        // Determine best worker based on history
        task.metadata.recommendedWorker = this.selectOptimalWorker(task);
    }

    addToPriorityQueue(task) {
        const priorityWeights = {
            'critical': 100,
            'high': 75,
            'medium': 50,
            'low': 25
        };

        const priorityScore = priorityWeights[task.options.priority] || 50;
        
        // Insert with priority score
        this.priorityQueue.push({ task, score: priorityScore });
        this.priorityQueue.sort((a, b) => b.score - a.score);
    }

    async processQueue() {
        if (this.activeTasks.size >= this.concurrentLimit) {
            return; // Respect concurrent limit
        }

        if (this.priorityQueue.length === 0) {
            return; // No tasks to process
        }

        const { task } = this.priorityQueue.shift();
        
        if (this.canExecuteTask(task)) {
            await this.executeTask(task);
        } else {
            // Re-queue if cannot execute now
            this.addToPriorityQueue(task);
        }
    }

    canExecuteTask(task) {
        const worker = this.workerPool.get(task.metadata.recommendedWorker);
        
        if (!worker) return false;
        if (worker.activeTasks.size >= worker.maxConcurrent) return false;
        
        // Check resource constraints
        if (!this.hasSufficientResources(task)) return false;
        
        return true;
    }

    hasSufficientResources(task) {
        // Check system resources before executing task
        const memory = performance.memory;
        if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
            return false; // Low memory
        }
        
        return true;
    }

    async executeTask(task) {
        task.status = 'executing';
        task.startedAt = new Date().toISOString();
        task.attempts++;
        
        const workerName = task.metadata.recommendedWorker;
        const worker = this.workerPool.get(workerName);
        
        worker.activeTasks.add(task.id);
        this.activeTasks.add(task.id);

        console.log(`⚡ Executing task: ${task.type} with ${workerName}`);

        try {
            const result = await this.executeWithWorker(workerName, task);
            
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            task.result = result;
            
            // Update performance metrics
            this.updateWorkerPerformance(workerName, true, task.startedAt);
            
            // Learn from successful execution
            await this.learnFromSuccess(task, result);
            
            // Notify completion
            this.notifyTaskCompletion(task);
            
        } catch (error) {
            task.status = 'failed';
            task.error = error;
            
            // Update performance metrics
            this.updateWorkerPerformance(workerName, false, task.startedAt);
            
            // Handle failure
            await this.handleTaskFailure(task, error);
            
        } finally {
            worker.activeTasks.delete(task.id);
            this.activeTasks.delete(task.id);
            this.taskQueue.delete(task.id);
        }
    }

    async executeWithWorker(workerName, task) {
        const worker = this.workerPool.get(workerName);
        
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Worker ${workerName} timeout after ${worker.timeout}ms`));
            }, worker.timeout);

            try {
                // Route to appropriate worker implementation
                const result = await this.routeToWorkerImplementation(workerName, task);
                clearTimeout(timeout);
                resolve(result);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    async routeToWorkerImplementation(workerName, task) {
        switch (workerName) {
            case 'code_generation':
                return await this.executeCodeGeneration(task);
            case 'hardware_detection':
                return await this.executeHardwareDetection(task);
            case 'analysis':
                return await this.executeAnalysis(task);
            case 'optimization':
                return await this.executeOptimization(task);
            case 'troubleshooting':
                return await this.executeTroubleshooting(task);
            default:
                throw new Error(`Unknown worker: ${workerName}`);
        }
    }

    async executeCodeGeneration(task) {
        // Simulate AI code generation
        await this.simulateProcessing(1000 + Math.random() * 2000);
        
        return {
            code: `// Generated code for: ${task.payload.description}`,
            language: 'arduino',
            complexity: 'medium',
            validation: { syntax: true, structure: true }
        };
    }

    async executeHardwareDetection(task) {
        // Simulate hardware detection
        await this.simulateProcessing(500 + Math.random() * 1500);
        
        return {
            detected: true,
            device: 'arduino_uno',
            port: 'COM3',
            capabilities: ['digital_io', 'analog_input', 'pwm']
        };
    }

    async executeAnalysis(task) {
        // Simulate code analysis
        await this.simulateProcessing(800 + Math.random() * 1200);
        
        return {
            complexity: 0.7,
            issues: [],
            suggestions: ['Add more comments', 'Optimize loop structure'],
            metrics: { lines: 45, functions: 3, variables: 12 }
        };
    }

    async executeOptimization(task) {
        // Simulate optimization
        await this.simulateProcessing(1200 + Math.random() * 1800);
        
        return {
            originalSize: 2048,
            optimizedSize: 1560,
            improvements: ['Reduced variable scope', 'Optimized loop'],
            performanceGain: 0.15
        };
    }

    async executeTroubleshooting(task) {
        // Simulate troubleshooting
        await this.simulateProcessing(1500 + Math.random() * 2500);
        
        return {
            issues: ['Memory leak detected', 'Inefficient algorithm'],
            solutions: ['Use PROGMEM for strings', 'Implement circular buffer'],
            confidence: 0.85
        };
    }

    async handleTaskFailure(task, error) {
        console.error(`❌ Task ${task.id} failed:`, error);
        
        if (task.attempts < task.options.retries) {
            console.log(`🔄 Retrying task ${task.id} (attempt ${task.attempts + 1})`);
            
            // Update task for retry
            task.status = 'queued';
            task.options.priority = 'high'; // Higher priority for retry
            
            // Add back to queue
            this.addToPriorityQueue(task);
            this.taskQueue.set(task.id, task);
            
        } else {
            // Final failure
            await this.learnFromFailure(task, error);
            this.notifyTaskFailure(task, error);
        }
    }

    async learnFromSuccess(task, result) {
        // Store successful task in knowledge graph
        await this.knowledgeGraph.recordTaskSuccess(task, result);
        
        // Update performance metrics
        this.performanceMonitor.recordSuccess(task.type, task.startedAt);
    }

    async learnFromFailure(task, error) {
        // Store failure in knowledge graph
        await this.knowledgeGraph.recordTaskFailure(task, error);
        
        // Update performance metrics
        this.performanceMonitor.recordFailure(task.type, task.startedAt);
    }

    notifyTaskCompletion(task) {
        const event = new CustomEvent('task_completed', {
            detail: {
                taskId: task.id,
                type: task.type,
                result: task.result,
                duration: new Date(task.completedAt) - new Date(task.startedAt)
            }
        });
        
        document.dispatchEvent(event);
    }

    notifyTaskFailure(task, error) {
        const event = new CustomEvent('task_failed', {
            detail: {
                taskId: task.id,
                type: task.type,
                error: error,
                attempts: task.attempts
            }
        });
        
        document.dispatchEvent(event);
    }

    selectOptimalWorker(task) {
        const suitableWorkers = Array.from(this.workerPool.entries())
            .filter(([name, worker]) => worker.capabilities.some(cap => 
                task.type.includes(cap) || cap.includes(task.type)
            ))
            .map(([name, worker]) => ({ name, performance: worker.performance }));

        if (suitableWorkers.length === 0) {
            return 'code_generation'; // Default fallback
        }

        // Select worker with best performance for this task type
        return suitableWorkers.reduce((best, current) => {
            const bestScore = this.calculateWorkerScore(best, task);
            const currentScore = this.calculateWorkerScore(current, task);
            return currentScore > bestScore ? current : best;
        }).name;
    }

    calculateWorkerScore(worker, task) {
        const perf = worker.performance;
        const successRate = perf.success / (perf.success + perf.failure) || 0.5;
        const avgTime = perf.avgTime || 5000;
        
        // Prefer workers with high success rate and low average time
        return successRate * (10000 / avgTime);
    }

    calculateExpectedDuration(similarTasks) {
        if (similarTasks.length === 0) return 5000;
        
        const durations = similarTasks.map(t => t.duration).filter(d => d);
        return durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    extractCommonIssues(similarTasks) {
        const issues = new Map();
        
        similarTasks.forEach(task => {
            if (task.issues) {
                task.issues.forEach(issue => {
                    issues.set(issue, (issues.get(issue) || 0) + 1);
                });
            }
        });
        
        return Array.from(issues.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([issue]) => issue);
    }

    updateWorkerPerformance(workerName, success, startTime) {
        const worker = this.workerPool.get(workerName);
        const duration = Date.now() - new Date(startTime);
        
        if (success) {
            worker.performance.success++;
        } else {
            worker.performance.failure++;
        }
        
        // Update average time
        const totalTasks = worker.performance.success + worker.performance.failure;
        worker.performance.avgTime = (
            (worker.performance.avgTime * (totalTasks - 1)) + duration
        ) / totalTasks;
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async simulateProcessing(delay) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Monitoring and statistics
    getQueueStatus() {
        return {
            queued: this.priorityQueue.length,
            active: this.activeTasks.size,
            workers: Object.fromEntries(
                Array.from(this.workerPool.entries()).map(([name, worker]) => [
                    name,
                    {
                        active: worker.activeTasks.size,
                        max: worker.maxConcurrent,
                        performance: worker.performance
                    }
                ])
            ),
            history: {
                total: this.taskHistory.size,
                recent: Array.from(this.taskHistory.values()).slice(-10)
            }
        };
    }

    async cleanup() {
        // Cancel all active tasks
        this.activeTasks.clear();
        this.priorityQueue = [];
        this.taskQueue.clear();
        
        console.log('🧹 Task Dispatcher cleaned up');
    }
                  }
