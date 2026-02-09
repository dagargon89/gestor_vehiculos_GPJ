Para probar solo infra (Postgres + Redis) sin construir el backend en Docker:
docker compose up -d postgres rediscd backend && npm run start:devcd frontend && npm run dev
Para levantar todo con Docker (incluido el backend):
docker compose up -d
El login en el frontend requiere tener configuradas las variables VITE_FIREBASE_* en frontend/.env (proyecto Firebase con Auth y, opcionalmente, Storage).