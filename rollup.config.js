// Rollup plugins
import typescript from 'rollup-plugin-typescript';

export default {
  entry: 'src/index.ts',
  dest: 'build/index.js',
  format: 'iife',
  sourceMap: 'inline',
  plugins: [
    typescript()
  ],
};