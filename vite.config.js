import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), sveltekit()],
  ssr: command === 'build' ? { noExternal: ['@vercel/functions'] } : undefined
}));
