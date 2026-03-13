import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { unwrap, loadEnv, withDefault, toInt } from '@lindeneg/cl-env';

const env = unwrap(
  loadEnv(
    {
      files: [],
      optionalFiles: ['.env', '.env.default', '.env.local', '.env.test'],
      basePath: path.join(process.cwd(), '..', 'server'),
      includeProcessEnv: false,
      transformKeys: false,
      logger: true,
    },
    {
      PORT: withDefault(toInt(), 3000),
    }
  )
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:' + env.PORT,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});
