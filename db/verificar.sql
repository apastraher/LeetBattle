\set ON_ERROR_STOP on
BEGIN;

-- Un fallo esperado debe ser de la clase y restricción correctas.
CREATE FUNCTION pg_temp.esperar_rechazo(consulta text, codigo text, restriccion text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    restriccion_real text;
BEGIN
    BEGIN
        EXECUTE consulta;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS restriccion_real = CONSTRAINT_NAME;
        IF SQLSTATE = codigo AND restriccion_real = restriccion THEN
            RETURN;
        END IF;
        RAISE;
    END;
    RAISE EXCEPTION 'Se aceptó una operación que debía violar %', restriccion;
END;
$$;

DO $$
DECLARE
    u1 bigint; u2 bigint; u3 bigint;
    e1 bigint; e2 bigint; d bigint;
    total integer;
    marca text := 'verificacion_' || txid_current()::text;
BEGIN
    SELECT count(*) INTO total FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name IN ('usuarios', 'ejercicios', 'casos_prueba', 'duelos',
                         'participantes_duelo', 'envios');
    IF total <> 6 THEN RAISE EXCEPTION 'Faltan tablas: aparecen % de 6', total; END IF;

    INSERT INTO usuarios (alias, email, password_hash) VALUES
        (marca || '_1', marca || '_1@example.invalid', 'hash_solo_de_prueba') RETURNING id INTO u1;
    INSERT INTO usuarios (alias, email, password_hash) VALUES
        (marca || '_2', marca || '_2@example.invalid', 'hash_solo_de_prueba') RETURNING id INTO u2;
    INSERT INTO usuarios (alias, email, password_hash) VALUES
        (marca || '_3', marca || '_3@example.invalid', 'hash_solo_de_prueba') RETURNING id INTO u3;
    INSERT INTO ejercicios (titulo, enunciado, dificultad)
        VALUES ('Suma', 'Sumar dos números.', 'facil') RETURNING id INTO e1;
    INSERT INTO ejercicios (titulo, enunciado, dificultad, fuente, id_en_fuente)
        VALUES ('Otro', 'Otro ejercicio.', 'media', marca, '1') RETURNING id INTO e2;

    INSERT INTO casos_prueba (ejercicio_id, entrada, salida_esperada, es_ejemplo)
        VALUES (e1, E' 1  2\n', E'3 \n', true);
    IF NOT EXISTS (SELECT 1 FROM casos_prueba WHERE ejercicio_id = e1
                   AND entrada = E' 1  2\n' AND salida_esperada = E'3 \n') THEN
        RAISE EXCEPTION 'Se alteraron los espacios o saltos de línea';
    END IF;

    INSERT INTO envios (usuario_id, ejercicio_id, codigo, lenguaje)
        VALUES (u3, e2, 'print(3)', 'python');
    IF NOT EXISTS (SELECT 1 FROM envios WHERE usuario_id = u3
                   AND duelo_id IS NULL AND veredicto = 'pendiente') THEN
        RAISE EXCEPTION 'Falló el envío de práctica pendiente';
    END IF;

    INSERT INTO duelos (ejercicio_id) VALUES (e1) RETURNING id INTO d;
    INSERT INTO participantes_duelo (duelo_id, usuario_id, puesto, puntos_antes)
        VALUES (d, u1, 1, 1000), (d, u2, 2, 1000);
    UPDATE duelos SET estado = 'en_curso', inicio = CURRENT_TIMESTAMP WHERE id = d;
    INSERT INTO envios (usuario_id, ejercicio_id, duelo_id, codigo, lenguaje, veredicto)
        VALUES (u1, e1, d, 'print(3)', 'python', 'aceptado'),
               (u2, e1, d, 'print(0)', 'python', 'respuesta_incorrecta');

    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO envios (usuario_id, ejercicio_id, duelo_id, codigo, lenguaje) VALUES (%s,%s,%s,''x'',''python'')',
        u3, e1, d), '23503', 'envios_participante_duelo');
    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO envios (usuario_id, ejercicio_id, duelo_id, codigo, lenguaje) VALUES (%s,%s,%s,''x'',''python'')',
        u1, e2, d), '23503', 'envios_ejercicio_duelo');
    PERFORM pg_temp.esperar_rechazo(format(
        'UPDATE duelos SET estado=''finalizado'',fin=CURRENT_TIMESTAMP,ganador_id=%s WHERE id=%s',
        u3, d), '23503', 'duelos_ganador_participante');
    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO participantes_duelo VALUES (%s,%s,1,1000,NULL)', d, u3),
        '23505', 'participantes_duelo_puesto_unico');
    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO participantes_duelo VALUES (%s,%s,3,1000,NULL)', d, u3),
        '23514', 'participantes_duelo_puesto_check');
    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO participantes_duelo VALUES (%s,%s,2,1000,NULL)', d, u1),
        '23505', 'participantes_duelo_pkey');
    PERFORM pg_temp.esperar_rechazo(format(
        'INSERT INTO ejercicios (titulo,enunciado,dificultad,fuente,id_en_fuente) VALUES (''Duplicado'',''x'',''facil'',%L,''1'')', marca),
        '23505', 'ejercicios_origen_unico');

    UPDATE participantes_duelo SET puntos_despues = CASE usuario_id WHEN u1 THEN 1010 ELSE 990 END
        WHERE duelo_id = d;
    UPDATE usuarios SET puntuacion = CASE id WHEN u1 THEN 1010 ELSE 990 END WHERE id IN (u1, u2);
    UPDATE duelos SET estado = 'finalizado', fin = CURRENT_TIMESTAMP, ganador_id = u1 WHERE id = d;
    -- También se admite un empate.
    UPDATE duelos SET ganador_id = NULL WHERE id = d;
    RAISE NOTICE 'OK: seis tablas, práctica, duelo, ganador, rechazos, cierre y empate.';
END;
$$;

ROLLBACK;
\echo Verificación terminada: los datos de prueba se han revertido.
