import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-vercel';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    sveltekit({ adapter: adapter() }),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      emitTsDeclarations: true,
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      cookieName: 'sscc-labels-locale',
      cookieMaxAge: 60 * 60 * 24 * 365,
      cookieSameSite: 'lax',
      cookieSecure: 'auto',
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [['es', '/es/:path(.*)?']]
        }
      ]
    })
  ],
  ssr: command === 'build' ? { noExternal: ['@vercel/functions'] } : undefined
}));
