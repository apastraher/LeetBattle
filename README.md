# LeetBattle

Mi TFG de DAW: una web de retos de programación con modo práctica y duelos 1v1.

Primera entrega: inicio de sesión y registro con React, Vite y Tailwind CSS, API Express y PostgreSQL. Incluye sesión de servidor, persistencia al recargar y cierre de sesión. El tema oscuro sigue los mockups; el botón de la esquina permite usar el tema claro.

## Arrancar la aplicación

Necesitas Docker Desktop. Para desarrollo con Node en el portátil, instala también Node.js LTS (22.12 o superior; recomendado 24).

Conserva el `.env` existente. Si no existe, copia `.env.example` a `.env` y configura `DB_PASSWORD`. No subas este archivo a Git.

Desde la raíz del repositorio, prepara la base de datos:

```powershell
docker compose up -d --wait db
docker compose exec -T db sh /leetbattle/db/migrar.sh
```

Instala las dependencias una vez y arranca la web y la API:

```powershell
npm install
npm run dev
```

Abre **http://127.0.0.1:5173**. Usa esa dirección para mantener el mismo origen entre el navegador, Vite y la API. Pulsa Ctrl+C en la terminal para parar ambos procesos.

- `/iniciar-sesion`: acceso con usuario o correo y contraseña.
- `/registro`: creación de cuenta con usuario, correo y contraseña repetida.
- `/cuenta`: muestra el alias y permite cerrar la sesión. Se recupera también al recargar.

No hay cuentas ni contraseñas de demostración precargadas: crea una cuenta desde Registro. El usuario utiliza entre 3 y 24 letras, números o guiones bajos, y la contraseña entre 8 y 128 caracteres. Los usuarios y correos son únicos sin distinguir mayúsculas. La recuperación por correo queda pendiente; su enlace informa de esa limitación.

Para conservar las sesiones también al reiniciar la API, añade un `SESSION_SECRET` aleatorio y estable al `.env`. Sin esa variable se genera uno temporal en desarrollo. Puedes generar un valor con:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

### Alternativa: todo en Docker

Después de preparar la base de datos y sus migraciones:

```powershell
docker compose --profile app up --build
```

La web usa la misma dirección, **http://127.0.0.1:5173**. El código se monta como volumen para actualizarlo durante el desarrollo. No ejecutes esta alternativa y `npm run dev` a la vez: usan los mismos puertos. Si cambias las dependencias, reconstruye las imágenes y ejecuta `docker compose run --rm --no-deps backend npm ci` para actualizar el volumen de dependencias; los datos PostgreSQL están en un volumen separado.

## Cómo está organizada

```text
frontend/
  src/components/   Formulario reutilizable, cabecera y cambio de tema
  src/pages/        Acceso, registro y cuenta
  src/api/          Peticiones HTTP de autenticación
  src/styles.css    Paletas, tipografía y estilos adaptables
backend/
  src/auth/         Rutas, validación y hashes de contraseñas
  src/app.js        Express, cookies, sesiones y protección de peticiones
  src/config.js     Variables privadas del servidor
  test/             Pruebas de integración con PostgreSQL
db/migraciones/     Esquema versionado y tabla de sesiones
docs/diseno/        Los dos PNG de referencia
tests/e2e/          Pruebas de navegador
```

El navegador envía JSON a `/api/auth`. En desarrollo Vite redirige esas peticiones a Express en el puerto 3000. Express valida los datos y consulta PostgreSQL con parámetros. El registro guarda un hash scrypt con salt aleatoria, nunca la contraseña original. El acceso crea una sesión en `sesiones` y devuelve una cookie `HttpOnly`, `SameSite=Lax`, con una duración de siete días. Al salir, se invalida la sesión en el servidor. No se guardan tokens de acceso en `localStorage`; solo la preferencia de tema.

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/auth/register` | Crear usuario e iniciar sesión |
| POST | `/api/auth/login` | Verificar credenciales y crear sesión |
| GET | `/api/auth/me` | Recuperar el usuario autenticado |
| POST | `/api/auth/logout` | Invalidar la sesión y borrar la cookie |

Inter, Space Grotesk y JetBrains Mono se instalan con Fontsource y se sirven desde la aplicación. Las utilidades Tailwind se vinculan a las variables CSS de `AGENTS.md`. Referencias técnicas: [Vite](https://vite.dev/guide/), [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite) y [sesiones de Express](https://expressjs.com/en/resources/middleware/session/).

## Comprobar los cambios

Con PostgreSQL arrancado y las migraciones aplicadas:

```powershell
npm test
npm run build
npm run test:e2e
```

Las pruebas de API usan PostgreSQL real dentro de una transacción que se revierte al terminar. Puedes apuntarlas a otra base migrada con `TEST_DATABASE_URL`. Las pruebas de navegador levantan la aplicación si hace falta, crean un usuario con un nombre aleatorio y eliminan exclusivamente ese usuario y sus sesiones al terminar. En Windows usan Edge; en otros sistemas instala Chromium con `npx playwright install chromium` o elige un navegador mediante `PLAYWRIGHT_BROWSER_CHANNEL`.

Se comprueban registro, errores, acceso por alias y correo, cookie, recarga, cierre de sesión, validación del servidor y límite de intentos. En navegador se verifican fuentes cargadas, colores calculados, temas, móvil, texto al 200 %, contraseñas y teclado. Las capturas se guardan en `test-results/` (ignorado por Git).

## Compilación para despliegue

```powershell
npm run build
npm start
```

Express sirve también `frontend/dist`, de modo que web y API comparten origen. En local configura `APP_ORIGIN=http://127.0.0.1:3000` para esta modalidad. El `Dockerfile` incluye una etapa `production` para empaquetar esa misma aplicación. Antes de usarla con `NODE_ENV=production`, configura `SESSION_SECRET` (al menos 32 caracteres), `APP_ORIGIN` con la URL HTTPS real y PostgreSQL. Las cookies de producción requieren HTTPS. Se asume un proxy de confianza delante de Express.

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
