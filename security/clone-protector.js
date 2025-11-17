// security/clone-protector.js
export default class CloneProtector {
    constructor() {
        this.isOfficialBuild = false;
        this.cloneDetection = {
            allowedHosts: ['github.com', 'fj-cyberzilla.github.io'],
            officialRepos: ['FJ-cyberzilla/EM-Zilla'],
            buildSignature: null,
            verificationToken: 'EM-ZILLA-OFFICIAL-2024'
        };
    }

    async initialize() {
        console.log('🔍 Checking build authenticity...');
        
        const checks = [
            this.checkBuildSignature(),
            this.checkHostValidity(),
            this.checkRepositorySource(),
            this.verifyBuildEnvironment(),
            this.validateSecurityTokens()
        ];

        const results = await Promise.allSettled(checks);
        const passedChecks = results.filter(r => r.status === 'fulfilled' && r.value).length;
        
        this.isOfficialBuild = passedChecks >= 4; // Require 4/5 checks to pass
        
        if (!this.isOfficialBuild) {
            await this.handleCloneDetection();
        }

        return this.isOfficialBuild;
    }

    async checkBuildSignature() {
        try {
            // Check for official build signature
            const response = await fetch('./signature.json');
            if (!response.ok) return false;
            
            const signature = await response.json();
            
            // Verify signature structure and validity
            const isValid = this.verifySignatureStructure(signature);
            const isFresh = this.checkSignatureFreshness(signature);
            
            return isValid && isFresh;
        } catch {
            return false;
        }
    }

    verifySignatureStructure(signature) {
        const required = ['signature', 'timestamp', 'signedBy', 'publicKey'];
        return required.every(field => signature[field]) &&
               signature.signedBy === 'EM-Zilla Build System' &&
               signature.publicKey.includes('em-zilla');
    }

    checkSignatureFreshness(signature) {
        const buildTime = new Date(signature.timestamp);
        const now = new Date();
        const diffDays = (now - buildTime) / (1000 * 60 * 60 * 24);
        return diffDays < 30; // Signature valid for 30 days
    }

    checkHostValidity() {
        const currentHost = window.location.hostname;
        const isValidHost = this.cloneDetection.allowedHosts.some(host => 
            currentHost.includes(host)
        );
        
        // Allow localhost for development
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            console.warn('⚠️  Running in development mode - security relaxed');
            return true;
        }
        
        return isValidHost;
    }

    async checkRepositorySource() {
        try {
            // Check if running from official repository
            const manifestResponse = await fetch('./manifest.json');
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                return manifest.start_url && 
                       manifest.start_url.includes('fj-cyberzilla.github.io/EM-Zilla');
            }
            
            // Alternative check for GitHub Pages
            // Only include the exact allowed GitHub Pages host(s)
            const githubPagesHosts = this.cloneDetection.allowedHosts.filter(host => host === 'fj-cyberzilla.github.io');
            if (githubPagesHosts.includes(window.location.hostname)) {
                return window.location.href.includes('FJ-cyberzilla/EM-Zilla');
            }
            
            return false;
        } catch {
            return false;
        }
    }

    verifyBuildEnvironment() {
        // Check for build artifacts that only exist in official builds
        const buildArtifacts = [
            'dist/integrity-manifest.json',
            'dist/signature.json',
            'security/integrity-verifier.js'
        ];

        return buildArtifacts.every(artifact => {
            // These should exist in official builds but not in raw clones
            return this.artifactExists(artifact);
        });
    }

    async artifactExists(path) {
        try {
            const response = await fetch(path);
            return response.ok;
        } catch {
            return false;
        }
    }

    validateSecurityTokens() {
        // Validate embedded security tokens
        const tokens = this.extractSecurityTokens();
        return tokens.includes(this.cloneDetection.verificationToken);
    }

    extractSecurityTokens() {
        const tokens = [];
        
        // Extract from script tags
        document.querySelectorAll('script').forEach(script => {
            const content = script.textContent || script.src;
            if (content.includes('EM-ZILLA')) {
                tokens.push('EM-ZILLA-TOKEN');
            }
        });
        
        // Extract from meta tags
        document.querySelectorAll('meta[name="generator"]').forEach(meta => {
            if (meta.content.includes('EM-Zilla')) {
                tokens.push('EM-ZILLA-META');
            }
        });
        
        return tokens;
    }

    async handleCloneDetection() {
        console.warn('🚨 CLONE DETECTED: This appears to be an unofficial build');
        
        // Implement graduated response based on severity
        const severity = await this.assessCloneSeverity();
        
        switch (severity) {
            case 'high':
                await this.handleMaliciousClone();
                break;
            case 'medium':
                await this.handleUnofficialClone();
                break;
            case 'low':
                await this.handleDevelopmentClone();
                break;
            default:
                await this.handleUnknownClone();
        }
        
        // Log clone attempt
        await this.logCloneAttempt(severity);
    }

    async assessCloneSeverity() {
        const checks = {
            missingSignature: !await this.artifactExists('./signature.json'),
            wrongHost: !this.checkHostValidity(),
            modifiedFiles: !await this.checkFileModifications(),
            suspiciousActivity: await this.detectSuspiciousBehavior()
        };

        const threatScore = Object.values(checks).filter(Boolean).length;
        
        if (threatScore >= 3) return 'high';
        if (threatScore >= 2) return 'medium';
        return 'low';
    }

    async checkFileModifications() {
        // Check if critical files have been modified
        try {
            const verifier = new IntegrityVerifier();
            return await verifier.verifyAllFiles();
        } catch {
            return false;
        }
    }

    async detectSuspiciousBehavior() {
        // Check for debugging tools or manipulation attempts
        return await this.checkDebuggerPresence() || 
               await this.checkDOMTampering();
    }

    async checkDebuggerPresence() {
        // Detect if developer tools are open
        const startTime = Date.now();
        debugger;
        const endTime = Date.now();
        return (endTime - startTime) > 100;
    }

    async checkDOMTampering() {
        // Check for unexpected DOM modifications
        return document.querySelectorAll('script[src*="unpkg.com"], script[src*="cdnjs"]').length > 2;
    }

    async handleMaliciousClone() {
        console.error('🚨 MALICIOUS CLONE DETECTED - SHUTTING DOWN');
        
        // Complete shutdown
        document.body.innerHTML = this.createSecurityAlert('malicious');
        
        // Disable all functionality
        this.disableAllFeatures();
        
        // Clear all data
        this.purgeSensitiveData();
        
        // Prevent further execution
        throw new Error('Security violation: Malicious clone detected');
    }

    async handleUnofficialClone() {
        console.warn('⚠️  UNOFFICIAL BUILD DETECTED - LIMITED FUNCTIONALITY');
        
        // Show warning but allow limited functionality
        this.showCloneWarning();
        
        // Disable premium features
        this.disablePremiumFeatures();
        
        // Add watermark
        this.addUnofficialWatermark();
    }

    async handleDevelopmentClone() {
        console.info('🔧 DEVELOPMENT BUILD DETECTED - FEATURES ENABLED');
        
        // Allow full functionality but show notice
        this.showDevelopmentNotice();
    }

    async handleUnknownClone() {
        console.warn('❓ UNKNOWN BUILD SOURCE - CAUTION ADVISED');
        this.showCautionWarning();
    }

    createSecurityAlert(level) {
        const messages = {
            malicious: `
                <div style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: #8B0000; color: white; z-index: 10000;
                    display: flex; flex-direction: column; justify-content: center;
                    align-items: center; text-align: center; padding: 20px;
                    font-family: Arial, sans-serif;
                ">
                    <h1 style="color: #FF6B6B; margin-bottom: 20px;">🚨 SECURITY ALERT</h1>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; max-width: 600px;">
                        <h2>Unofficial Build Detected</h2>
                        <p>This copy of EM-Zilla appears to be modified or unofficial.</p>
                        <p style="font-size: 14px; opacity: 0.8;">
                            Using unofficial builds may expose you to security risks, malware, or data theft.
                        </p>
                        <div style="margin: 20px 0;">
                            <a href="https://github.com/FJ-cyberzilla/EM-Zilla" 
                               style="color: #4FC3F7; text-decoration: underline;">
                               Download Official Version
                            </a>
                        </div>
                        <p style="font-size: 12px; opacity: 0.6;">
                            Official build signature verification failed.
                            This application will not function in unofficial builds.
                        </p>
                    </div>
                </div>
            `,
            warning: `
                <div style="
                    position: fixed; top: 20px; right: 20px; background: #FF9800;
                    color: white; padding: 15px; border-radius: 5px; z-index: 9999;
                    max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">
                    <strong>⚠️ Unofficial Build</strong>
                    <p style="margin: 10px 0 0 0; font-size: 12px;">
                        This appears to be an unofficial version. Some features may be limited.
                    </p>
                    <button onclick="this.parentElement.remove()" 
                            style="margin-top: 10px; padding: 5px 10px; background: transparent; 
                                   border: 1px solid white; color: white; border-radius: 3px;">
                        Dismiss
                    </button>
                </div>
            `
        };

        return messages[level] || messages.warning;
    }

    disableAllFeatures() {
        // Remove all event listeners
        const events = ['click', 'keydown', 'input', 'submit'];
        events.forEach(event => {
            document.removeEventListener(event, () => {}, true);
        });

        // Disable all forms and inputs
        document.querySelectorAll('input, textarea, button, select').forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.5';
        });

        // Stop all intervals and timeouts
        const highestId = window.setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
            window.clearTimeout(i);
            window.clearInterval(i);
        }
    }

    disablePremiumFeatures() {
        // Disable AI features
        if (window.aiOrchestrator) {
            window.aiOrchestrator.generateArduinoCode = () => {
                throw new Error('AI features disabled in unofficial builds');
            };
        }

        // Disable USB detection
        if (window.vitaCoderApp?.usbDetector) {
            window.vitaCoderApp.usbDetector.detectArduino = () => {
                throw new Error('Hardware access disabled in unofficial builds');
            };
        }

        // Disable advanced ML features
        if (window.tfliteIntegration) {
            window.tfliteIntegration.analyzeCodeWithML = () => {
                return { error: 'ML features require official build' };
            };
        }
    }

    purgeSensitiveData() {
        // Clear all stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear caches
        if (caches) {
            caches.keys().then(names => names.forEach(name => caches.delete(name)));
        }
        
        // Clear IndexedDB
        this.clearIndexedDB();
    }

    async clearIndexedDB() {
        try {
            const dbs = await window.indexedDB.databases();
            dbs.forEach(db => {
                if (db.name) {
                    window.indexedDB.deleteDatabase(db.name);
                }
            });
        } catch (error) {
            console.warn('Could not clear IndexedDB:', error);
        }
    }

    showCloneWarning() {
        const warning = document.createElement('div');
        warning.innerHTML = this.createSecurityAlert('warning');
        document.body.appendChild(warning);
    }

    addUnofficialWatermark() {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 10px;
            z-index: 1000;
            pointer-events: none;
            opacity: 0.8;
        `;
        watermark.textContent = 'UNOFFICIAL BUILD';
        document.body.appendChild(watermark);
    }

    showDevelopmentNotice() {
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #4CAF50;
            color: white;
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 11px;
            z-index: 1000;
            opacity: 0.9;
        `;
        notice.textContent = 'DEV BUILD - FEATURES ENABLED';
        document.body.appendChild(notice);
        
        // Auto-remove after 10 seconds
        setTimeout(() => notice.remove(), 10000);
    }

    showCautionWarning() {
        console.warn('Exercise caution when using builds from unknown sources');
    }

    async logCloneAttempt(severity) {
        const logEntry = {
            type: 'clone_detection',
            severity: severity,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            host: window.location.host,
            url: window.location.href,
            features: this.getEnabledFeatures()
        };

        try {
            // In a real application, this would send to a secure logging service
            console.warn('Clone attempt logged:', logEntry);
            
            // Store locally for debugging
            const existingLogs = JSON.parse(localStorage.getItem('em_zilla_security_logs') || '[]');
            existingLogs.push(logEntry);
            localStorage.setItem('em_zilla_security_logs', JSON.stringify(existingLogs.slice(-50))); // Keep last 50
        } catch (error) {
            console.warn('Could not log clone attempt:', error);
        }
    }

    getEnabledFeatures() {
        return {
            ai: !!window.aiOrchestrator,
            usb: !!window.vitaCoderApp?.usbDetector,
            ml: !!window.tfliteIntegration,
            security: !!window.IntegrityVerifier
        };
    }

    // Public API
    getBuildStatus() {
        return {
            isOfficial: this.isOfficialBuild,
            verification: this.cloneDetection,
            features: this.getEnabledFeatures(),
            restrictions: !this.isOfficialBuild ? ['ai_generation', 'usb_access', 'ml_analysis'] : []
        };
    }

    async verifyFeatureAccess(feature) {
        if (!this.isOfficialBuild) {
            const restricted = ['ai_generation', 'usb_access', 'ml_analysis', 'premium'];
            if (restricted.includes(feature)) {
                throw new Error(`Feature "${feature}" requires official build. Download from: https://github.com/FJ-cyberzilla/EM-Zilla`);
            }
        }
        return true;
    }
}
