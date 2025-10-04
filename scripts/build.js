import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy
const files = ['common.js', 'node.js', 'browser.js', 'index.js'];

console.log('🔨 Building @teknohole/teknohole...\n');

// Copy files from src to dist
files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const distPath = path.join(distDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, distPath);
        console.log(`✅ Copied: ${file}`);
    } else {
        console.warn(`⚠️  Warning: ${file} not found in src/`);
    }
});

// Create CommonJS wrapper for index.js
const cjsWrapper = `// CommonJS wrapper for @teknohole/teknohole
const { createRequire } = require('module');
const require2 = createRequire(import.meta.url);

async function loadModule() {
    const mod = await import('./index.js');
    return mod;
}

module.exports = loadModule().then(mod => {
    return {
        WebStorage: mod.WebStorage || mod.default,
        default: mod.default
    };
});

// Sync export for immediate access (may require top-level await support)
let _module;
loadModule().then(m => { _module = m; });

Object.defineProperty(module.exports, 'WebStorage', {
    get() {
        if (!_module) throw new Error('Module not loaded yet. Use async import or await the promise.');
        return _module.WebStorage || _module.default;
    }
});

Object.defineProperty(module.exports, 'default', {
    get() {
        if (!_module) throw new Error('Module not loaded yet. Use async import or await the promise.');
        return _module.default;
    }
});
`;

fs.writeFileSync(path.join(distDir, 'index.cjs'), cjsWrapper);
console.log('✅ Created: index.cjs (CommonJS wrapper)');

// Create CommonJS wrapper for node.js
const nodeCjsWrapper = `// CommonJS wrapper for node.js
module.exports = require('./index.cjs');
`;

fs.writeFileSync(path.join(distDir, 'node.cjs'), nodeCjsWrapper);
console.log('✅ Created: node.cjs (CommonJS wrapper)');

// Create basic TypeScript definitions
const indexDts = `export interface WebStorageConfig {
  apiKey: string;
  storageName: string;
}

export interface UploadResult {
  success: boolean;
  data?: {
    key: string;
  };
  message?: string;
  status?: number;
}

export interface UploadMultipleResult extends UploadResult {
  fileName: string;
}

export interface ListFilesOptions {
  limit?: number;
  prefix?: string;
}

export interface UploadMultipleOptions {
  concurrent?: boolean;
  maxConcurrent?: number;
}

export declare class WebStorage {
  constructor(config: WebStorageConfig);
  uploadFile(filePathOrFile: string | File): Promise<UploadResult>;
  deleteFile(objectKey: string): Promise<UploadResult>;
  getStorageInfo(): Promise<UploadResult>;
  listFiles(options?: ListFilesOptions): Promise<UploadResult>;
  uploadMultipleFiles(
    files: Array<string | File>,
    options?: UploadMultipleOptions
  ): Promise<Array<UploadMultipleResult>>;
}

export { WebStorage as default };
`;

fs.writeFileSync(path.join(distDir, 'index.d.ts'), indexDts);
console.log('✅ Created: index.d.ts (TypeScript definitions)');

// Copy TypeScript definitions for other files
fs.writeFileSync(path.join(distDir, 'node.d.ts'), indexDts);
console.log('✅ Created: node.d.ts');

fs.writeFileSync(path.join(distDir, 'browser.d.ts'), indexDts);
console.log('✅ Created: browser.d.ts');

const commonDts = `export interface WebStorageConfig {
  apiKey: string;
  storageName: string;
}

export declare class WebStorageBase {
  constructor(config: WebStorageConfig);
  protected _getServiceHeaders(): Record<string, string>;
  protected _requestToService(config: any): Promise<any>;
  protected _requestToServiceBrowser(config: any): Promise<any>;
  protected _getBrowserMimeType(fileName: string): string;
  deleteFile(objectKey: string): Promise<any>;
  getStorageInfo(): Promise<any>;
  listFiles(options?: any): Promise<any>;
  uploadMultipleFiles(files: any[], options?: any): Promise<any[]>;
  uploadFile(filePathOrFile: string | File): Promise<any>;
}

export { WebStorageBase as default };
`;

fs.writeFileSync(path.join(distDir, 'common.d.ts'), commonDts);
console.log('✅ Created: common.d.ts');

console.log('\n✨ Build completed successfully!\n');
console.log('📦 Files in dist/:');
fs.readdirSync(distDir).forEach(file => {
    console.log(`   - ${file}`);
});
console.log('');