// build/generate-hashes.js
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function generateHashes() {
    const files = [
        'js/app.js',
        'js/ai-orchestrator.js', 
        'js/usb-detector.js',
        'security/integrity-verifier.js',
        'security/runtime-guard.js',
        'modules/ai-orchestration/task-dispatcher.js',
        'modules/ai-orchestration/knowledge-graph.js',
        'modules/ai-orchestration/decision-engine.js',
        'modules/ai-orchestration/context-manager.js',
        'modules/tflite-integration.js'
    ];

    const hashes = {};
    
    for (const file of files) {
        const content = await fs.promises.readFile(file, 'utf8');
        hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
    }

    // Write to integrity verifier
    let verifierCode = await fs.promises.readFile('security/integrity-verifier.js', 'utf8');
    verifierCode = verifierCode.replace(
        /this\.expectedHashes\.set\([^)]+\);/g, 
        ''
    );
    
    let hashCode = '// Auto-generated hashes\n';
    Object.entries(hashes).forEach(([file, hash]) => {
        hashCode += `this.expectedHashes.set('${file}', '${hash}');\n`;
    });
    
    verifierCode = verifierCode.replace(
        'await this.loadExpectedHashes();',
        `await this.loadExpectedHashes();\n${hashCode}`
    );

    await fs.promises.writeFile('security/integrity-verifier.js', verifierCode);
    console.log('✅ Integrity hashes generated');
}

generateHashes().catch(console.error);
