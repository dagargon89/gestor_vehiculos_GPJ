"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const role_entity_1 = require("../database/entities/role.entity");
const permission_entity_1 = require("../database/entities/permission.entity");
const user_entity_1 = require("../database/entities/user.entity");
const vehicle_entity_1 = require("../database/entities/vehicle.entity");
const provider_entity_1 = require("../database/entities/provider.entity");
const system_setting_entity_1 = require("../database/entities/system-setting.entity");
const reservation_entity_1 = require("../database/entities/reservation.entity");
const maintenance_entity_1 = require("../database/entities/maintenance.entity");
const fuel_record_entity_1 = require("../database/entities/fuel-record.entity");
const cost_entity_1 = require("../database/entities/cost.entity");
const incident_entity_1 = require("../database/entities/incident.entity");
const sanction_entity_1 = require("../database/entities/sanction.entity");
const notification_entity_1 = require("../database/entities/notification.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const storage_file_entity_1 = require("../database/entities/storage-file.entity");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'fleet_user',
    password: process.env.DB_PASSWORD || 'fleet_secret',
    database: process.env.DB_NAME || 'fleet_management',
    entities: [
        role_entity_1.Role,
        permission_entity_1.Permission,
        user_entity_1.User,
        vehicle_entity_1.Vehicle,
        provider_entity_1.Provider,
        system_setting_entity_1.SystemSetting,
        reservation_entity_1.Reservation,
        maintenance_entity_1.Maintenance,
        fuel_record_entity_1.FuelRecord,
        cost_entity_1.Cost,
        incident_entity_1.Incident,
        sanction_entity_1.Sanction,
        notification_entity_1.Notification,
        audit_log_entity_1.AuditLog,
        storage_file_entity_1.StorageFile,
    ],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
});
//# sourceMappingURL=typeorm-data-source.js.map