import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const external = ['axios', 'mime-types', 'fs', 'path'];

export default [
  // Browser build (ESM)
  {
    input: 'src/browser.js',
    output: {
      file: 'dist/browser.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ],
    external: ['axios']
  },
  
  // Node.js build (ESM)
  {
    input: 'src/node.js',
    output: {
      file: 'dist/node.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs()
    ],
    external
  },
  
  // Node.js build (CommonJS) - untuk backward compatibility
  {
    input: 'src/node.js',
    output: {
      file: 'dist/node.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs()
    ],
    external
  },
  
  // Common base (ESM)
  {
    input: 'src/common.js',
    output: {
      file: 'dist/common.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ],
    external: ['axios']
  },
  
  // Main entry point with auto-detection
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ],
    external: [...external, './node.js', './browser.js']
  }
];