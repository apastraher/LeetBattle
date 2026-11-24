#!/bin/sh
# Se ejecuta DENTRO de db: solo necesita sh, sha256sum y psql de la imagen.
set -eu
export LC_ALL=C
directorio=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
guion=$(mktemp)
trap 'rm -f "$guion"' EXIT HUP INT TERM

cat > "$guion" <<'SQL'
\set ON_ERROR_STOP on
BEGIN;
-- Un único proceso aplica migraciones; el bloqueo se libera al terminar.
SELECT pg_advisory_xact_lock(176215, 1);
CREATE SCHEMA IF NOT EXISTS control_migraciones;
CREATE TABLE IF NOT EXISTS control_migraciones.versiones (
    version text PRIMARY KEY,
    sha256 text NOT NULL,
    aplicada_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL

for archivo in "$directorio"/migraciones/[0-9][0-9][0-9]_*.sql; do
    [ -f "$archivo" ] || { echo 'No hay migraciones SQL.' >&2; exit 1; }
    nombre=${archivo##*/}
    # Solo estos caracteres pueden interpolarse en las instrucciones SQL/psql.
    case "$nombre" in
        *[!a-z0-9_.]*) echo "Nombre de migración no válido: $nombre" >&2; exit 1 ;;
    esac
    suma=$(sha256sum "$archivo")
    suma=${suma%% *}
    cat >> "$guion" <<SQL
SELECT EXISTS (SELECT 1 FROM control_migraciones.versiones
               WHERE version = '$nombre') AS aplicada,
       EXISTS (SELECT 1 FROM control_migraciones.versiones
               WHERE version = '$nombre' AND sha256 <> '$suma') AS modificada
\gset
\if :modificada
    \echo ERROR: Se ha modificado la migración aplicada $nombre. Crea una nueva versión.
    DO \$\$ BEGIN RAISE EXCEPTION 'Una migración aplicada ha cambiado'; END \$\$;
\endif
\if :aplicada
    \echo Ya aplicada: $nombre
\else
    \echo Aplicando: $nombre
    \ir $archivo
    INSERT INTO control_migraciones.versiones (version, sha256)
    VALUES ('$nombre', '$suma');
\endif
SQL
done
printf '\nCOMMIT;\n' >> "$guion"
psql -X --set=ON_ERROR_STOP=1 --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --file="$guion"
