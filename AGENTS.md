## Identidad visual de LeetBattle

Aplica esta guía a todas las pantallas y componentes. Usa los mockups como referencia de composición y esta guía como referencia de colores y tipografía. Los textos y ejemplos de la guía sirven para ilustrar el diseño. Cada pantalla debe mostrar únicamente el contenido que corresponda a su función.

### Colores

El tema oscuro es el predeterminado. El tema claro es la alternativa. Define las dos paletas en la hoja global de estilos mediante estas variables CSS:

| Variable | Tema oscuro | Tema claro | Uso |
|---|---|---|---|
| --color-fondo | #0F172A | #F8FAFC | Fondo general |
| --color-panel | #1E293B | #FFFFFF | Tarjetas, formularios, editor y clasificación |
| --color-accion | #2563EB | #2563EB | Acción principal y enlaces de acción |
| --color-sobre-accion | #F8FAFC | #FFFFFF | Texto e iconos sobre el botón azul |
| --color-texto | #F8FAFC | #0F172A | Títulos, contenido, etiquetas y valores de campos |
| --color-texto-secundario | #CBD5E1 | #475569 | Instrucciones, metadatos y texto de apoyo |
| --color-exito | #4ADE80 | #15803D | Confirmaciones y soluciones aceptadas |
| --color-aviso | #FBBF24 | #92400E | Avisos y tiempo restante |
| --color-error | #FCA5A5 | #B91C1C | Errores de formulario y soluciones incorrectas |

- Usa las variables en los componentes. Si el proyecto usa Tailwind, vincula sus utilidades a estas mismas variables. Centraliza los valores hexadecimales en la definición de los temas.
- Mantén fondos y paneles neutros. Reserva el botón azul sólido para la acción principal de cada pantalla. Presenta las acciones secundarias con texto o contorno.
- Cambia de tema sustituyendo las variables por función. Cada pantalla debe usar un solo tema a la vez.
- Conserva la paleta también en hover, foco, autocompletado, mensajes de validación y componentes de terceros. Para el foco de teclado, usa un contorno visible con separación respecto al componente. Para el hover de un enlace, puedes usar subrayado.
- Expresa los estados con palabras además del color: «Solución aceptada», «Solución incorrecta», «Queda 1 minuto». Muestra también en texto quién ganó el duelo.
- Evita degradados, brillos de neón y colores decorativos añadidos. En superficies oscuras, si el azul del enlace resulta difícil de leer, usa texto principal subrayado.

### Tipografía

Carga las tres familias reales en el proyecto, con los pesos indicados y soporte para caracteres españoles. Las fuentes de reserva del sistema sirven únicamente mientras carga la fuente principal o si falla su carga.

| Elemento | Familia | Tamaño | Peso | Interlineado |
|---|---|---:|---:|---:|
| Título de pantalla | Space Grotesk | 2rem / 32px | 700 | 1.2 |
| Título de sección | Space Grotesk | 1.5rem / 24px | 700 | 1.25 |
| Párrafos, menús, etiquetas y campos | Inter | 1rem / 16px | 400 | 1.5 |
| Botones | Inter | 1rem / 16px | 600 | 1.5 |
| Ayuda y metadatos | Inter | 0.875rem / 14px | 400 | 1.5 |
| Editor, código y ejemplos | JetBrains Mono | 1rem / 16px | 400 | 1.5 |

- Configura Inter como fuente general y haz que botones, campos y selectores la hereden. Usa Space Grotesk exclusivamente para encabezados y JetBrains Mono para código.
- Usa unidades relativas y permite ampliar el texto sin que se corten etiquetas, botones o mensajes.
- En el editor comprueba que se distinguen `0 O o`, `1 l I`, `{ } [ ] ( )`, `< > !=` y `ñ á é í ó ú`.

### Aplicación al inicio de sesión

- Fondo con `--color-fondo` y formulario con `--color-panel`.
- «Iniciar sesión» como título en Space Grotesk, 32px y peso 700.
- Etiquetas visibles «Correo electrónico» y «Contraseña» en Inter. El texto de los campos usa `--color-texto`.
- Botón «Iniciar sesión» con fondo `--color-accion`, texto `--color-sobre-accion` e Inter a 16px y peso 600.
- Ante credenciales incorrectas, muestra «Correo o contraseña incorrectos» con `--color-error`. El mensaje debe poder anunciarse a lectores de pantalla.
- Mantén visible el foco al recorrer el formulario con Tab. Comprueba el formulario en móvil, con texto ampliado y en ambos temas.
- Antes de dar la pantalla por terminada, verifica en el navegador las fuentes realmente cargadas y los colores calculados del título, los campos y el botón.

## Arquitectura de LeetBattle

LeetBattle es una aplicación web de programación competitiva con modo práctica y duelos 1v1. El frontend, la API y la base de datos tienen responsabilidades separadas. El juez de código se incorporará cuando se implemente la evaluación de envíos.

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Pantallas, navegación, formularios y editor. Aplica la guía visual de este archivo. |
| Backend | Node.js + Express | Autenticación, sesiones, ejercicios, envíos, duelos y puntuación. Expone una API HTTP bajo `/api`. |
| Base de datos | PostgreSQL | Persistencia de usuarios, ejercicios, casos de prueba, envíos y duelos. |
| Juez de código | Proceso separado que ejecuta cada solución en un contenedor Docker temporal | Evalúa los envíos con límites de tiempo y memoria y registra el veredicto. |
| Entorno | Docker Compose en desarrollo local. Raspberry Pi 5 como destino de despliegue. | Permite desarrollar primero en el portátil y probar después en la Raspberry. |

### Organización del repositorio

Respeta la estructura que ya exista. Si el repositorio solo contiene la base de datos, usa esta distribución al incorporar cada componente:

- `frontend/` para la aplicación React.
- `backend/` para la API Express. Organiza su código por funcionalidad, empezando por `auth`.
- `db/` para las migraciones SQL y el script existente `db/migrar.sh`.
- `judge/` para el juez, cuando empiece la fase de evaluación de código.
- `docs/diseno/` para mockups y diagramas.
- Mantén el archivo de Docker Compose en la raíz.

### Reglas de implementación

- El navegador se comunica con la API. Las consultas a PostgreSQL y la variable `DATABASE_URL` pertenecen al servidor. Las credenciales y los secretos de sesión deben quedar fuera del frontend.
- La migración SQL es la referencia para los nombres de tablas, columnas y restricciones. Gestiona los cambios con nuevas migraciones mediante `db/migrar.sh`.
- El backend valida los datos y permisos de cada operación. En competición, el servidor determina los tiempos, el ganador y los cambios de puntuación.
- Usa HTTP para operaciones como iniciar sesión, consultar ejercicios o enviar una solución. Cuando se implementen los duelos, usa WebSocket para notificar al navegador el inicio de la partida, los veredictos y el resultado.
- Al implementar los envíos, la API guardará la solución como `pendiente` y devolverá su identificador. El juez evaluará el código fuera del proceso de Express. El contenedor que ejecuta el código del jugador debe quedar sin acceso a PostgreSQL, a los secretos de la aplicación y al socket de Docker.

### Primera entrega: inicio de sesión

Implementa únicamente el recorrido de autenticación con React, Express y el PostgreSQL existente:

1. React envía el formulario a `POST /api/auth/login`.
2. Express consulta `usuarios`, verifica `password_hash` y crea una sesión de servidor con una cookie `HttpOnly`.
3. React consulta `GET /api/auth/me` para recuperar el usuario y mostrar su alias, también después de recargar.
4. `POST /api/auth/logout` invalida la sesión y devuelve al usuario a la pantalla de acceso.

El criterio de entrega es poder iniciar sesión con un usuario real de PostgreSQL, conservar la sesión al recargar y cerrarla. Crea los módulos de ejercicios, duelos, WebSocket y juez cuando llegue su fase.