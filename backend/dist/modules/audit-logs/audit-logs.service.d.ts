import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
export declare class AuditLogsService {
    private repo;
    constructor(repo: Repository<AuditLog>);
    findAll(filters?: {
        userId?: string;
        resource?: string;
        resourceId?: string;
        action?: string;
        from?: string;
        to?: string;
    }): Promise<AuditLog[]>;
    findOne(id: string): Promise<AuditLog>;
}
