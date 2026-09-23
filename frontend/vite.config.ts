import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_USE_MOCKS': JSON.stringify(
        env.VITE_USE_MOCKS ?? (command === 'serve' ? 'true' : 'false'),
      ),
    },
    server: {
      port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:8787' },
      watch: { ignored: ['**/.design-references/**'] },
    },
  };
});
