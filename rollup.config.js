// Rollup plugins
import typescript from 'rollup-plugin-typescript';

export default {
  entry: 'src/index.ts',
  dest: 'build/index.js',
  format: 'iife',
  sourceMap: 'inline',
  external: ['d3-array', 'd3-axis', 'd3-collection', 'd3-color', 'd3-dispatch', 'd3-dsv', 'd3-ease', 'd3-format', 'd3-geo', 'd3-interpolate', 'd3-path', 'd3-queue', 'd3-random', 'd3-request', 'd3-scale', 'd3-selection', 'd3-time', 'd3-timer', 'd3-transition'],
  globals: {
    'd3-array': 'd3',
    'd3-axis': 'd3',
    'd3-collection': 'd3',
    'd3-color': 'd3',
    'd3-dispatch': 'd3',
    'd3-dsv': 'd3',
    'd3-ease': 'd3',
    'd3-format': 'd3',
    'd3-geo': 'd3',
    'd3-interpolate': 'd3',
    'd3-path': 'd3',
    'd3-queue': 'd3',
    'd3-random': 'd3',
    'd3-request': 'd3',
    'd3-scale': 'd3',
    'd3-selection': 'd3',
    'd3-time': 'd3',
    'd3-timer': 'd3',
    'd3-transition': 'd3',
  },
  plugins: [
    typescript()
  ],
};