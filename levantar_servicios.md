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

El frontend llama al backend usando la variable **`VITE_API_URL`** en `frontend/.env`. Por defecto (si no la defines) se usa:

- `http://localhost:3000/api`

**Antes de usar la app**, comprueba que el backend responde:

- En el navegador o con `curl`: **`http://localhost:3000/api/health`**
- Debe devolver algo como: `{"status":"ok","timestamp":"..."}`

Si no responde, revisa que el backend esté en marcha (terminal con `npm run start:dev` en `backend/` o contenedor `fleet-backend` con `docker compose up -d`).

Si el frontend se ejecuta desde **otra máquina o puerto** (o el backend en otro host), define en `frontend/.env`:

- **`VITE_API_URL=http://<IP-o-dominio-del-backend>:3000/api`**

por ejemplo `http://192.168.1.10:3000/api` o la URL que corresponda.

---

## Login en el frontend

El login requiere tener configuradas las variables **`VITE_FIREBASE_*`** en `frontend/.env` (proyecto Firebase con Auth y, opcionalmente, Storage). Copia `frontend/.env.example` a `frontend/.env` y rellena los valores.
