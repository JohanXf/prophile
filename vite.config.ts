import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    define: {
      'process.env': {
        NEXT_PUBLIC_DISCORD_URL: JSON.stringify('https://discord.gg/prophile'),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    },
    resolve: {
      alias: [
        {find: /^next\/navigation$/, replacement: path.resolve(__dirname, 'src/shims/next-navigation.tsx')},
        {find: /^next\/link$/, replacement: path.resolve(__dirname, 'src/shims/next-link.tsx')},
        {find: /^next\/image$/, replacement: path.resolve(__dirname, 'src/shims/next-image.tsx')},
        {find: /^next\/dynamic$/, replacement: path.resolve(__dirname, 'src/shims/next-dynamic.tsx')},
        {find: /^next\/font\/google$/, replacement: path.resolve(__dirname, 'src/shims/next-font.ts')},
        {find: /^next\/font\/local$/, replacement: path.resolve(__dirname, 'src/shims/next-font.ts')},
        {find: /^next$/, replacement: path.resolve(__dirname, 'src/shims/next.ts')},
        {find: /^@marsidev\/react-turnstile$/, replacement: path.resolve(__dirname, 'src/shims/turnstile.tsx')},
        {find: /^@simplewebauthn\/browser$/, replacement: path.resolve(__dirname, 'src/shims/webauthn.ts')},
        {find: /^@fingerprintjs\/fingerprintjs$/, replacement: path.resolve(__dirname, 'src/shims/fingerprintjs.ts')},
        {find: /^server-only$/, replacement: path.resolve(__dirname, 'src/shims/server-only.ts')},
        {find: '@', replacement: path.resolve(__dirname, 'src')},
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('node_modules/three') || id.includes('node_modules/postprocessing') || id.includes('node_modules/ogl')) {
              return 'vendor-3d';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/@visx') || id.includes('node_modules/topojson')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
