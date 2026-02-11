import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@Controller('audit-logs')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission('audit_logs', 'read')
  findAll(
    @Query('userId') userId?: string,
    @Query('resource') resource?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogsService.findAll(
      userId || resource || resourceId || action || from || to
        ? { userId, resource, resourceId, action, from, to }
        : undefined,
    );
  }

  @Get(':id')
  @RequirePermission('audit_logs', 'read')
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
