# Conectividad SMTP (correo desde el backend en Docker)

## Diagnóstico realizado

- **DNS**: `smtp.gmail.com` resuelve correctamente desde el contenedor `backend`.
- **Puertos**: Desde el contenedor, conexión TCP a `smtp.gmail.com:587` y `smtp.gmail.com:465` **abiertas** (no hay bloqueo de red en el entorno actual).

## Configuración aplicada

- En `backend/.env`: `MAIL_PORT=465`, `MAIL_SECURE=true` (TLS implícito), según el plan de resolución de conectividad SMTP.
- Gmail requiere **contraseña de aplicación** (2FA activada) en `MAIL_PASSWORD`, no la contraseña normal de la cuenta.

## Si vuelve a aparecer ECONNREFUSED

1. Repetir diagnóstico desde el contenedor:  
   `docker compose exec backend sh -c "nc -zv smtp.gmail.com 587"` y `nc -zv smtp.gmail.com 465`.
2. Si desde el contenedor falla pero desde el host funciona: revisar firewall del host (ufw, iptables) y en WSL2 probar desde Windows.
3. Ver plan completo en `.cursor/plans/resolver_conectividad_smtp_*.plan.md`.
