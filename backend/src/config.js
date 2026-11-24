import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Nunca se importa este módulo desde el frontend.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const production = process.env.NODE_ENV === 'production';
if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) throw new Error('Configura DATABASE_URL o DB_PASSWORD en el .env de la raíz.');
if (production && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('En producción, SESSION_SECRET debe tener al menos 32 caracteres.');
}

export const config = {
  production,
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  origin: process.env.APP_ORIGIN || (production ? 'http://localhost:3000' : 'http://127.0.0.1:5173'),
  sessionSecret: process.env.SESSION_SECRET || randomBytes(48).toString('hex'),
  database: process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'leetbattle',
    user: process.env.DB_USER || 'leetbattle_dev',
    password: process.env.DB_PASSWORD,
  },
};
