import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Strictly replace process.env.API_KEY with the string value
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env to prevent "process is not defined" errors in browser
      'process.env': {} 
    }
  };
});