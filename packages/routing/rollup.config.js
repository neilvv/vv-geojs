import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'dist/es/index.js',
  output: [
    { file: 'dist/bundle.js', format: 'es' },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
  ],
};
