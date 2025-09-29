export default class USBStatusMonitor {
    constructor(usbDetector) {
        this.usbDetector = usbDetector;
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.statusCallbacks = new Set();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for USB connection events
        this.usbDetector.onConnection((model, port) => {
            this.handleConnection(model, port);
        });

        this.usbDetector.onDisconnection(() => {
            this.handleDisconnection();
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkConnectionStatus();
            }
        });
    }

    startMonitoring(interval = 5000) {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitorInterval = setInterval(() => {
            this.checkConnectionStatus();
        }, interval);

        console.log('🔍 USB status monitoring started');
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('🔍 USB status monitoring stopped');
    }

    async checkConnectionStatus() {
        try {
            const status = this.usbDetector.getStatus();
            
            if (!status.connected) {
                // Try to auto-reconnect if previously connected
                await this.attemptReconnect();
            }
            
            this.notifyStatus(status);
            
        } catch (error) {
            console.warn('Status check failed:', error);
        }
    }

    async attemptReconnect() {
        try {
            const devices = await this.usbDetector.scanForDevices();
            if (devices.length > 0) {
                console.log('🔄 Attempting to reconnect to Arduino...');
                // Auto-reconnect to first detected device
                await this.usbDetector.detectArduino();
            }
        } catch (error) {
            // Silent fail - device might be intentionally disconnected
        }
    }

    handleConnection(model, port) {
        console.log(`✅ Arduino ${model} connected`);
        
        const status = {
            event: 'connected',
            model: model,
            port: port.getInfo(),
            timestamp: new Date().toISOString(),
            message: `Arduino ${model} is ready`
        };
        
        this.notifyStatus(status);
        this.startMonitoring(); // Start monitoring after connection
    }

    handleDisconnection() {
        console.log('❌ Arduino disconnected');
        
        const status = {
            event: 'disconnected',
            model: null,
            port: null,
            timestamp: new Date().toISOString(),
            message: 'Arduino disconnected'
        };
        
        this.notifyStatus(status);
    }

    onStatusChange(callback) {
        this.statusCallbacks.add(callback);
    }

    notifyStatus(status) {
        this.statusCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (error) {
                console.error('Status callback error:', error);
            }
        });
    }

    getCurrentStatus() {
        return this.usbDetector.getStatus();
    }

    // Device health monitoring
    async checkDeviceHealth() {
        if (!this.usbDetector.isConnected) {
            return { status: 'disconnected', health: 'unknown' };
        }

        try {
            // Send health check command
            const response = await this.usbDetector.sendCommand('AT\r\n', 1000);
            
            return {
                status: 'connected',
                health: 'good',
                response: response,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'connected',
                health: 'unresponsive',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Get detailed device report
    async getDeviceReport() {
        const status = this.getCurrentStatus();
        const health = await this.checkDeviceHealth();
        
        return {
            connection: status,
            health: health,
            capabilities: await this.getDeviceCapabilities(),
            recommendations: this.getConnectionRecommendations(status)
        };
    }

    async getDeviceCapabilities() {
        if (!this.usbDetector.isConnected) {
            return [];
        }

        const model = await this.usbDetector.identifyModel();
        const capabilities = {
            'uno': ['digital_io', 'analog_input', 'pwm', 'serial'],
            'nano': ['digital_io', 'analog_input', 'pwm', 'serial', 'compact'],
            'mega': ['digital_io', 'analog_input', 'pwm', 'serial', 'multiple_serial', 'more_memory'],
            'leonardo': ['digital_io', 'analog_input', 'pwm', 'serial', 'usb_hid'],
            'esp32': ['wifi', 'bluetooth', 'digital_io', 'analog_input', 'pwm', 'more_memory']
        };

        return capabilities[model] || ['basic_arduino'];
    }

    getConnectionRecommendations(status) {
        const recommendations = [];
        
        if (!status.supported) {
            recommendations.push({
                type: 'browser',
                message: 'Use Chrome, Edge, or Opera for USB support',
                priority: 'high'
            });
        }
        
        if (status.connected && status.port) {
            recommendations.push({
                type: 'connection',
                message: 'Connection stable',
                priority: 'low'
            });
        } else {
            recommendations.push({
                type: 'connection',
                message: 'Connect an Arduino device',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
}
