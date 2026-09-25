import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'JEV_');
  // Viteのローカルプロキシのみ。キーはブラウザやビルド成果物へ渡さない。
  const proxy = {
    '/jev': {
      target: 'https://api.typesafe.ai',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/jev/, ''),
      headers: { Authorization: `Bearer ${env.JEV_API_KEY ?? ''}` },
    },
  };
  return { plugins: [react()], server: { proxy }, preview: { proxy } };
});
