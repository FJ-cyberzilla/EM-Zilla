// build/create-official-release.js
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

class OfficialReleaseBuilder {
    constructor() {
        this.releaseKey = process.env.EM_ZILLA_RELEASE_KEY || this.generateTemporaryKey();
        this.version = process.env.npm_package_version;
    }

    async buildOfficialRelease() {
        console.log('🏭 Building Official EM-Zilla Release...');
        
        // Verify we're in the official repository
        await this.verifyRepository();
        
        // Create secure build
        await this.createSecureBuild();
        
        // Generate official signatures
        await this.generateOfficialSignatures();
        
        // Create release package
        await this.createReleasePackage();
        
        console.log('✅ Official release build completed');
    }

    async verifyRepository() {
        try {
            const repoUrl = execSync('git config --get remote.origin.url').toString().trim();
            if (!repoUrl.includes('FJ-cyberzilla/EM-Zilla')) {
                throw new Error('Not in official repository');
            }
            
            const branch = execSync('git branch --show-current').toString().trim();
            if (branch !== 'main' && branch !== 'release') {
                throw new Error('Must build from main or release branch');
            }
            
            console.log('✅ Repository verification passed');
        } catch (error) {
            throw new Error(`Repository verification failed: ${error.message}`);
        }
    }

    async createSecureBuild() {
        // Run security checks first
        execSync('npm run security:audit', { stdio: 'inherit' });
        
        // Build with security features
        execSync('npm run build:prod', { stdio: 'inherit' });
        
        // Generate integrity hashes
        execSync('npm run integrity:generate', { stdio: 'inherit' });
    }

    async generateOfficialSignatures() {
        const buildInfo = {
            version: this.version,
            timestamp: new Date().toISOString(),
            buildId: this.generateBuildId(),
            repository: 'FJ-cyberzilla/EM-Zilla',
            official: true
        };

        // Create build signature
        const signature = crypto.createHmac('sha256', this.releaseKey)
            .update(JSON.stringify(buildInfo))
            .digest('hex');

        const signedBuild = {
            ...buildInfo,
            signature: signature,
            buildType: 'official',
            verificationUrl: 'https://fj-cyberzilla.github.io/EM-Zilla/verify.html'
        };

        await fs.promises.writeFile(
            'dist/official-build.json',
            JSON.stringify(signedBuild, null, 2)
        );

        // Create verification token for runtime
        const verificationToken = `OFFICIAL-EM-ZILLA-${this.version}-${signature.substring(0, 16)}`;
        await this.injectVerificationToken(verificationToken);
    }

    generateBuildId() {
        return `EMZ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    async injectVerificationToken(token) {
        // Inject token into the built application
        const indexFile = await fs.promises.readFile('dist/index.html', 'utf8');
        const tokenInjection = `
            <!-- EM-ZILLA OFFICIAL BUILD TOKEN: ${token} -->
            <meta name="em-zilla-build" content="official">
            <script>
                window.EM_ZILLA_OFFICIAL = true;
                window.EM_ZILLA_BUILD_TOKEN = '${token}';
            </script>
        `;
        
        const updatedIndex = indexFile.replace('</head>', tokenInjection + '</head>');
        await fs.promises.writeFile('dist/index.html', updatedIndex);
    }

    async createReleasePackage() {
        const releaseDir = `release/em-zilla-v${this.version}`;
        await fs.promises.mkdir(releaseDir, { recursive: true });
        
        // Copy distribution files
        execSync(`cp -r dist/* ${releaseDir}/`);
        
        // Create release manifest
        const manifest = {
            name: 'EM-Zilla',
            version: this.version,
            buildDate: new Date().toISOString(),
            files: await this.getReleaseFiles(),
            security: {
                integrity: true,
                cloneProtection: true,
                officialBuild: true
            }
        };
        
        await fs.promises.writeFile(
            `${releaseDir}/release-manifest.json`,
            JSON.stringify(manifest, null, 2)
        );
        
        console.log(`✅ Release package created: ${releaseDir}`);
    }

    async getReleaseFiles() {
        const files = await fs.promises.readdir('dist');
        return files.filter(file => 
            !file.includes('.map') && 
            !file.includes('test') &&
            file !== 'node_modules'
        );
    }

    generateTemporaryKey() {
        console.warn('⚠️  Using temporary key - set EM_ZILLA_RELEASE_KEY for production');
        return crypto.randomBytes(32).toString('hex');
    }
}

// Build official release
if (require.main === module) {
    new OfficialReleaseBuilder().buildOfficialRelease().catch(console.error);
}

module.exports = OfficialReleaseBuilder;
