export default class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.isMonitoring = false;
    }

    start() {
        this.isMonitoring = true;
        console.log('📊 AI Performance Monitor Started');
    }

    stop() {
        this.isMonitoring = false;
        console.log('📊 AI Performance Monitor Stopped');
    }

    recordMetric(name, value) {
        this.metrics.set(name, { value, timestamp: Date.now() });
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}
