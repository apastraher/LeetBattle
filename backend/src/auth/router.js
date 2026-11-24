import { Router } from 'express';
import { hashPassword, verifyPassword } from './password.js';
import { rateLimit } from 'express-rate-limit';
import { validateLogin, validateRegistration } from './validation.js';

const cookieName = 'leetbattle.sid';
const publicUser = ({ id, alias, email, puntuacion }) => ({ id, alias, email, puntuacion });

export function createAuthRouter({ pool, production = false, limit = 20 }) {
  const router = Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' },
  });
  // Se verifica también una contraseña ficticia cuando el usuario no existe.
  const dummyHash = hashPassword('leetbattle-dummy-password');

  async function startSession(req, user) {
    await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
    req.session.userId = user.id;
    await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
  }

  router.post('/register', limiter, async (req, res) => {
    const { values, fields } = validateRegistration(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ message: 'Revisa los campos indicados.', fields });
    const passwordHash = await hashPassword(values.password);
    const result = await pool.query(
      'INSERT INTO public.usuarios (alias, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id, alias, email, puntuacion',
      [values.alias, values.email, passwordHash],
    );
    const user = result.rows[0];
    if (!user) return res.status(409).json({ message: 'El usuario o correo electrónico ya está registrado.' });
    await startSession(req, user);
    res.status(201).json({ user: publicUser(user) });
  });

  router.post('/login', limiter, async (req, res) => {
    const { values, fields } = validateLogin(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ message: 'Revisa los campos indicados.', fields });
    const result = await pool.query(
      'SELECT id, alias, email, password_hash, puntuacion FROM public.usuarios WHERE lower(email) = lower($1) OR lower(alias) = lower($1) LIMIT 1',
      [values.identifier],
    );
    const user = result.rows[0];
    const matches = await verifyPassword(values.password, user?.password_hash || await dummyHash);
    if (!user || !matches) return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    await startSession(req, user);
    res.json({ user: publicUser(user) });
  });

  router.get('/me', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Inicia sesión para continuar.' });
    const result = await pool.query('SELECT id, alias, email, puntuacion FROM public.usuarios WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]) {
      await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
      return res.status(401).json({ message: 'Inicia sesión para continuar.' });
    }
    res.json({ user: publicUser(result.rows[0]) });
  });

  router.post('/logout', async (req, res) => {
    await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
    res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: production, path: '/' });
    res.json({ message: 'Sesión cerrada.' });
  });

  return router;
}
