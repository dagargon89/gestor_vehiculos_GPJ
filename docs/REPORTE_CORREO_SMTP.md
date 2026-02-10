# Reporte: notificaciones por correo (SMTP) – para retomar después

**Estado actual:** se trabaja solo con **notificaciones internas de la aplicación**. El envío por email está configurado pero falla por conectividad; este documento sirve para retomarlo más adelante.

---

## Resumen

| Aspecto | Estado |
|--------|--------|
| Notificaciones in-app (crear, guardar, listar) | **OK** – funcionan con normalidad |
| Configuración SMTP en backend (variables en `backend/.env`) | **OK** – el contenedor carga `MAIL_*` vía `env_file` en docker-compose |
| Envío real de correo (Gmail vía SMTP) | **Falla** – `ECONNREFUSED` al conectar desde Node dentro del contenedor |

---

## Qué se hizo

1. **Plan “correo SMTP en Docker”**  
   - En `docker-compose.yml`, servicio `backend`: se añadió `env_file: - ./backend/.env` para que el contenedor reciba `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD`, etc.
   - En `MailService.send()`: se añadió log cuando no hay transporter: `Mail not sent: SMTP not configured`.

2. **Plan “resolver conectividad SMTP”**  
   - Diagnóstico desde el contenedor: `nc -zv smtp.gmail.com 587` y `465` → en las pruebas salieron **open** (desde el host también).
   - En `backend/.env`: `MAIL_PORT=465`, `MAIL_SECURE=true` (TLS implícito para Gmail).
   - Documentación: [docs/SMTP_CONECTIVIDAD.md](SMTP_CONECTIVIDAD.md) y plan en `.cursor/plans/resolver_conectividad_smtp_*.plan.md`.

3. **Comprobaciones de envío**  
   - Al disparar notificaciones (ej. aprobar reserva con usuario con `emailNotifications: true`), el backend **intenta** enviar el correo pero falla con:
     - `Failed to send email to dgarcia@planjuarez.org: connect ECONNREFUSED 142.251.2.27:465`
     - `Failed to send email to dgarcia@planjuarez.org: connect ECONNREFUSED 74.125.137.26:465`
   - No aparece en logs ninguna línea `Email sent to ...` (ningún envío exitoso).

---

## Comportamiento actual

- Las notificaciones se **crean y guardan** en base de datos y el usuario las ve en la app.
- Si el usuario tiene `emailNotifications: true` y email válido, el backend llama a `MailService.send()`; la conexión TCP al SMTP de Gmail es **rechazada** (`ECONNREFUSED`) desde el proceso Node, aunque `nc` desde el mismo contenedor a veces conecta. Posibles causas: inestabilidad de red, diferencias de resolución DNS o de ruta por proceso, o restricciones/límites del lado de Gmail.

---

## Para retomar después

1. **Comprobar de nuevo conectividad** (desde el proyecto):
   ```bash
   docker compose exec backend sh -c "nc -zv smtp.gmail.com 465"
   docker compose exec backend sh -c "nc -zv smtp.gmail.com 587"
   ```

2. **Revisar logs tras un intento de envío**:
   ```bash
   docker compose logs backend 2>&1 | grep -E 'Email sent to|Failed to send email'
   ```

3. **Opciones a valorar cuando se retome**:
   - **Reintentos en MailService**: 2–3 intentos con delay ante `ECONNREFUSED` o errores de red.
   - **Probar desde otro entorno**: por ejemplo, mismo código en un VPS o red donde no haya WSL2/Docker, para descartar bloqueos de red local.
   - **Relay por API**: usar un servicio (SendGrid, Mailgun, Resend, etc.) con API HTTP en lugar de SMTP directo; suele evitar problemas de puertos 587/465 en redes restrictivas.

4. **Referencias en el repo**:
   - Config mail: [backend/src/modules/mail/mail.service.ts](../backend/src/modules/mail/mail.service.ts)
   - Uso del mail al notificar: [backend/src/modules/notifications/notifications.service.ts](../backend/src/modules/notifications/notifications.service.ts) (`notifyUser` → `mailService.send`)
   - Variables de entorno: `backend/.env` y [backend/.env.example](../backend/.env.example) (MAIL_HOST, MAIL_PORT, MAIL_SECURE, MAIL_USER, MAIL_PASSWORD, MAIL_FROM)
   - Docker: [docker-compose.yml](../docker-compose.yml) (servicio `backend`, `env_file: - ./backend/.env`)
   - Diagnóstico y plan SMTP: [docs/SMTP_CONECTIVIDAD.md](SMTP_CONECTIVIDAD.md)

---

*Última actualización: 2026-02-10. Trabajo actual: notificaciones internas de la aplicación.*
