import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('audit-logs')
@UseGuards(FirebaseAuthGuard)
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
