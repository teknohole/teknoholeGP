/**
 * Main entry point for WebStorage SDK
 * Automatically detects environment and exports the appropriate implementation
 */

// Detect environment
const isNode = typeof window === 'undefined' && typeof global !== 'undefined' && typeof process !== 'undefined';
const isBrowser = typeof window !== 'undefined';

let WebStorage;

if (isNode) {
    // Node.js environment
    const { default: WebStorageNode } = await import('./node.js');
    WebStorage = WebStorageNode;
} else if (isBrowser) {
    // Browser environment
    const { default: WebStorageBrowser } = await import('./browser.js');
    WebStorage = WebStorageBrowser;
} else {
    throw new Error('Unsupported environment: Neither Node.js nor Browser detected');
}

export default WebStorage;