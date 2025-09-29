export default class USBDetector {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.isScanning = false;
        this.detectedDevices = new Map();
        this.connectionCallbacks = new Set();
        this.disconnectionCallbacks = new Set();
        
        // Arduino device signatures
        this.arduinoSignatures = {
            vendors: [0x2341, 0x2A03, 0x1B4F, 0x0403], // Arduino, Adafruit, FTDI
            products: {
                // Arduino Uno
                'UNO': { vendor: 0x2341, product: 0x0043, name: 'Arduino Uno' },
                'UNO_R3': { vendor: 0x2341, product: 0x0043, name: 'Arduino Uno R3' },
                // Arduino Nano
                'NANO': { vendor: 0x2341, product: 0x0010, name: 'Arduino Nano' },
                'NANO_CLONE': { vendor: 0x1A86, product: 0x7523, name: 'Arduino Nano (CH340)' },
                // Arduino Mega
                'MEGA': { vendor: 0x2341, product: 0x0010, name: 'Arduino Mega' },
                'MEGA2560': { vendor: 0x2341, product: 0x0042, name: 'Arduino Mega 2560' },
                // Arduino Leonardo
                'LEONARDO': { vendor: 0x2341, product: 0x0036, name: 'Arduino Leonardo' },
                // ESP32
                'ESP32': { vendor: 0x10C4, product: 0xEA60, name: 'ESP32 Dev Module' },
                // Generic
                'GENERIC': { vendor: 0x2341, product: null, name: 'Generic Arduino' }
            }
        };
    }

    // Check if Web Serial API is supported
    isSupported() {
        return 'serial' in navigator;
    }

    // Request port access and detect Arduino
    async detectArduino() {
        if (!this.isSupported()) {
            throw new Error('Web Serial API not supported in this browser. Use Chrome, Edge, or Opera.');
        }

        try {
            console.log('🔍 Starting Arduino detection...');
            
            // Request port with Arduino filters
            const filters = this.getArduinoFilters();
            this.port = await navigator.serial.requestPort({ filters });
            
            console.log('📡 Port selected:', this.port.getInfo());
            
            // Open the port
            await this.openPort();
            
            // Identify the Arduino model
            const model = await this.identifyModel();
            
            this.isConnected = true;
            this.notifyConnection(model);
            
            console.log(`✅ Arduino detected: ${model}`);
            return model;
            
        } catch (error) {
            console.error('❌ Arduino detection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    // Get filters for Arduino devices
    getArduinoFilters() {
        return [
            { usbVendorId: 0x2341 }, // Arduino
            { usbVendorId: 0x2A03 }, // Arduino.org
            { usbVendorId: 0x1B4F }, // SparkFun
            { usbVendorId: 0x1A86 }, // CH340 (common clone)
            { usbVendorId: 0x10C4 }, // ESP32
            { usbVendorId: 0x0403 }  // FTDI
        ];
    }

    // Open serial port with Arduino-friendly settings
    async openPort(baudRate = 9600) {
        if (!this.port) {
            throw new Error('No port selected');
        }

        await this.port.open({
            baudRate: baudRate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
        });

        console.log(`🔌 Port opened at ${baudRate} baud`);
    }

    // Identify Arduino model by sending identification commands
    async identifyModel() {
        if (!this.port) {
            throw new Error('Port not open');
        }

        try {
            // Try multiple identification methods
            const methods = [
                this.identifyByUSBInfo.bind(this),
                this.identifyByCommandResponse.bind(this),
                this.identifyByBehavior.bind(this)
            ];

            for (const method of methods) {
                try {
                    const model = await method();
                    if (model) {
                        return model;
                    }
                } catch (error) {
                    console.warn(`Identification method failed:`, error);
                }
            }

            // Fallback to generic detection
            return await this.fallbackIdentification();
            
        } catch (error) {
            console.error('Model identification failed:', error);
            return 'unknown';
        }
    }

    // Identify by USB vendor/product ID
    async identifyByUSBInfo() {
        const info = this.port.getInfo();
        console.log('USB Info:', info);

        if (info.usbVendorId && info.usbProductId) {
            for (const [key, signature] of Object.entries(this.arduinoSignatures.products)) {
                if (info.usbVendorId === signature.vendor && 
                    (signature.product === null || info.usbProductId === signature.product)) {
                    return key.toLowerCase();
                }
            }
        }

        return null;
    }

    // Identify by sending commands and reading responses
    async identifyByCommandResponse() {
        const commands = [
            { command: 'AT+GMR\r\n', expected: 'ESP32', timeout: 1000 }, // ESP32
            { command: 'ATI\r\n', expected: 'Arduino', timeout: 1000 },   // Some Arduinos
            { command: '\r\n', expected: 'ready', timeout: 500 }          // Basic response
        ];

        for (const { command, expected, timeout } of commands) {
            try {
                const response = await this.sendCommand(command, timeout);
                if (response && response.includes(expected)) {
                    return this.mapResponseToModel(response);
                }
            } catch (error) {
                // Continue to next command
            }
        }

        return null;
    }

    // Identify by behavioral patterns
    async identifyByBehavior() {
        // Send a reset command and observe behavior
        await this.sendCommand('\r\n', 500);
        
        // Try to detect baud rate automatically
        const detectedBaud = await this.detectBaudRate();
        if (detectedBaud) {
            console.log(`📊 Detected baud rate: ${detectedBaud}`);
        }

        // Based on behavior, make educated guess
        return this.behavioralGuess();
    }

    // Fallback identification
    async fallbackIdentification() {
        const info = this.port.getInfo();
        
        if (info.usbVendorId === 0x2341) {
            return 'uno'; // Most common Arduino
        } else if (info.usbVendorId === 0x1A86) {
            return 'nano'; // Common clone
        } else if (info.usbVendorId === 0x10C4) {
            return 'esp32'; // ESP32
        }
        
        return 'generic';
    }

    // Send command to Arduino and read response
    async sendCommand(command, timeout = 2000) {
        if (!this.port) {
            throw new Error('Port not open');
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Write command
        this.writer = this.port.writable.getWriter();
        await this.writer.write(encoder.encode(command));
        this.writer.releaseLock();

        // Read response with timeout
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, timeout);

            this.readResponse().then(response => {
                clearTimeout(timer);
                resolve(response);
            }).catch(reject);
        });
    }

    // Read response from Arduino
    async readResponse(timeout = 1000) {
        if (!this.port) {
            throw new Error('Port not open');
        }

        const decoder = new TextDecoder();
        let response = '';
        
        this.reader = this.port.readable.getReader();
        
        try {
            while (true) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    break;
                }
                
                response += decoder.decode(value);
                
                // Check if we have a complete response
                if (response.includes('\n') || response.length > 1024) {
                    break;
                }
            }
        } finally {
            this.reader.releaseLock();
        }

        return response.trim();
    }

    // Detect baud rate automatically
    async detectBaudRate() {
        const commonBaudRates = [9600, 115200, 57600, 38400, 19200, 14400];
        
        for (const baudRate of commonBaudRates) {
            try {
                // Temporarily change baud rate
                await this.port.close();
                await this.openPort(baudRate);
                
                // Test communication
                await this.sendCommand('\r\n', 500);
                return baudRate;
                
            } catch (error) {
                // Continue to next baud rate
            }
        }
        
        return null;
    }

    // Behavioral pattern matching
    behavioralGuess() {
        const info = this.port.getInfo();
        
        // Logic based on common patterns
        if (info.usbVendorId === 0x2341) {
            if (info.usbProductId === 0x0043) return 'uno';
            if (info.usbProductId === 0x0042) return 'mega2560';
            if (info.usbProductId === 0x0036) return 'leonardo';
        }
        
        if (info.usbVendorId === 0x1A86) return 'nano';
        if (info.usbVendorId === 0x10C4) return 'esp32';
        
        return 'generic';
    }

    // Map response to model
    mapResponseToModel(response) {
        const lowerResponse = response.toLowerCase();
        
        if (lowerResponse.includes('esp32')) return 'esp32';
        if (lowerResponse.includes('uno')) return 'uno';
        if (lowerResponse.includes('nano')) return 'nano';
        if (lowerResponse.includes('mega')) return 'mega';
        if (lowerResponse.includes('leonardo')) return 'leonardo';
        
        return 'generic';
    }

    // Scan for available Arduino devices
    async scanForDevices() {
        if (!this.isSupported()) {
            throw new Error('Web Serial API not supported');
        }

        this.isScanning = true;
        
        try {
            // Get all available ports
            const ports = await navigator.serial.getPorts();
            console.log(`🔍 Found ${ports.length} serial ports`);
            
            const devices = [];
            
            for (const port of ports) {
                try {
                    const deviceInfo = await this.quickIdentifyPort(port);
                    if (deviceInfo) {
                        devices.push(deviceInfo);
                    }
                } catch (error) {
                    console.warn(`Could not identify port:`, error);
                }
            }
            
            this.detectedDevices.clear();
            devices.forEach(device => {
                this.detectedDevices.set(device.id, device);
            });
            
            return devices;
            
        } finally {
            this.isScanning = false;
        }
    }

    // Quick identification without full connection
    async quickIdentifyPort(port) {
        const info = port.getInfo();
        
        // Check if it matches known Arduino signatures
        for (const [model, signature] of Object.entries(this.arduinoSignatures.products)) {
            if (info.usbVendorId === signature.vendor && 
                (signature.product === null || info.usbProductId === signature.product)) {
                return {
                    id: `${info.usbVendorId}-${info.usbProductId}`,
                    model: model.toLowerCase(),
                    name: signature.name,
                    vendorId: info.usbVendorId,
                    productId: info.usbProductId,
                    connected: false
                };
            }
        }
        
        return null;
    }

    // Get detailed information about connected Arduino
    async getDeviceInfo() {
        if (!this.isConnected || !this.port) {
            throw new Error('No device connected');
        }

        const info = this.port.getInfo();
        const model = await this.identifyModel();
        
        return {
            model: model,
            name: this.arduinoSignatures.products[model.toUpperCase()]?.name || 'Unknown Arduino',
            vendorId: info.usbVendorId,
            productId: info.usbProductId,
            serialNumber: info.usbSerialNumber,
            connection: 'USB Serial',
            baudRate: this.port.baudRate,
            timestamp: new Date().toISOString()
        };
    }

    // Upload code to connected Arduino
    async uploadCode(code, options = {}) {
        if (!this.isConnected) {
            throw new Error('No Arduino connected');
        }

        console.log('📤 Uploading code to Arduino...');
        
        try {
            // Add Arduino program structure if needed
            const fullCode = this.wrapCodeForUpload(code, options);
            
            // Send code in chunks
            await this.sendCodeChunked(fullCode);
            
            console.log('✅ Code uploaded successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Code upload failed:', error);
            throw error;
        }
    }

    // Wrap code with proper Arduino structure
    wrapCodeForUpload(code, options) {
        if (code.includes('void setup()') && code.includes('void loop()')) {
            return code; // Already proper Arduino code
        }

        // Wrap in basic Arduino structure
        return `// Uploaded by VitaCoder Pro
${options.libraries || ''}

void setup() {
    Serial.begin(9600);
    ${code}
}

void loop() {
    // Your code runs here
}`;
    }

    // Send code in chunks to avoid buffer overflow
    async sendCodeChunked(code) {
        const encoder = new TextEncoder();
        const chunks = this.chunkString(code, 64); // Small chunks for stability
        
        this.writer = this.port.writable.getWriter();
        
        try {
            for (const chunk of chunks) {
                await this.writer.write(encoder.encode(chunk));
                await this.delay(10); // Small delay between chunks
            }
        } finally {
            this.writer.releaseLock();
        }
    }

    // Split string into chunks
    chunkString(str, chunkSize) {
        const chunks = [];
        for (let i = 0; i < str.length; i += chunkSize) {
            chunks.push(str.substring(i, i + chunkSize));
        }
        return chunks;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Close connection
    async disconnect() {
        if (this.reader) {
            this.reader.cancel();
            this.reader.releaseLock();
            this.reader = null;
        }
        
        if (this.writer) {
            this.writer.releaseLock();
            this.writer = null;
        }
        
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        
        this.isConnected = false;
        this.notifyDisconnection();
        
        console.log('🔌 Disconnected from Arduino');
    }

    // Event handling
    onConnection(callback) {
        this.connectionCallbacks.add(callback);
    }

    onDisconnection(callback) {
        this.disconnectionCallbacks.add(callback);
    }

    notifyConnection(model) {
        this.connectionCallbacks.forEach(callback => {
            try {
                callback(model, this.port);
            } catch (error) {
                console.error('Connection callback error:', error);
            }
        });
    }

    notifyDisconnection() {
        this.disconnectionCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Disconnection callback error:', error);
            }
        });
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            scanning: this.isScanning,
            supported: this.isSupported(),
            port: this.port ? this.port.getInfo() : null,
            detectedDevices: Array.from(this.detectedDevices.values())
        };
    }

    // Reset the detector
    async reset() {
        await this.disconnect();
        this.detectedDevices.clear();
        this.connectionCallbacks.clear();
        this.disconnectionCallbacks.clear();
    }
}
