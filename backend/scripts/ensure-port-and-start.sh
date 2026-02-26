#!/usr/bin/env bash
# Libera el puerto 3000 si está ocupado y arranca el backend en modo desarrollo.
# Uso: ./scripts/ensure-port-and-start.sh (o npm run start:dev:safe)

set -e
PORT=3000

echo "Comprobando puerto $PORT..."

# Intentar liberar procesos que usan el puerto 3000
if command -v lsof &>/dev/null; then
  PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "Liberando puerto $PORT (PIDs: $PIDS)..."
    echo "$PIDS" | xargs -r kill -9 2>/dev/null || true
    sleep 2
  fi
fi

# También matar procesos nest start por si quedaron colgados
pkill -f "nest start" 2>/dev/null || true
sleep 2

# Comprobar si el puerto sigue ocupado
if command -v ss &>/dev/null; then
  if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo ""
    echo "ERROR: El puerto $PORT sigue en uso."
    echo "  - Cierra todas las terminales donde tengas el backend (Ctrl+C)."
    echo "  - En Windows (PowerShell/CMD): wsl --shutdown y vuelve a abrir Cursor."
    echo "  - O ejecuta: kill \$(lsof -t -i:$PORT)"
    exit 1
  fi
fi

echo "Arrancando backend (nest start --watch)..."
exec npx nest start --watch
