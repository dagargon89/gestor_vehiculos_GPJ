export declare class AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}
