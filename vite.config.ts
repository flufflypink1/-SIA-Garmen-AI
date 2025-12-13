import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Menggunakan casting (process as any) untuk menghindari error TypeScript pada akses cwd
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Mengganti 'process.env.API_KEY' di dalam kode dengan nilai string sebenarnya saat build.
      // Pastikan Anda mengatur Environment Variable 'API_KEY' di dashboard Netlify.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});