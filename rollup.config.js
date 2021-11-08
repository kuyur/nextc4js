import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'browser-lite.js',
    output: {
      name: 'nextc4',
      file: 'dist/nextc4-lite.js',
      format: 'umd'
    },
    plugins: [commonjs()]
  }, {
    input: 'browser-lite.js',
    output: {
      name: 'nextc4',
      file: 'dist/nextc4-lite.min.js',
      format: 'umd'
    },
    plugins: [commonjs(), terser()]
  }, {
    input: 'browser.js',
    output: {
      name: 'nextc4',
      file: 'dist/nextc4-all.js',
      format: 'umd'
    },
    plugins: [commonjs(), json()]
  }, {
    input: 'browser.js',
    output: {
      name: 'nextc4',
      file: 'dist/nextc4-all.min.js',
      format: 'umd'
    },
    plugins: [commonjs(), json(), terser()]
  }
];

