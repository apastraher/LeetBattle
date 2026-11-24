import { config } from './config.js';
import { pool } from './db.js';
import { createApp } from './app.js';

const { app, store } = createApp({ pool, ...config });
await pool.query('SELECT 1 FROM public.sesiones LIMIT 1').catch((error) => {
  console.error('No se puede acceder a PostgreSQL o falta la migración de sesiones. Ejecuta db/migrar.sh.');
  console.error('Código de error:', error.code || error.name);
  process.exit(1);
});
const server = app.listen(config.port, config.host, () => {
  console.log(`LeetBattle API: http://${config.host}:${config.port}`);
  if (!process.env.SESSION_SECRET) console.log('Sesión de desarrollo: añade SESSION_SECRET al .env para conservarla al reiniciar la API.');
});

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { store.close(); await pool.end(); process.exit(0); });
});
