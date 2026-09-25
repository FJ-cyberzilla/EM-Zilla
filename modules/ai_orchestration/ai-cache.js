/**
 * FJ™ Cybertronic Systems - Secure Offline AI Cache
 * TTL and LRU-based caching for code analysis and generation results.
 */

export default class AICache {
    constructor(maxSize = 100, ttlMs = 30 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this.cache = new Map();
    }

    generateKey(type, input) {
        return `${type}:${btoa(encodeURIComponent(input)).slice(0, 64)}`;
    }

    get(type, input) {
        const key = this.generateKey(type, input);
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        // Refresh LRU order
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.data;
    }

    set(type, input, data) {
        const key = this.generateKey(type, input);

        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }

    stats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMinutes: this.ttlMs / (60 * 1000)
        };
    }
}
