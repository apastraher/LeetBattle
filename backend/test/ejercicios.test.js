import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import request from 'supertest';
import { config } from '../src/config.js';
import { createApp } from '../src/app.js';

if (config.production) throw new Error('Estas pruebas no se ejecutan en producción.');
const pool = new pg.Client(process.env.TEST_DATABASE_URL ? { connectionString: process.env.TEST_DATABASE_URL } : config.database);
const { app, store } = createApp({ pool, sessionSecret: 'secreto-exclusivo-pruebas-reto-diario', origin: 'http://127.0.0.1:5173' });

before(async () => { await pool.connect(); await pool.query('BEGIN'); });
after(async () => { store.close(); await pool.query('ROLLBACK'); await pool.end(); });

test('el ejercicio 116 está persistido con su ejemplo y todos los valores válidos', async () => {
  const { rows } = await pool.query(`
    SELECT e.titulo, c.entrada, c.salida_esperada, c.es_ejemplo
    FROM public.ejercicios e JOIN public.casos_prueba c ON c.ejercicio_id = e.id
    WHERE e.fuente = 'aceptaelreto.com' AND e.id_en_fuente = '116'
    ORDER BY c.entrada
  `);
  assert.equal(rows.length, 6);
  for (const [n, row] of rows.entries()) {
    assert.equal(row.titulo, '¡Hola mundo!');
    assert.equal(row.entrada, `${n}\n`);
    assert.equal(row.salida_esperada, 'Hola mundo.\n'.repeat(n));
    assert.equal(row.es_ejemplo, n === 3);
  }
});

test('publica el último reto disponible, conserva el anterior y oculta los casos privados y los retos futuros', async () => {
  await pool.query('SAVEPOINT calendario');
  try {
    const { rows } = await pool.query(`
      INSERT INTO public.ejercicios (titulo, enunciado, dificultad)
      VALUES ('Reto publicado', 'Enunciado público.', 'facil'), ('Reto futuro', 'No debe aparecer.', 'media')
      RETURNING id
    `);
    const id = rows[0].id;
    await pool.query('DELETE FROM public.retos_diarios');
    await pool.query(`INSERT INTO public.retos_diarios (fecha, ejercicio_id) VALUES
      ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::date - 1, $1),
      ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::date + 1, $2)`, [id, rows[1].id]);
    await pool.query(`INSERT INTO public.casos_prueba (ejercicio_id, entrada, salida_esperada, es_ejemplo)
      VALUES ($1, 'visible', 'ejemplo', true), ($1, 'secreto', 'privado', false)`, [id]);
    const response = await request(app).get('/api/ejercicios/reto-diario').expect(200);
    assert.equal(response.body.reto.id, id);
    assert.deepEqual(response.body.reto.ejemplos, [{ entrada: 'visible', salida: 'ejemplo' }]);
    assert.doesNotMatch(JSON.stringify(response.body), /secreto|privado|Reto futuro/);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['set-cookie'], undefined);
  } finally { await pool.query('ROLLBACK TO SAVEPOINT calendario'); }
});

test('informa cuando todavía no hay ningún reto publicado', async () => {
  await pool.query('SAVEPOINT sin_reto');
  try {
    await pool.query('DELETE FROM public.retos_diarios');
    const response = await request(app).get('/api/ejercicios/reto-diario').expect(404);
    assert.match(response.body.message, /no hay un reto diario publicado/);
  } finally { await pool.query('ROLLBACK TO SAVEPOINT sin_reto'); }
});
