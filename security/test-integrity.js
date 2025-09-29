import IntegrityVerifier from './integrity-verifier.js';

async function testSecurity() {
    console.log('🧪 Running security integrity tests...');
    
    const verifier = new IntegrityVerifier();
    
    try {
        const integrityValid = await verifier.initialize();
        
        if (integrityValid) {
            console.log('✅ All integrity checks passed');
            process.exit(0);
        } else {
            console.error('❌ Integrity verification failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Security test failed:', error);
        process.exit(1);
    }
}

testSecurity();
