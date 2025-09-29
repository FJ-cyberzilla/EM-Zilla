#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️ Building VitaCoder Pro...');

// Simple build script to combine and minify files if needed
async function build() {
  try {
    // Create dist directory
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Copy HTML file
    const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

    // Combine CSS files
    const cssFiles = ['main.css', 'vita-theme.css', 'responsive.css', 'mobile.css'];
    let combinedCSS = '';
    
    for (const file of cssFiles) {
      const cssPath = path.join(__dirname, 'css', file);
      if (fs.existsSync(cssPath)) {
        combinedCSS += `\n/* ${file} */\n` + fs.readFileSync(cssPath, 'utf8');
      }
    }
    
    fs.writeFileSync(path.join(distDir, 'app.css'), combinedCSS);
    console.log('✅ CSS files combined');

    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
