import adapter from '@sveltejs/adapter-vercel';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), sveltekit({ adapter: adapter() })],
  ssr: command === 'build' ? { noExternal: ['@vercel/functions'] } : undefined
}));
