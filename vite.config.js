import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-avatar-editor', 'react-custom-scrollbars-2']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    {
      name: 'handle-html5-routing',
      apply: 'build',
      enforce: 'post',
      generateBundle(_, bundle) {
        // Add _redirects file for Netlify/Vercel (Heroku also respects this)
        bundle['_redirects'] = {
          type: 'asset',
          fileName: '_redirects',
          source: '/* /index.html 200',
        };
      },
    },
  ],
});
