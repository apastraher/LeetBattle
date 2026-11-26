import { Router } from 'express';

export function createEjerciciosRouter({ pool }) {
  const router = Router();

  router.get('/reto-diario', async (_req, res) => {
    // La fecha la decide el servidor. No se adelantan los retos programados.
    const { rows } = await pool.query(`
      SELECT e.id, e.titulo, e.enunciado, e.dificultad, e.fuente, e.id_en_fuente,
             e.descripcion_entrada, e.descripcion_salida, r.fecha::text,
             COALESCE((
               SELECT json_agg(json_build_object('entrada', c.entrada, 'salida', c.salida_esperada) ORDER BY c.id)
               FROM public.casos_prueba c WHERE c.ejercicio_id = e.id AND c.es_ejemplo
             ), '[]'::json) AS ejemplos
      FROM public.retos_diarios r
      JOIN public.ejercicios e ON e.id = r.ejercicio_id
      WHERE r.fecha <= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::date
      ORDER BY r.fecha DESC LIMIT 1
    `);
    if (!rows[0]) return res.status(404).json({ message: 'Todavía no hay un reto diario publicado. Vuelve pronto.' });
    res.json({ reto: rows[0] });
  });

  return router;
}
