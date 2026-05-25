# CLAUDE.md — instrucciones de despliegue para este repo

Lee este archivo antes de aplicar cualquier cambio al código.

## Cómo corre la aplicación

- **Backend** (NestJS): corre dentro de Docker, contenedor `fleet-backend`, imagen `gestor_vehiculos_gpj-backend`. El contenedor **NO** tiene volúmenes montados desde el host: la carpeta `backend/dist/` del host es irrelevante para lo que se ejecuta. Lo que corre es el `dist/` que quedó compilado dentro de la imagen.
- **Postgres** (`fleet-postgres`) y **Redis** (`fleet-redis`): también en Docker, definidos en el mismo compose.
- **Frontend** (Vite): corre **en el host** con `npm run dev` / HMR. No está dockerizado.
- Compose file: `/root/flotilla/gestor_vehiculos_GPJ/docker_compose.yml` (nombre con guion bajo, **no estándar**). Siempre pasar `-f docker_compose.yml`.

## Aplicar cambios en el backend (NestJS)

Editar `.ts` en `backend/src/` **no surte efecto** hasta reconstruir la imagen y recrear el contenedor. El Dockerfile del backend corre `npm run build` dentro del builder stage, así que el build vive en la imagen, no en el host.

Comando único:

```bash
cd /root/flotilla/gestor_vehiculos_GPJ
docker compose -f docker_compose.yml up -d --build backend
```

Eso:
1. Reconstruye la imagen ejecutando `npm run build` dentro del builder stage.
2. Recrea el contenedor con la imagen nueva.
3. Mantiene `postgres` y `redis` corriendo sin tocarlos.

Verificar después:

```bash
docker ps --filter "name=fleet-backend" --format "{{.Status}}"   # debe decir "Up X (healthy)"
docker logs fleet-backend --tail 30                              # buscar "Nest application successfully started"
```

Para inspeccionar el JS que efectivamente se está ejecutando dentro del contenedor:

```bash
docker exec fleet-backend cat /app/dist/<ruta-relativa-del-archivo>.js
```

**No** edites los archivos en `backend/dist/` del host. Están en `.gitignore`-noland y solo sirven para uso local de TS-watch; al rebuild de Docker se ignoran. Si ves cambios en `backend/dist/*` en `git status`, son ruido — pueden descartarse.

## Aplicar cambios en el frontend (Vite)

Edita los archivos en `frontend/src/`. Vite + HMR los recarga automáticamente; no hay que reiniciar nada. Si por algo se cae el dev server:

```bash
cd /root/flotilla/gestor_vehiculos_GPJ/frontend
npm run dev
```

## Cambios que afectan ambos lados

Si el cambio toca backend y frontend (p. ej. una nueva ruta de API y su consumo en UI), aplica el flujo de cada uno en paralelo: rebuild del backend + dejar que Vite HMR recargue el frontend.

## Migraciones de base de datos

```bash
cd /root/flotilla/gestor_vehiculos_GPJ/backend
npm run migration:generate -- src/database/migrations/<NombreDescriptivo>
npm run migration:run
```

`migration:run` ejecuta contra la DB que apunte el `.env` del backend del host (Postgres expuesto en `localhost:5433`). Si el contenedor del backend ya corre las migraciones al arrancar, basta con el rebuild + recreate.

## Reglas de cordura

- Si modificaste un `.ts` del backend y no rebuildeaste, **el cambio no está aplicado**, da igual lo que diga el `.ts`.
- Antes de declarar “arreglado”, verifica con `docker logs` o `docker exec ... grep` que el nuevo código vive en el contenedor.
- No uses `--no-verify`, `--force`, `kill -9` sobre contenedores, ni borres volúmenes (`postgres_data`, `redis_data`) sin pedir confirmación explícita.
