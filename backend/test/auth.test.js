import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { config } from '../src/config.js';
import { createApp } from '../src/app.js';

// Una sola conexión mantiene TODOS los cambios de la suite dentro de una
// transacción que se revierte al finalizar. Nunca se borran usuarios existentes.
if (config.production) throw new Error('Estas pruebas no se ejecutan en producción.');
const pool = new pg.Client(process.env.TEST_DATABASE_URL ? { connectionString: process.env.TEST_DATABASE_URL } : config.database);
const { app, store } = createApp({ pool, sessionSecret: 'secreto-exclusivo-de-pruebas-de-integracion', origin: 'http://127.0.0.1:5173', authLimit: 100 });
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const credentials = { alias: `test_${suffix}`, email: `test_${suffix}@example.com`, password: 'Contraseña segura 123 ñ', confirmPassword: 'Contraseña segura 123 ñ' };

before(async () => { await pool.connect(); await pool.query('BEGIN'); });
after(async () => { store.close(); await pool.query('ROLLBACK'); await pool.end(); });

test('registro real, hash seguro, cookie HttpOnly y sesión persistente', async () => {
  const agent = request.agent(app);
  const result = await agent.post('/api/auth/register').send(credentials).expect(201);
  assert.equal(result.body.user.alias, credentials.alias);
  assert.equal(result.body.user.password_hash, undefined);
  assert.match(result.headers['set-cookie'][0], /HttpOnly/);
  assert.match(result.headers['set-cookie'][0], /SameSite=Lax/);
  const { rows } = await pool.query('SELECT password_hash FROM public.usuarios WHERE email = $1', [credentials.email]);
  assert.match(rows[0].password_hash, /^scrypt\$/);
  assert.notEqual(rows[0].password_hash, credentials.password);
  const me = await agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.id, result.body.user.id);
  const cookie = result.headers['set-cookie'][0].split(';')[0];
  const reloaded = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
  assert.equal(reloaded.body.user.alias, credentials.alias);
  await agent.post('/api/auth/logout').send({}).expect(200);
  await agent.get('/api/auth/me').expect(401);
  await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
});

test('acceso por correo y alias sin distinguir mayúsculas; regenera la sesión', async () => {
  const agent = request.agent(app);
  const first = await agent.post('/api/auth/login').send({ identifier: credentials.email.toUpperCase(), password: credentials.password }).expect(200);
  const oldCookie = first.headers['set-cookie'][0].split(';')[0];
  const second = await agent.post('/api/auth/login').send({ identifier: credentials.alias.toUpperCase(), password: credentials.password }).expect(200);
  assert.notEqual(first.headers['set-cookie'][0], second.headers['set-cookie'][0]);
  await request(app).get('/api/auth/me').set('Cookie', oldCookie).expect(401);
  await agent.post('/api/auth/logout').send({}).expect(200);
});

test('rechaza duplicados sin distinguir mayúsculas', async () => {
  await request(app).post('/api/auth/register').send({ ...credentials, alias: credentials.alias.toUpperCase(), email: `other_${suffix}@example.com` }).expect(409);
  await request(app).post('/api/auth/register').send({ ...credentials, alias: `other_${suffix}`, email: credentials.email.toUpperCase() }).expect(409);
});

test('el servidor valida datos aunque se omitan las comprobaciones del navegador', async () => {
  const invalid = await request(app).post('/api/auth/register').send({ alias: 'a', email: 'incorrecto', password: 'corta', confirmPassword: 'distinta' }).expect(400);
  assert.deepEqual(Object.keys(invalid.body.fields).sort(), ['alias', 'confirmPassword', 'email', 'password']);
  await request(app).post('/api/auth/login').send({ identifier: {}, password: [] }).expect(400);
  await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('null').expect(400);
});

test('credenciales incorrectas y usuario inexistente tienen el mismo mensaje', async () => {
  const invalid = await request(app).post('/api/auth/login').send({ identifier: credentials.email, password: 'incorrecta' }).expect(401);
  const missing = await request(app).post('/api/auth/login').send({ identifier: `missing_${suffix}`, password: 'incorrecta' }).expect(401);
  assert.equal(invalid.body.message, 'Correo o contraseña incorrectos');
  assert.deepEqual(invalid.body, missing.body);
  await request(app).get('/api/auth/me').expect(401);
});

test('rechaza formularios externos, JSON mal formado y payloads demasiado grandes', async () => {
  await request(app).post('/api/auth/login').set('Origin', 'https://externo.example').send({}).expect(403);
  await request(app).post('/api/auth/login').set('Sec-Fetch-Site', 'cross-site').send({}).expect(403);
  await request(app).post('/api/auth/login').type('form').send('identifier=test&password=test').expect(415);
  await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{mal').expect(400);
  await request(app).post('/api/auth/login').send({ password: 'a'.repeat(17000) }).expect(413);
});

test('limita los intentos fallidos', async () => {
  const limited = createApp({ pool, sessionSecret: 'otro-secreto-de-pruebas', origin: 'http://127.0.0.1:5173', authLimit: 2 });
  try {
    for (let i = 0; i < 2; i++) await request(limited.app).post('/api/auth/login').send({}).expect(400);
    await request(limited.app).post('/api/auth/login').send({}).expect(429);
  } finally { limited.store.close(); }
});
