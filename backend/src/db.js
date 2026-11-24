import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ ...config.database, max: 10, connectionTimeoutMillis: 5000 });
pool.on('error', () => console.error('Se ha interrumpido una conexión con PostgreSQL.'));
