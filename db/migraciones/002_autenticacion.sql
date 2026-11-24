-- Los identificadores se comparan sin distinguir mayúsculas y minúsculas.
CREATE UNIQUE INDEX usuarios_email_minusculas_idx ON public.usuarios (lower(email));
CREATE UNIQUE INDEX usuarios_alias_minusculas_idx ON public.usuarios (lower(alias));

-- Formato esperado por connect-pg-simple. La cookie contiene solo el ID firmado.
CREATE TABLE public.sesiones (
    sid varchar NOT NULL PRIMARY KEY,
    sess json NOT NULL,
    expire timestamp(6) NOT NULL
);
CREATE INDEX sesiones_expiracion_idx ON public.sesiones (expire);
