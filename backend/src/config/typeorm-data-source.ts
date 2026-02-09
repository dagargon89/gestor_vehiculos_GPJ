import { DataSource } from 'typeorm';
import { Role } from '../database/entities/role.entity';
import { Permission } from '../database/entities/permission.entity';
import { User } from '../database/entities/user.entity';
import { Vehicle } from '../database/entities/vehicle.entity';
import { Provider } from '../database/entities/provider.entity';
import { SystemSetting } from '../database/entities/system-setting.entity';
import { Reservation } from '../database/entities/reservation.entity';
import { Maintenance } from '../database/entities/maintenance.entity';
import { FuelRecord } from '../database/entities/fuel-record.entity';
import { Cost } from '../database/entities/cost.entity';
import { Incident } from '../database/entities/incident.entity';
import { Sanction } from '../database/entities/sanction.entity';
import { Notification } from '../database/entities/notification.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { StorageFile } from '../database/entities/storage-file.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'fleet_user',
  password: process.env.DB_PASSWORD || 'fleet_secret',
  database: process.env.DB_NAME || 'fleet_management',
  entities: [
    Role,
    Permission,
    User,
    Vehicle,
    Provider,
    SystemSetting,
    Reservation,
    Maintenance,
    FuelRecord,
    Cost,
    Incident,
    Sanction,
    Notification,
    AuditLog,
    StorageFile,
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
