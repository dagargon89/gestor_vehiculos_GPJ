import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FuelRecordsModule } from './modules/fuel-records/fuel-records.module';
import { CostsModule } from './modules/costs/costs.module';
import { SanctionsModule } from './modules/sanctions/sanctions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    CommonModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    SystemSettingsModule,
    ProvidersModule,
    StorageModule,
    VehiclesModule,
    ReservationsModule,
    MaintenanceModule,
    FuelRecordsModule,
    CostsModule,
    SanctionsModule,
    NotificationsModule,
    IncidentsModule,
    AuditLogsModule,
    ReportsModule,
  ],
})
export class AppModule {}
