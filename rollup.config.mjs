import terser from '@rollup/plugin-terser';

export default {
  input: 'scripts/init.js',
  output: {
    file: 'scripts/token-action-hud-ptr2e.min.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [terser()],
};
