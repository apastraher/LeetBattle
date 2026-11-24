-- La transacción y el registro de versiones los gestiona db/migrar.sh.
CREATE TABLE public.usuarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    alias text NOT NULL UNIQUE CHECK (btrim(alias) <> ''),
    email text NOT NULL UNIQUE CHECK (btrim(email) <> ''),
    password_hash text NOT NULL CHECK (btrim(password_hash) <> ''),
    puntuacion integer NOT NULL DEFAULT 1000 CHECK (puntuacion >= 0)
);

CREATE TABLE public.ejercicios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo text NOT NULL CHECK (btrim(titulo) <> ''),
    enunciado text NOT NULL CHECK (btrim(enunciado) <> ''),
    dificultad text NOT NULL CHECK (dificultad IN ('facil', 'media', 'dificil')),
    fuente text,
    id_en_fuente text,
    CONSTRAINT ejercicios_origen_completo CHECK (
        (fuente IS NULL AND id_en_fuente IS NULL)
        OR (fuente IS NOT NULL AND id_en_fuente IS NOT NULL
            AND btrim(fuente) <> '' AND btrim(id_en_fuente) <> '')
    ),
    CONSTRAINT ejercicios_origen_unico UNIQUE (fuente, id_en_fuente)
);

CREATE TABLE public.casos_prueba (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ejercicio_id bigint NOT NULL REFERENCES public.ejercicios (id),
    entrada text NOT NULL,
    salida_esperada text NOT NULL,
    es_ejemplo boolean NOT NULL DEFAULT false
);

CREATE TABLE public.duelos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ejercicio_id bigint NOT NULL REFERENCES public.ejercicios (id),
    estado text NOT NULL DEFAULT 'en_espera'
        CHECK (estado IN ('en_espera', 'en_curso', 'finalizado', 'cancelado')),
    inicio timestamptz,
    fin timestamptz,
    ganador_id bigint,
    -- Esta clave permite referenciar el ejercicio de la partida desde envios.
    CONSTRAINT duelos_id_ejercicio_unico UNIQUE (id, ejercicio_id),
    CONSTRAINT duelos_fechas_ordenadas CHECK (fin IS NULL OR inicio IS NULL OR fin >= inicio),
    CONSTRAINT duelos_estado_coherente CHECK (
        (estado = 'en_espera' AND inicio IS NULL AND fin IS NULL AND ganador_id IS NULL)
        OR (estado = 'en_curso' AND inicio IS NOT NULL AND fin IS NULL AND ganador_id IS NULL)
        OR (estado = 'finalizado' AND inicio IS NOT NULL AND fin IS NOT NULL)
        OR (estado = 'cancelado' AND fin IS NOT NULL AND ganador_id IS NULL)
    )
);

CREATE TABLE public.participantes_duelo (
    duelo_id bigint NOT NULL REFERENCES public.duelos (id),
    usuario_id bigint NOT NULL REFERENCES public.usuarios (id),
    puesto smallint NOT NULL CHECK (puesto IN (1, 2)),
    puntos_antes integer NOT NULL CHECK (puntos_antes >= 0),
    puntos_despues integer CHECK (puntos_despues >= 0),
    PRIMARY KEY (duelo_id, usuario_id),
    CONSTRAINT participantes_duelo_puesto_unico UNIQUE (duelo_id, puesto)
);

-- Se añade después de crear participantes_duelo para resolver la referencia circular.
ALTER TABLE public.duelos ADD CONSTRAINT duelos_ganador_participante
    FOREIGN KEY (id, ganador_id)
    REFERENCES public.participantes_duelo (duelo_id, usuario_id);

CREATE TABLE public.envios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES public.usuarios (id),
    ejercicio_id bigint NOT NULL REFERENCES public.ejercicios (id),
    duelo_id bigint,
    codigo text NOT NULL CHECK (btrim(codigo) <> ''),
    lenguaje text NOT NULL CHECK (btrim(lenguaje) <> ''),
    enviado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    veredicto text NOT NULL DEFAULT 'pendiente' CHECK (veredicto IN (
        'pendiente', 'aceptado', 'respuesta_incorrecta', 'error_compilacion',
        'error_ejecucion', 'tiempo_excedido', 'memoria_excedida', 'error_interno'
    )),
    -- MATCH SIMPLE omite estas comprobaciones cuando duelo_id es NULL (práctica).
    CONSTRAINT envios_participante_duelo FOREIGN KEY (duelo_id, usuario_id)
        REFERENCES public.participantes_duelo (duelo_id, usuario_id),
    CONSTRAINT envios_ejercicio_duelo FOREIGN KEY (duelo_id, ejercicio_id)
        REFERENCES public.duelos (id, ejercicio_id)
);

-- PostgreSQL no crea automáticamente índices en el lado que referencia una FK.
CREATE INDEX casos_prueba_ejercicio_idx ON public.casos_prueba (ejercicio_id);
CREATE INDEX duelos_ejercicio_idx ON public.duelos (ejercicio_id);
CREATE INDEX participantes_duelo_usuario_idx ON public.participantes_duelo (usuario_id);
CREATE INDEX envios_usuario_fecha_idx ON public.envios (usuario_id, enviado_en DESC);
CREATE INDEX envios_ejercicio_idx ON public.envios (ejercicio_id);
CREATE INDEX envios_duelo_usuario_idx ON public.envios (duelo_id, usuario_id);
