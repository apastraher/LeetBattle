-- El último reto publicado sigue disponible hasta que se publique el siguiente.
ALTER TABLE public.ejercicios
    ADD COLUMN descripcion_entrada text,
    ADD COLUMN descripcion_salida text;

CREATE TABLE public.retos_diarios (
    fecha date PRIMARY KEY,
    ejercicio_id bigint NOT NULL REFERENCES public.ejercicios (id)
);
CREATE INDEX retos_diarios_ejercicio_idx ON public.retos_diarios (ejercicio_id);

INSERT INTO public.ejercicios (
    titulo, enunciado, dificultad, fuente, id_en_fuente,
    descripcion_entrada, descripcion_salida
) VALUES (
    '¡Hola mundo!',
    'Todo empieza con un saludo. Practica tu primer bucle escribiendo un programa que repita un mensaje tantas veces como indique la entrada.',
    'facil', 'aceptaelreto.com', '116',
    'Recibirás un entero n en una sola línea. Su valor estará entre 0 y 5, ambos incluidos, y determinará el número de saludos.',
    'Imprime Hola mundo. exactamente n veces, cada saludo en su propia línea. Si n es 0, no escribas nada.'
);

INSERT INTO public.casos_prueba (ejercicio_id, entrada, salida_esperada, es_ejemplo)
SELECT id, E'3\n', E'Hola mundo.\nHola mundo.\nHola mundo.\n', true
FROM public.ejercicios WHERE fuente = 'aceptaelreto.com' AND id_en_fuente = '116';

-- Límites y resto de valores válidos; la API nunca expone los casos privados.
INSERT INTO public.casos_prueba (ejercicio_id, entrada, salida_esperada)
SELECT e.id, n::text || E'\n', repeat(E'Hola mundo.\n', n)
FROM public.ejercicios e CROSS JOIN generate_series(0, 5) AS n
WHERE e.fuente = 'aceptaelreto.com' AND e.id_en_fuente = '116' AND n <> 3;

INSERT INTO public.retos_diarios (fecha, ejercicio_id)
SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::date, id
FROM public.ejercicios WHERE fuente = 'aceptaelreto.com' AND id_en_fuente = '116';
