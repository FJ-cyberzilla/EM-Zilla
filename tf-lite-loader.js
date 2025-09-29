// TFLite WebAssembly loader with fallbacks
class TFLiteLoader {
    constructor() {
        this.loaded = false;
        this.fallbackMode = false;
    }

    async load() {
        try {
            // Try to load TFLite from CDN
            await this.loadFromCDN();
            this.loaded = true;
        } catch (error) {
            console.warn('TFLite CDN load failed, using fallback mode:', error);
            this.fallbackMode = true;
        }
    }

    loadFromCDN() {
        return new Promise((resolve, reject) => {
            if (typeof tflite !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@latest/dist/tf-tflite.min.js';
            script.onload = () => {
                if (typeof tflite !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('TFLite not available after script load'));
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    isAvailable() {
        return this.loaded && !this.fallbackMode;
    }
}

// Global loader instance
window.tfliteLoader = new TFLiteLoader();
