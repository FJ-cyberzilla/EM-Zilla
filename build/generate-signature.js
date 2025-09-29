const fs = require('fs');
const crypto = require('crypto');

async function generateSignature() {
    console.log('🔏 Generating digital signature...');
    
    try {
        const manifest = JSON.parse(
            await fs.promises.readFile('dist/integrity-manifest.json', 'utf8')
        );

        // In production, use proper asymmetric cryptography
        const privateKey = crypto.randomBytes(32); // Simulated private key
        
        const signatureData = {
            manifest: manifest,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version
        };

        const signature = crypto.createHmac('sha256', privateKey)
            .update(JSON.stringify(signatureData))
            .digest('hex');

        const signedManifest = {
            ...signatureData,
            signature: signature,
            signedBy: 'EM-Zilla Build System',
            publicKey: 'em-zilla-public-key-2024' // In real scenario, use actual public key
        };

        await fs.promises.writeFile(
            'dist/signature.json',
            JSON.stringify(signedManifest, null, 2)
        );

        console.log('✅ Digital signature generated');
        
    } catch (error) {
        console.error('❌ Failed to generate signature:', error);
        process.exit(1);
    }
}

generateSignature().catch(console.error);
