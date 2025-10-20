const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.argv.includes('--production');

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  target: 'node18',
  platform: 'node',
  sourcemap: !isProduction,
  minify: isProduction,
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
  },
  tsconfig: './tsconfig.json',
  logLevel: 'info',
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@commands': path.resolve(__dirname, 'src/commands'),
    '@providers': path.resolve(__dirname, 'src/providers'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@types': path.resolve(__dirname, 'src/types/index'),
    '@webview': path.resolve(__dirname, 'src/webview')
  }
};

if (process.argv.includes('--watch')) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
