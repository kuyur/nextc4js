import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'browser.js',
  output: {
    name: 'nextc4',
    file: 'dist/nextc4.js',
    format: 'umd'
  },
  plugins: [commonjs()]
};
