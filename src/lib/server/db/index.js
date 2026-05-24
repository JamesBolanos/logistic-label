import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '$env/dynamic/private';
import * as schema from './schema.js';

const connectionString = env.LOGISTIC_LABEL_DATABASE_URL;

if (!connectionString) {
  console.warn('LOGISTIC_LABEL_DATABASE_URL is not set. Database-backed features will fail until it is configured.');
}

const sql = connectionString ? neon(connectionString) : null;

export const db = sql ? drizzle(sql, { schema }) : null;
export { schema };
