# Plan Juárez - Gestión de Flota

Sistema de gestión de flota según **Propuesta C (Arquitectura híbrida)**: NestJS + PostgreSQL + Firebase Auth/Storage + React. El diseño visual sigue el sistema de diseño definido en [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) y el [ejemplo de paleta y estilos](Ejemplo%20de%20paleta%20de%20colores%20y%20estilos/ejemplo.html).

## Stack

- **Backend:** NestJS, TypeORM, PostgreSQL, Redis, Firebase Admin (Auth + Storage)
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Query, Zustand, Firebase SDK
- **Orquestación:** Docker Compose (PostgreSQL, Redis, Backend)

## Requisitos

- Node.js 20+
- Docker y Docker Compose (para BD y backend en VPS/desarrollo)
- Cuenta Firebase (Auth + Storage) para login y archivos

## Desarrollo rápido con Docker

Todo el backend y dependencias se orquestan con Docker:

```bash
# En la raíz del proyecto
cp backend/.env.example backend/.env
# Editar backend/.env con DB_PASSWORD, y opcionalmente FIREBASE_* si quieres auth

docker compose up -d
```

- **PostgreSQL:** `localhost:5432` (usuario `fleet_user`, BD `fleet_management`)
- **Redis:** `localhost:6379`
- **Backend API:** `http://localhost:3000` (prefijo `/api`, p. ej. `GET /api/health`)

## Desarrollo local (sin Docker del backend)

1. **Base de datos y Redis** (por ejemplo con Docker solo para infra):

   ```bash
   docker compose up -d postgres redis
   ```

2. **Backend:**

   ```bash
   cd backend
   cp .env.example .env
   npm install && npm run start:dev
   ```

3. **Frontend:**

   ```bash
   cd frontend
   cp .env.example .env
   # Rellenar VITE_FIREBASE_* y VITE_API_URL=http://localhost:3000/api
   npm install && npm run dev
   ```

   App en `http://localhost:5173`. Login requiere Firebase configurado (Google o email/contraseña).

## Variables de entorno

- **Backend:** Ver `backend/.env.example` (DB_*, REDIS_*, FIREBASE_*, FRONTEND_URL).
- **Frontend:** Ver `frontend/.env.example` (VITE_FIREBASE_*, VITE_API_URL).

## Estructura

- `backend/` – API NestJS (auth Firebase, usuarios, vehículos, reservas, storage, reportes).
- `frontend/` – SPA React (login, dashboard, vehículos, reservas, reportes) con diseño Plan Juárez.
- `docker-compose.yml` – Orquestador: PostgreSQL, Redis y servicio backend.
- `DESIGN_SYSTEM.md` – Tokens de diseño (colores, tipografías, radios) para toda la UI.

## Documentación de arquitectura

- [PROPUESTA_C_ARQUITECTURA_HIBRIDA.md](PROPUESTA_C_ARQUITECTURA_HIBRIDA.md) – Descripción completa de la arquitectura y APIs.
