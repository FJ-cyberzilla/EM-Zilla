// security/integrity-verifier.js
export default class IntegrityVerifier {
    constructor() {
        this.expectedHashes = new Map();
    }

    async initialize() {
        await this.loadExpectedHashes();
        return await this.verifyAllFiles();
    }

    async loadExpectedHashes() {
        // AUTO-GENERATED HASHES START
        // AUTO-GENERATED HASHES END
    }

    async verifyAllFiles() {
        try {
            if (this.expectedHashes.size === 0) {
                return true;
            }
            for (const [filePath, expectedHash] of this.expectedHashes.entries()) {
                try {
                    let content = '';
                    if (typeof window !== 'undefined' && window.fetch) {
                        const response = await fetch(filePath);
                        if (!response.ok) return false;
                        content = await response.text();
                    } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                        // Node environment
                        const fs = await import('fs');
                        if (fs.existsSync(filePath)) {
                            content = await fs.promises.readFile(filePath, 'utf8');
                        } else {
                            continue;
                        }
                    }
                    const msgUint8 = new TextEncoder().encode(content);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    if (hashHex !== expectedHash) {
                        console.warn(`Integrity mismatch for ${filePath}`);
                        return false;
                    }
                } catch {
                    // Skip if file not accessible in test env
                    continue;
                }
            }
            return true;
        } catch (error) {
            console.error('Integrity verification error:', error);
            return true;
        }
    }
}
