# Cómo levantar los servicios

## Opciones para levantar el proyecto

### Solo infraestructura (Postgres + Redis), backend y frontend en local

**Si el backend no arranca (EADDRINUSE en 3000) o el frontend muestra "No se pudo conectar con el servidor":** el puerto 3000 está ocupado por otro proceso. Libéralo antes:

1. Cierra **todas** las terminales donde tengas `npm run start:dev` o el backend (Ctrl+C).
2. En **PowerShell o CMD en Windows** (fuera de WSL): **`wsl --shutdown`**. Así se liberan los puertos de WSL. Luego abre de nuevo Cursor/WSL.
3. O en WSL: **`pkill -f "nest start"`** y espera 2–3 segundos antes de volver a arrancar el backend.

Luego:

```bash
docker compose up -d postgres redis
cd backend && npm run start:dev
```

En otra terminal:

```bash
cd frontend && npm run dev
```

### Todo con Docker (incluido el backend)

```bash
docker compose up -d
```

El frontend sigue ejecutándose en local para desarrollo:

```bash
cd frontend && npm run dev
```

---

## URL del API y comprobación

El frontend llama al backend usando la variable **`VITE_API_URL`** en `frontend/.env`. En desarrollo se recomienda:

- **`VITE_API_URL=/api`** — Las peticiones pasan por el proxy de Vite (evita errores CORS). El backend debe estar en `http://localhost:3000`.
- Si no usas proxy (ej. frontend en otra máquina): **`VITE_API_URL=http://localhost:3000/api`** (o la URL completa del backend).

**Antes de usar la app**, comprueba que el backend responde:

- Con `curl` (usa **127.0.0.1** para evitar problemas IPv6): **`curl http://127.0.0.1:3000/api/health`**
- Debe devolver algo como: `{"status":"ok","timestamp":"..."}`
- Si con `localhost` ves "Connection reset by peer", prueba `127.0.0.1`; el backend en Docker está publicado en IPv4.

Si no responde, revisa que el backend esté en marcha (terminal con `npm run start:dev` en `backend/` o contenedor `fleet-backend` con `docker compose up -d`).

**Si ves "Error en el servidor al crear o obtener tu usuario" o en la terminal de Vite `[vite] http proxy error: /api/auth/me` con `ECONNRESET`:**

La conexión con el backend se cierra antes de responder (backend caído, se cae al procesar la petición, o no llega al puerto correcto).

1. **Probar el backend en local (recomendado para desarrollo):** Deja solo Postgres y Redis en Docker y ejecuta el backend en tu máquina para ver el error en consola:
   ```bash
   docker compose up -d postgres redis
   cd backend && npm run start:dev
   ```
   En `backend/.env` usa `DB_HOST=localhost` (o el que corresponda si Postgres está en Docker: en WSL suele ser `localhost`). Así, cuando el frontend llame a `/api/auth/me`, el backend responderá desde la misma máquina y cualquier excepción (Firebase, BD, etc.) saldrá en la terminal del backend.

2. Si sigues usando el backend en Docker: `docker compose logs backend -f` y en otra pestaña recarga la app o haz login; revisa si en los logs aparece un error justo al recibir la petición.

3. Comprueba que algo responde en el puerto: `curl -v http://127.0.0.1:3000/api/health`. Si aquí también hay ECONNRESET o no responde, el backend no está escuchando o se cae al arrancar.

**Si el backend va en Docker y ves ECONNRESET al llamar a `/api/auth/me` (o al proxy):**

En entornos como **WSL2**, el backend dentro del contenedor puede responder bien desde dentro del contenedor pero las conexiones **desde el host** (Vite, navegador) se cierran (Connection reset by peer). Es un problema conocido de red Docker + WSL2.

**Solución recomendada:** deja solo Postgres y Redis en Docker y ejecuta el backend en tu máquina:

```bash
docker compose stop backend
# Si el puerto 3000 sigue ocupado: lsof -i :3000 y luego kill <PID>, o reinicia la terminal/WSL
cd backend && npm run start:dev
```

Si al arrancar el backend en local ves **EADDRINUSE (puerto 3000 en uso)**, libera el puerto: `kill $(lsof -t -i:3000)` o cierra cualquier otra instancia del backend / contenedor que use el 3000.

En `backend/.env` mantén `DB_HOST=localhost` y `REDIS_HOST=localhost` (los puertos 5432 y 6379 están expuestos por Docker). Así el frontend (Vite) y el backend comparten la misma red y no hay ECONNRESET.

**Si quieres seguir usando el backend en Docker:**

1. Revisa los logs: `docker compose logs backend`. Si el proceso se cae al iniciar, verás el error (BD, env, etc.).
2. Reconstruye: `docker compose build backend --no-cache && docker compose up -d backend`.
3. El healthcheck puede marcar "unhealthy" si las peticiones desde el host fallan; dentro del contenedor (`docker exec fleet-backend wget -q -O - http://127.0.0.1:3000/api/health`) puede responder bien.

Si el frontend se ejecuta desde **otra máquina o puerto** (o el backend en otro host), define en `frontend/.env`:

- **`VITE_API_URL=http://<IP-o-dominio-del-backend>:3000/api`**

por ejemplo `http://192.168.1.10:3000/api` o la URL que corresponda.

---

## Seeders de la base de datos

Para cargar datos de ejemplo en todas las tablas **excepto `users`** (roles, permisos, vehículos, proveedores, reservas, mantenimiento, etc.):

1. Asegúrate de que Postgres esté en marcha (`docker compose up -d postgres redis` o todo el stack).
2. **Credenciales de la BD:** El seed lee primero el `.env` de la **raíz del proyecto** (donde está `docker-compose.yml`), igual que Docker Compose. Si no tienes `.env` en la raíz, créalo con al menos `DB_PASSWORD=fleet_secret` (o la contraseña que hayas usado al levantar Postgres). Así la contraseña del seed coincidirá con la del contenedor. Opcionalmente puedes tener también `backend/.env` con el resto de variables.
3. Ejecuta desde la carpeta `backend/`:

```bash
npm run seed
```

Los seeders son idempotentes: si una tabla ya tiene datos, se omite. Las tablas que dependen de usuarios (reservations, sanctions, notifications) solo se rellenan si ya existe al menos un usuario en la BD (por ejemplo creado al hacer login con Firebase).

---

## Login en el frontend

El login requiere tener configuradas las variables **`VITE_FIREBASE_*`** en `frontend/.env` (proyecto Firebase con Auth y, opcionalmente, Storage). Copia `frontend/.env.example` a `frontend/.env` y rellena los valores.

**Importante:** Para que el usuario se cree en la tabla `users` de Postgres al hacer login (Google o email), el **backend debe estar en marcha** cuando inicies sesión. El frontend llama a `GET /api/auth/me` con el token de Firebase; en esa petición el backend crea o actualiza el usuario en la BD. Si el backend no está corriendo, el usuario existirá solo en Firebase y no en Postgres. Si ves el aviso amarillo en la app indicando que no se pudo conectar con el servidor, levanta el backend (`cd backend && npm run start:dev`) y vuelve a iniciar sesión.
