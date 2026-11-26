import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createAuthRouter } from './auth/router.js';
import { createEjerciciosRouter } from './ejercicios/router.js';

export function createApp({ pool, sessionSecret, production = false, origin, authLimit }) {
  const app = express();
  const PgStore = connectPgSimple(session);
  app.disable('x-powered-by');
  if (production) app.set('trust proxy', 1);
  app.use(helmet({ strictTransportSecurity: production ? undefined : false, contentSecurityPolicy: {
    directives: { 'upgrade-insecure-requests': production ? [] : null },
  } }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    // Formularios ajenos no pueden enviar operaciones autenticadas.
    if (req.get('sec-fetch-site') === 'cross-site' || (req.get('origin') && req.get('origin') !== origin)) {
      return res.status(403).json({ message: 'Origen de la petición no permitido.' });
    }
    if (!req.is('application/json')) return res.status(415).json({ message: 'Envía los datos como JSON.' });
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  const store = new PgStore({ pool, tableName: 'sesiones', createTableIfMissing: false });
  app.use('/api/auth', session({
    name: 'leetbattle.sid', secret: sessionSecret, store,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' },
  }));
  app.use('/api/auth', createAuthRouter({ pool, production, limit: authLimit }));
  app.use('/api/ejercicios', createEjerciciosRouter({ pool }));
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

  const frontendPath = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  if (existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('/{*path}', (_req, res) => res.sendFile(`${frontendPath}/index.html`));
  }
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Los datos enviados no son válidos.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'El formulario supera el tamaño permitido.' });
    console.error('Error de la API:', error.code || error.name);
    res.status(503).json({ message: 'El servicio no está disponible. Inténtalo de nuevo en unos instantes.' });
  });
  return { app, store };
}
