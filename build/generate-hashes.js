const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function generateHashes() {
    console.log('🔐 Generating file integrity hashes...');
    
    const files = [
        'js/app.js',
        'js/ai-orchestrator.js',
        'js/usb-detector.js',
        'js/mobile-adapter.js',
        'security/integrity-verifier.js',
        'security/runtime-guard.js',
        'security/secure-updater.js',
        'modules/ai-orchestration/task-dispatcher.js',
        'modules/ai-orchestration/knowledge-graph.js',
        'modules/ai-orchestration/decision-engine.js',
        'modules/ai-orchestration/context-manager.js',
        'modules/tflite-integration.js',
        'modules/ml-code-analyzer.js',
        'index.html',
        'service-worker.js'
    ];

    const hashes = {};
    
    try {
        for (const file of files) {
            if (fs.existsSync(file)) {
                const content = await fs.promises.readFile(file, 'utf8');
                const hash = crypto.createHash('sha256').update(content).digest('hex');
                hashes[file] = hash;
                console.log(`✅ ${file}: ${hash.substring(0, 16)}...`);
            } else {
                console.warn(`⚠️  File not found: ${file}`);
            }
        }

        // Create integrity manifest
        const manifest = {
            version: process.env.npm_package_version,
            timestamp: new Date().toISOString(),
            files: hashes
        };

        await fs.promises.writeFile(
            'dist/integrity-manifest.json',
            JSON.stringify(manifest, null, 2)
        );

        // Update integrity verifier with hashes
        await updateIntegrityVerifier(hashes);
        
        console.log('✅ Integrity hashes generated successfully');
        
    } catch (error) {
        console.error('❌ Failed to generate hashes:', error);
        process.exit(1);
    }
}

async function updateIntegrityVerifier(hashes) {
    const verifierPath = 'security/integrity-verifier.js';
    let verifierCode = await fs.promises.readFile(verifierPath, 'utf8');
    
    // Remove existing hash assignments
    verifierCode = verifierCode.replace(
        /\/\/ AUTO-GENERATED HASHES START[\s\S]*?\/\/ AUTO-GENERATED HASHES END/g,
        ''
    );

    // Add new hash assignments
    const hashCode = `// AUTO-GENERATED HASHES START\n${Object.entries(hashes).map(([file, hash]) => 
        `        this.expectedHashes.set('${file}', '${hash}');`
    ).join('\n')}\n        // AUTO-GENERATED HASHES END`;

    verifierCode = verifierCode.replace(
        'async loadExpectedHashes() {',
        `async loadExpectedHashes() {\n${hashCode}`
    );

    // Create backup
    await fs.promises.copyFile(verifierPath, `${verifierPath}.bak`);
    
    // Write updated file
    await fs.promises.writeFile(verifierPath, verifierCode);
}

generateHashes().catch(console.error);
