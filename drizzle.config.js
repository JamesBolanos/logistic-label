import { defineConfig } from 'drizzle-kit';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

export default defineConfig({
  schema: './src/lib/server/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.LOGISTIC_LABEL_DATABASE_URL || env.LOGISTIC_LABEL_DATABASE_URL
  }
});
