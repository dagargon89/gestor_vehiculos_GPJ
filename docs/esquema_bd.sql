-- =============================================================================
-- Esquema completo de la base de datos - Gestión de Flota Plan Juárez
-- Generado a partir de las entidades TypeORM del backend. No omitir nada.
-- Base de datos: PostgreSQL
-- =============================================================================

-- Extensión para generación de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tabla: permissions
-- Permisos del sistema (recurso + acción) para control de acceso.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL
);

-- -----------------------------------------------------------------------------
-- Tabla: roles
-- Roles de usuario (admin, manager_flotilla, conductor, etc.).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(255)
);

-- -----------------------------------------------------------------------------
-- Tabla: role_permissions (N:M entre roles y permissions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  "roleId" UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "permissionId" UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions("permissionId");

-- -----------------------------------------------------------------------------
-- Tabla: users
-- Usuarios (sincronizados desde Firebase; role_id opcional).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firebaseUid" VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  "displayName" VARCHAR(255),
  "photoUrl" TEXT,
  "employeeId" VARCHAR(255),
  department VARCHAR(255),
  "licenseNumber" VARCHAR(255),
  "licenseType" VARCHAR(255),
  "licenseExpiry" DATE,
  "licenseRestrictions" TEXT,
  phone VARCHAR(255),
  "emergencyContactName" VARCHAR(255),
  "emergencyContactPhone" VARCHAR(255),
  "emergencyContactRelationship" VARCHAR(255),
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "autoApprovalEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users("firebaseUid");

-- -----------------------------------------------------------------------------
-- Tabla: vehicles
-- Vehículos de la flota.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INTEGER,
  color VARCHAR(255),
  vin VARCHAR(255),
  "photoUrls" TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'available',
  "currentOdometer" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- -----------------------------------------------------------------------------
-- Tabla: reservations
-- Reservas de vehículos por usuario.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  "startDatetime" TIMESTAMPTZ NOT NULL,
  "endDatetime" TIMESTAMPTZ NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  "eventName" VARCHAR(255),
  description TEXT,
  destination VARCHAR(255),
  "checkinOdometer" INTEGER,
  "checkinFuelPhotoUrl" TEXT,
  "checkinConditionPhotoUrls" TEXT,
  "checkoutOdometer" INTEGER,
  "checkoutFuelPhotoUrl" TEXT,
  "checkoutConditionPhotoUrls" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_id ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_end ON reservations("startDatetime", "endDatetime");
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- -----------------------------------------------------------------------------
-- Tabla: providers
-- Proveedores (mantenimiento, combustible, etc.).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Tabla: system_settings
-- Configuración clave-valor del sistema.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- Tabla: storage_files
-- Registro de archivos subidos (Storage / Firebase).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storage_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "entityType" VARCHAR(255) NOT NULL,
  "entityId" UUID NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "filePath" TEXT NOT NULL,
  "firebaseUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(255),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_files_entity ON storage_files("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_storage_files_uploaded_by ON storage_files(uploaded_by);

-- -----------------------------------------------------------------------------
-- Tabla: audit_logs
-- Registro de auditoría de acciones.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  "resourceId" VARCHAR(255),
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, "resourceId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs("createdAt");

-- -----------------------------------------------------------------------------
-- Tabla: notifications
-- Notificaciones in-app por usuario.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  "actionUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- -----------------------------------------------------------------------------
-- Tabla: sanctions
-- Sanciones aplicadas a usuarios.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sanctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  "effectiveDate" DATE NOT NULL,
  "endDate" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sanctions_user_id ON sanctions(user_id);

-- -----------------------------------------------------------------------------
-- Tabla: incidents
-- Incidentes asociados a vehículos y opcionalmente a usuario.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_vehicle_id ON incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- -----------------------------------------------------------------------------
-- Tabla: maintenance
-- Mantenimientos programados o realizados por vehículo.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  "scheduledDate" DATE NOT NULL,
  type VARCHAR(255),
  description TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'scheduled',
  "odometerAtService" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance("scheduledDate");

-- -----------------------------------------------------------------------------
-- Tabla: fuel_records
-- Registros de carga de combustible por vehículo.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  liters DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  odometer INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(date);

-- -----------------------------------------------------------------------------
-- Tabla: costs
-- Costos varios por vehículo (categoría, monto, fecha).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_costs_vehicle_id ON costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_costs_date ON costs(date);
CREATE INDEX IF NOT EXISTS idx_costs_category ON costs(category);

-- -----------------------------------------------------------------------------
-- Tabla: typeorm_metadata (usada por TypeORM para metadatos de migraciones)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typeorm_metadata (
  type VARCHAR(255) NOT NULL,
  database VARCHAR(255),
  schema VARCHAR(255),
  "table" VARCHAR(255),
  name VARCHAR(255),
  value TEXT
);

-- =============================================================================
-- Fin del esquema
-- =============================================================================
