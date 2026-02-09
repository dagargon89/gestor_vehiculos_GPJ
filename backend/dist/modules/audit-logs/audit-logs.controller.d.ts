import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(userId?: string, resource?: string, resourceId?: string, action?: string, from?: string, to?: string): Promise<import("../../database/entities/audit-log.entity").AuditLog[]>;
    findOne(id: string): Promise<import("../../database/entities/audit-log.entity").AuditLog>;
}
