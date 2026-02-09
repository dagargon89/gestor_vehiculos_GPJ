# Esquema de base de datos – Gestión de Flota

Documento de referencia del modelo de datos (PostgreSQL). Generado a partir de las entidades TypeORM del backend. La BD se llama `fleet_management`.

---

## Índice

1. [users](#1-users)
2. [roles](#2-roles)
3. [permissions](#3-permissions)
4. [role_permissions](#4-role_permissions)
5. [vehicles](#5-vehicles)
6. [reservations](#6-reservations)
7. [maintenance](#7-maintenance)
8. [fuel_records](#8-fuel_records)
9. [incidents](#9-incidents)
10. [sanctions](#10-sanctions)
11. [notifications](#11-notifications)
12. [costs](#12-costs)
13. [providers](#13-providers)
14. [system_settings](#14-system_settings)
15. [audit_logs](#15-audit_logs)
16. [storage_files](#16-storage_files)

---

## 1. users

Usuarios del sistema (vinculados a Firebase Auth por `firebase_uid`).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Identificador único |
| firebase_uid | VARCHAR(128) | UNIQUE, NOT NULL | UID de Firebase Auth |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico |
| display_name | VARCHAR(255) | nullable | Nombre para mostrar |
| photo_url | TEXT | nullable | URL de la foto de perfil |
| employee_id | VARCHAR(50) | nullable, unique | Número de empleado |
| department | VARCHAR(100) | nullable | Departamento |
| license_number | VARCHAR(100) | nullable | Número de licencia |
| license_type | VARCHAR(10) | nullable | Tipo de licencia |
| license_expiry | DATE | nullable | Vencimiento de licencia |
| license_restrictions | TEXT[] (simple-array) | nullable | Restricciones de licencia |
| phone | VARCHAR(20) | nullable | Teléfono |
| emergency_contact_name | VARCHAR(255) | nullable | Contacto de emergencia |
| emergency_contact_phone | VARCHAR(20) | nullable | Teléfono de emergencia |
| emergency_contact_relationship | VARCHAR(100) | nullable | Parentesco |
| status | VARCHAR(20) | default 'active' | active, suspended, inactive |
| role_id | UUID | FK → roles(id), nullable | Rol asignado |
| email_notifications | BOOLEAN | default true | Recibir notificaciones por email |
| auto_approval_enabled | BOOLEAN | default false | Autoaprobación de reservas |
| last_login_at | TIMESTAMPTZ | nullable | Último inicio de sesión |
| created_at | TIMESTAMPTZ | default now() | Creación |
| updated_at | TIMESTAMPTZ | default now() | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 2. roles

Roles de usuario (admin, conductor, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Nombre del rol |
| description | VARCHAR(255) | nullable | Descripción |

---

## 3. permissions

Permisos (recurso + acción) para control de acceso.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| resource | VARCHAR(255) | NOT NULL | Recurso (ej. vehicles, reservations) |
| action | VARCHAR(255) | NOT NULL | Acción (ej. create, read, update, delete) |

---

## 4. role_permissions

Tabla de unión entre roles y permissions (N:M).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| role_id | UUID | FK → roles(id) |
| permission_id | UUID | FK → permissions(id) |

---

## 5. vehicles

Vehículos de la flota.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| plate | VARCHAR(255) | NOT NULL | Placa |
| brand | VARCHAR(255) | NOT NULL | Marca |
| model | VARCHAR(255) | NOT NULL | Modelo |
| year | INTEGER | nullable | Año |
| color | VARCHAR(255) | nullable | Color |
| vin | VARCHAR(255) | nullable | Número VIN |
| photo_urls | TEXT | nullable | URLs de fotos (comma-separated o JSON) |
| status | VARCHAR(255) | default 'available' | Estado (available, in_use, maintenance, etc.) |
| current_odometer | INTEGER | nullable | Odómetro actual (km) |
| created_at | TIMESTAMPTZ | | Creación |
| updated_at | TIMESTAMPTZ | | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 6. reservations

Reservas de vehículos por usuario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario que reserva |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL | Vehículo reservado |
| start_datetime | TIMESTAMPTZ | NOT NULL | Inicio de la reserva |
| end_datetime | TIMESTAMPTZ | NOT NULL | Fin de la reserva |
| status | VARCHAR(255) | default 'pending' | pending, active, completed, overdue, cancelled |
| checkin_odometer | INTEGER | nullable | Odómetro al retirar |
| checkout_odometer | INTEGER | nullable | Odómetro al devolver |
| created_at | TIMESTAMPTZ | | Creación |
| updated_at | TIMESTAMPTZ | | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 7. maintenance

Registros de mantenimiento por vehículo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL | Vehículo |
| scheduled_date | DATE | NOT NULL | Fecha programada |
| type | VARCHAR(255) | nullable | Tipo de mantenimiento |
| description | TEXT | nullable | Descripción |
| status | VARCHAR(255) | default 'scheduled' | scheduled, in_progress, completed, cancelled |
| odometer_at_service | INTEGER | nullable | Odómetro al momento del servicio |
| created_at | TIMESTAMPTZ | | Creación |
| updated_at | TIMESTAMPTZ | | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 8. fuel_records

Registros de combustible por vehículo.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL | Vehículo |
| date | DATE | NOT NULL | Fecha del registro |
| liters | DECIMAL(10,2) | NOT NULL | Litros cargados |
| cost | DECIMAL(10,2) | nullable | Costo |
| odometer | INTEGER | nullable | Odómetro en la carga |
| created_at | TIMESTAMPTZ | | Creación |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 9. incidents

Incidentes (accidentes, averías) asociados a vehículo y opcionalmente a usuario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL | Vehículo |
| user_id | UUID | FK → users(id), nullable | Usuario involucrado |
| date | DATE | NOT NULL | Fecha del incidente |
| description | TEXT | NOT NULL | Descripción |
| status | VARCHAR(255) | default 'open' | open, in_review, closed |
| created_at | TIMESTAMPTZ | | Creación |
| updated_at | TIMESTAMPTZ | | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 10. sanctions

Sanciones aplicadas a usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario sancionado |
| reason | TEXT | NOT NULL | Motivo |
| effective_date | DATE | NOT NULL | Fecha de inicio |
| end_date | DATE | nullable | Fecha de fin |
| created_at | TIMESTAMPTZ | | Creación |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 11. notifications

Notificaciones in-app por usuario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK → users(id), NOT NULL | Usuario destinatario |
| type | VARCHAR(255) | NOT NULL | Tipo de notificación |
| title | VARCHAR(255) | NOT NULL | Título |
| message | TEXT | NOT NULL | Mensaje |
| read | BOOLEAN | default false | Leída o no |
| action_url | TEXT | nullable | URL de acción (ej. link a reserva) |
| created_at | TIMESTAMPTZ | | Creación |

---

## 12. costs

Costos asociados a vehículos (combustible, mantenimiento, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| vehicle_id | UUID | FK → vehicles(id), NOT NULL | Vehículo |
| category | VARCHAR(255) | NOT NULL | Categoría del costo |
| amount | DECIMAL(12,2) | NOT NULL | Monto |
| date | DATE | NOT NULL | Fecha |
| description | TEXT | nullable | Descripción |
| created_at | TIMESTAMPTZ | | Creación |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 13. providers

Proveedores (talleres, estaciones de servicio, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre |
| contact_name | VARCHAR(255) | nullable | Contacto |
| phone | VARCHAR(20) | nullable | Teléfono |
| email | VARCHAR(255) | nullable | Correo |
| address | TEXT | nullable | Dirección |
| created_at | TIMESTAMPTZ | | Creación |
| updated_at | TIMESTAMPTZ | | Actualización |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## 14. system_settings

Configuración global del sistema (clave-valor).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| key | VARCHAR(255) | UNIQUE, NOT NULL | Clave |
| value | TEXT | NOT NULL | Valor |

---

## 15. audit_logs

Registro de auditoría de acciones.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| user_id | UUID | nullable | Usuario que realizó la acción |
| action | VARCHAR(255) | NOT NULL | Acción (ej. create, update, delete) |
| resource | VARCHAR(255) | nullable | Recurso afectado |
| resource_id | VARCHAR(255) | nullable | ID del recurso |
| metadata | JSONB | nullable | Datos adicionales |
| created_at | TIMESTAMPTZ | | Fecha y hora |

---

## 16. storage_files

Registro de archivos subidos a Firebase Storage (fotos, PDFs, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK | Identificador único |
| entity_type | VARCHAR(50) | NOT NULL | Tipo de entidad (vehicle, reservation, maintenance, incident, fuel) |
| entity_id | UUID | NOT NULL | ID de la entidad relacionada |
| file_name | VARCHAR(255) | NOT NULL | Nombre original del archivo |
| file_path | TEXT | NOT NULL | Ruta en Firebase Storage |
| firebase_url | TEXT | NOT NULL | URL pública del archivo |
| file_size | INTEGER | nullable | Tamaño en bytes |
| mime_type | VARCHAR(100) | nullable | Tipo MIME |
| uploaded_by | UUID | FK → users(id), nullable | Usuario que subió |
| uploaded_at | TIMESTAMPTZ | | Fecha de subida |
| deleted_at | TIMESTAMPTZ | nullable | Soft delete |

---

## Relaciones principales

- **users** → role_id → **roles**
- **roles** ↔ **permissions** (N:M vía role_permissions)
- **reservations** → user_id → **users**, vehicle_id → **vehicles**
- **vehicles** → tiene muchas **reservations**, **maintenance**, **fuel_records**, **incidents**, **costs**
- **maintenance**, **fuel_records**, **incidents**, **costs** → vehicle_id → **vehicles**
- **incidents**, **sanctions**, **notifications** → user_id → **users**
- **storage_files** → uploaded_by → **users**; entity_type + entity_id referencian la entidad (vehicles, reservations, etc.)

---

*Documento generado a partir de las entidades en `backend/src/database/entities/`. Para cambios en el esquema, actualizar las entidades TypeORM y, en producción, usar migraciones.*
