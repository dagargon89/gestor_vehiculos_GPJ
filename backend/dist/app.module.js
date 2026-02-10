"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_1 = require("./config/database.config");
const app_controller_1 = require("./app.controller");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const storage_module_1 = require("./modules/storage/storage.module");
const vehicles_module_1 = require("./modules/vehicles/vehicles.module");
const reservations_module_1 = require("./modules/reservations/reservations.module");
const reports_module_1 = require("./modules/reports/reports.module");
const permissions_module_1 = require("./modules/permissions/permissions.module");
const roles_module_1 = require("./modules/roles/roles.module");
const system_settings_module_1 = require("./modules/system-settings/system-settings.module");
const providers_module_1 = require("./modules/providers/providers.module");
const maintenance_module_1 = require("./modules/maintenance/maintenance.module");
const fuel_records_module_1 = require("./modules/fuel-records/fuel-records.module");
const costs_module_1 = require("./modules/costs/costs.module");
const sanctions_module_1 = require("./modules/sanctions/sanctions.module");
const mail_module_1 = require("./modules/mail/mail.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const incidents_module_1 = require("./modules/incidents/incidents.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot((0, database_config_1.getDatabaseConfig)()),
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            permissions_module_1.PermissionsModule,
            roles_module_1.RolesModule,
            users_module_1.UsersModule,
            system_settings_module_1.SystemSettingsModule,
            providers_module_1.ProvidersModule,
            storage_module_1.StorageModule,
            vehicles_module_1.VehiclesModule,
            reservations_module_1.ReservationsModule,
            maintenance_module_1.MaintenanceModule,
            fuel_records_module_1.FuelRecordsModule,
            costs_module_1.CostsModule,
            sanctions_module_1.SanctionsModule,
            mail_module_1.MailModule,
            notifications_module_1.NotificationsModule,
            incidents_module_1.IncidentsModule,
            audit_logs_module_1.AuditLogsModule,
            reports_module_1.ReportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map