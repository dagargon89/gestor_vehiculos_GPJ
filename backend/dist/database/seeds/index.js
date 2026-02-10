"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRolesAndPermissions = seedRolesAndPermissions;
exports.seedVehicles = seedVehicles;
exports.seedProviders = seedProviders;
exports.seedSystemSettings = seedSystemSettings;
exports.seedMaintenance = seedMaintenance;
exports.seedFuelRecords = seedFuelRecords;
exports.seedCosts = seedCosts;
exports.seedIncidents = seedIncidents;
exports.seedReservations = seedReservations;
exports.seedSanctions = seedSanctions;
exports.seedNotifications = seedNotifications;
exports.seedAuditLogs = seedAuditLogs;
exports.seedStorageFiles = seedStorageFiles;
exports.runAllSeeds = runAllSeeds;
const role_entity_1 = require("../entities/role.entity");
const permission_entity_1 = require("../entities/permission.entity");
const vehicle_entity_1 = require("../entities/vehicle.entity");
const provider_entity_1 = require("../entities/provider.entity");
const system_setting_entity_1 = require("../entities/system-setting.entity");
const reservation_entity_1 = require("../entities/reservation.entity");
const maintenance_entity_1 = require("../entities/maintenance.entity");
const fuel_record_entity_1 = require("../entities/fuel-record.entity");
const cost_entity_1 = require("../entities/cost.entity");
const incident_entity_1 = require("../entities/incident.entity");
const sanction_entity_1 = require("../entities/sanction.entity");
const notification_entity_1 = require("../entities/notification.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const storage_file_entity_1 = require("../entities/storage-file.entity");
const user_entity_1 = require("../entities/user.entity");
function addDays(d, days) {
    const out = new Date(d);
    out.setDate(out.getDate() + days);
    return out;
}
async function seedRolesAndPermissions(dataSource) {
    const permRepo = dataSource.getRepository(permission_entity_1.Permission);
    const roleRepo = dataSource.getRepository(role_entity_1.Role);
    const existingPerms = await permRepo.count();
    if (existingPerms > 0) {
        console.log('  permissions ya tienen datos, omitiendo.');
        return;
    }
    const permissions = await permRepo.save([
        { resource: 'vehicles', action: 'create' },
        { resource: 'vehicles', action: 'read' },
        { resource: 'vehicles', action: 'update' },
        { resource: 'vehicles', action: 'delete' },
        { resource: 'reservations', action: 'create' },
        { resource: 'reservations', action: 'read' },
        { resource: 'reservations', action: 'update' },
        { resource: 'reservations', action: 'delete' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'update' },
        { resource: 'users', action: 'delete' },
        { resource: 'providers', action: 'create' },
        { resource: 'providers', action: 'read' },
        { resource: 'providers', action: 'update' },
        { resource: 'providers', action: 'delete' },
        { resource: 'maintenance', action: 'create' },
        { resource: 'maintenance', action: 'read' },
        { resource: 'maintenance', action: 'update' },
        { resource: 'maintenance', action: 'delete' },
        { resource: 'fuel_records', action: 'create' },
        { resource: 'fuel_records', action: 'read' },
        { resource: 'fuel_records', action: 'update' },
        { resource: 'fuel_records', action: 'delete' },
        { resource: 'costs', action: 'create' },
        { resource: 'costs', action: 'read' },
        { resource: 'costs', action: 'update' },
        { resource: 'costs', action: 'delete' },
        { resource: 'sanctions', action: 'create' },
        { resource: 'sanctions', action: 'read' },
        { resource: 'sanctions', action: 'update' },
        { resource: 'sanctions', action: 'delete' },
        { resource: 'notifications', action: 'read' },
        { resource: 'notifications', action: 'update' },
        { resource: 'incidents', action: 'create' },
        { resource: 'incidents', action: 'read' },
        { resource: 'incidents', action: 'update' },
        { resource: 'incidents', action: 'delete' },
        { resource: 'system_settings', action: 'read' },
        { resource: 'system_settings', action: 'update' },
        { resource: 'audit_logs', action: 'read' },
        { resource: 'storage_files', action: 'read' },
        { resource: 'roles', action: 'read' },
        { resource: 'roles', action: 'update' },
        { resource: 'permissions', action: 'read' },
    ]);
    const existingRoles = await roleRepo.count();
    if (existingRoles > 0) {
        console.log('  roles ya tienen datos, omitiendo.');
        return;
    }
    const adminRole = roleRepo.create({
        name: 'admin',
        description: 'Administrador del sistema con acceso total',
        permissions,
    });
    await roleRepo.save(adminRole);
    const conductorRole = roleRepo.create({
        name: 'conductor',
        description: 'Conductor de vehículos',
        permissions: permissions.filter((p) => ['vehicles', 'reservations', 'fuel_records', 'incidents'].includes(p.resource) &&
            ['read', 'create', 'update'].includes(p.action)),
    });
    await roleRepo.save(conductorRole);
    console.log('  roles y permissions sembrados.');
}
async function seedVehicles(dataSource) {
    const repo = dataSource.getRepository(vehicle_entity_1.Vehicle);
    if ((await repo.count()) > 0) {
        console.log('  vehicles ya tienen datos, omitiendo.');
        return;
    }
    await repo.save([
        { plate: 'ABC-1234', brand: 'Toyota', model: 'Hilux', year: 2022, color: 'Blanco', status: 'available', currentOdometer: 15000 },
        { plate: 'DEF-5678', brand: 'Ford', model: 'Ranger', year: 2021, color: 'Gris', status: 'available', currentOdometer: 22000 },
        { plate: 'GHI-9012', brand: 'Chevrolet', model: 'S10', year: 2023, color: 'Negro', status: 'available', currentOdometer: 5000 },
        { plate: 'JKL-3456', brand: 'Nissan', model: 'Frontier', year: 2020, color: 'Plata', status: 'maintenance', currentOdometer: 45000 },
    ]);
    console.log('  vehicles sembrados.');
}
async function seedProviders(dataSource) {
    const repo = dataSource.getRepository(provider_entity_1.Provider);
    if ((await repo.count()) > 0) {
        console.log('  providers ya tienen datos, omitiendo.');
        return;
    }
    await repo.save([
        { name: 'Taller Central', contactName: 'Juan Pérez', phone: '+56912345678', email: 'taller@ejemplo.com', address: 'Av. Principal 100' },
        { name: 'Estación de Servicio Norte', contactName: 'María López', phone: '+56987654321', email: 'norte@servicio.com', address: 'Carretera Norte km 5' },
        { name: 'Proveedor de Neumáticos', contactName: 'Carlos Ruiz', phone: '+56911223344', email: 'neumaticos@proveedor.com', address: 'Zona Industrial 22' },
    ]);
    console.log('  providers sembrados.');
}
async function seedSystemSettings(dataSource) {
    const repo = dataSource.getRepository(system_setting_entity_1.SystemSetting);
    if ((await repo.count()) > 0) {
        console.log('  system_settings ya tienen datos, omitiendo.');
        return;
    }
    await repo.save([
        { key: 'company_name', value: 'Gestión de Flota Plan Juárez' },
        { key: 'max_reservation_days', value: '30' },
        { key: 'maintenance_reminder_days', value: '7' },
        { key: 'default_currency', value: 'CLP' },
    ]);
    console.log('  system_settings sembrados.');
}
async function seedMaintenance(dataSource) {
    const repo = dataSource.getRepository(maintenance_entity_1.Maintenance);
    if ((await repo.count()) > 0) {
        console.log('  maintenance ya tienen datos, omitiendo.');
        return;
    }
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 2 });
    if (vehicles.length === 0)
        return;
    await repo.save([
        { vehicleId: vehicles[0].id, scheduledDate: addDays(new Date(), 14), type: 'revisión', description: 'Revisión 20.000 km', status: 'scheduled', odometerAtService: 15000 },
        { vehicleId: vehicles[1].id, scheduledDate: addDays(new Date(), 7), type: 'cambio de aceite', description: 'Cambio de aceite y filtros', status: 'scheduled', odometerAtService: 22000 },
    ]);
    console.log('  maintenance sembrados.');
}
async function seedFuelRecords(dataSource) {
    const repo = dataSource.getRepository(fuel_record_entity_1.FuelRecord);
    if ((await repo.count()) > 0) {
        console.log('  fuel_records ya tienen datos, omitiendo.');
        return;
    }
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 2 });
    if (vehicles.length === 0)
        return;
    await repo.save([
        { vehicleId: vehicles[0].id, date: addDays(new Date(), -7), liters: 55.5, cost: 45000, odometer: 14800 },
        { vehicleId: vehicles[1].id, date: addDays(new Date(), -14), liters: 60, cost: 48000, odometer: 21800 },
    ]);
    console.log('  fuel_records sembrados.');
}
async function seedCosts(dataSource) {
    const repo = dataSource.getRepository(cost_entity_1.Cost);
    if ((await repo.count()) > 0) {
        console.log('  costs ya tienen datos, omitiendo.');
        return;
    }
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 2 });
    if (vehicles.length === 0)
        return;
    await repo.save([
        { vehicleId: vehicles[0].id, category: 'combustible', amount: 45000, date: addDays(new Date(), -7), description: 'Carga combustible' },
        { vehicleId: vehicles[1].id, category: 'mantenimiento', amount: 120000, date: addDays(new Date(), -30), description: 'Revisión técnica' },
    ]);
    console.log('  costs sembrados.');
}
async function seedIncidents(dataSource) {
    const repo = dataSource.getRepository(incident_entity_1.Incident);
    if ((await repo.count()) > 0) {
        console.log('  incidents ya tienen datos, omitiendo.');
        return;
    }
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 1 });
    if (vehicles.length === 0)
        return;
    await repo.save([
        { vehicleId: vehicles[0].id, date: addDays(new Date(), -60), description: 'Rayón en puerta lateral izquierda. Reportado en estacionamiento.', status: 'closed' },
    ]);
    console.log('  incidents sembrados.');
}
async function seedReservations(dataSource) {
    const repo = dataSource.getRepository(reservation_entity_1.Reservation);
    if ((await repo.count()) > 0) {
        console.log('  reservations ya tienen datos, omitiendo.');
        return;
    }
    const user = await dataSource.getRepository(user_entity_1.User).findOne({ where: {} });
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 1 });
    if (!user || vehicles.length === 0) {
        console.log('  reservations: se necesita al menos un usuario y un vehículo (omitido).');
        return;
    }
    const start = addDays(new Date(), 1);
    const end = addDays(new Date(), 2);
    await repo.save([
        { userId: user.id, vehicleId: vehicles[0].id, startDatetime: start, endDatetime: end, status: 'pending' },
    ]);
    console.log('  reservations sembrados.');
}
async function seedSanctions(dataSource) {
    const repo = dataSource.getRepository(sanction_entity_1.Sanction);
    if ((await repo.count()) > 0) {
        console.log('  sanctions ya tienen datos, omitiendo.');
        return;
    }
    const user = await dataSource.getRepository(user_entity_1.User).findOne({ where: {} });
    if (!user) {
        console.log('  sanctions: se necesita al menos un usuario (omitido).');
        return;
    }
    await repo.save([
        { userId: user.id, reason: 'Devolución de vehículo con retraso (ejemplo seed).', effectiveDate: addDays(new Date(), -30), endDate: addDays(new Date(), 30) },
    ]);
    console.log('  sanctions sembrados.');
}
async function seedNotifications(dataSource) {
    const repo = dataSource.getRepository(notification_entity_1.Notification);
    if ((await repo.count()) > 0) {
        console.log('  notifications ya tienen datos, omitiendo.');
        return;
    }
    const user = await dataSource.getRepository(user_entity_1.User).findOne({ where: {} });
    if (!user) {
        console.log('  notifications: se necesita al menos un usuario (omitido).');
        return;
    }
    await repo.save([
        { userId: user.id, type: 'info', title: 'Bienvenido', message: 'Bienvenido al sistema de gestión de flota.', read: false },
        { userId: user.id, type: 'reminder', title: 'Reserva próxima', message: 'Tienes una reserva programada para mañana.', read: false, actionUrl: '/reservations' },
    ]);
    console.log('  notifications sembrados.');
}
async function seedAuditLogs(dataSource) {
    const repo = dataSource.getRepository(audit_log_entity_1.AuditLog);
    if ((await repo.count()) > 0) {
        console.log('  audit_logs ya tienen datos, omitiendo.');
        return;
    }
    const user = await dataSource.getRepository(user_entity_1.User).findOne({ where: {} });
    await repo.save([
        { userId: user?.id, action: 'seed', resource: 'system', resourceId: 'seeder', metadata: { message: 'Ejecución inicial de seeders' } },
    ]);
    console.log('  audit_logs sembrados.');
}
async function seedStorageFiles(dataSource) {
    const repo = dataSource.getRepository(storage_file_entity_1.StorageFile);
    if ((await repo.count()) > 0) {
        console.log('  storage_files ya tienen datos, omitiendo.');
        return;
    }
    const vehicles = await dataSource.getRepository(vehicle_entity_1.Vehicle).find({ take: 1 });
    if (vehicles.length === 0)
        return;
    const user = await dataSource.getRepository(user_entity_1.User).findOne({ where: {} });
    await repo.save([
        {
            entityType: 'vehicle',
            entityId: vehicles[0].id,
            fileName: 'ejemplo-vehiculo.jpg',
            filePath: 'vehicles/ejemplo-vehiculo.jpg',
            firebaseUrl: 'https://example.com/placeholder.jpg',
            fileSize: 102400,
            mimeType: 'image/jpeg',
            uploadedBy: user?.id,
            uploadedAt: new Date(),
        },
    ]);
    console.log('  storage_files sembrados.');
}
async function runAllSeeds(dataSource) {
    console.log('Ejecutando seeders (tabla users excluida)...');
    await seedRolesAndPermissions(dataSource);
    await seedVehicles(dataSource);
    await seedProviders(dataSource);
    await seedSystemSettings(dataSource);
    await seedMaintenance(dataSource);
    await seedFuelRecords(dataSource);
    await seedCosts(dataSource);
    await seedIncidents(dataSource);
    await seedReservations(dataSource);
    await seedSanctions(dataSource);
    await seedNotifications(dataSource);
    await seedAuditLogs(dataSource);
    await seedStorageFiles(dataSource);
    console.log('Seeders finalizados.');
}
//# sourceMappingURL=index.js.map