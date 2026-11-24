# LeetBattle

Mi TFG de DAW: una web de retos de programación con modo práctica y duelos 1v1.

Por ahora, este repositorio tiene una base de datos PostgreSQL en Docker para empezar a desarrollar.

## Preparar la base de datos

Abre Docker Desktop y ejecuta los comandos desde la raíz del repositorio en PowerShell.

Si aún no tienes `.env`, créalo con estas variables y elige tu contraseña local:

```dotenv
DB_PASSWORD=elige_tu_clave_local
DB_PORT=5432
```

`.env` está ignorado por Git. Si ya existe, conserva su configuración.

Arranca PostgreSQL y aplica las migraciones para crear las tablas:

```powershell
docker compose up -d --wait db
docker compose exec -T db sh /leetbattle/db/migrar.sh
docker compose ps db
```

El servicio debe aparecer como `healthy`. Las migraciones ya aplicadas se saltan, así que puedes repetir estos comandos sin perder datos.

## Hacer consultas

Entra en PostgreSQL desde PowerShell:

```powershell
docker compose exec db psql -U leetbattle_dev -d leetbattle
```

Una vez dentro:

```sql
SELECT * FROM usuarios;
\dt
\d envios
\q
```

`\dt` lista las tablas, `\d envios` muestra su estructura y `\q` sale. Las consultas SQL terminan con `;`. Al principio las tablas están vacías.

## Para el día a día

Arrancar:

```powershell
docker compose up -d --wait db
```

Ver logs:

```powershell
docker compose logs --tail 100 db
```

Parar conservando los datos:

```powershell
docker compose stop db
```

Los datos quedan guardados en un volumen de Docker. `docker compose down` también los conserva; **`docker compose down -v` los elimina**.

El esquema está en `db/migraciones` y las pruebas en `db/verificar.sql`. Para cambiar las tablas, añade una nueva migración y ejecuta `migrar.sh`; no edites una que ya se haya aplicado.
