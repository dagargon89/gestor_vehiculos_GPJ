# Cómo levantar los servicios

## Opciones para levantar el proyecto

### Solo infraestructura (Postgres + Redis), backend y frontend en local

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

- En el navegador o con `curl`: **`http://localhost:3000/api/health`**
- Debe devolver algo como: `{"status":"ok","timestamp":"..."}`

Si no responde, revisa que el backend esté en marcha (terminal con `npm run start:dev` en `backend/` o contenedor `fleet-backend` con `docker compose up -d`).

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
