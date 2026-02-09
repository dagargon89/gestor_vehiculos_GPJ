import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('reports')
@UseGuards(FirebaseAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('vehicle-usage')
  getVehicleUsage(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.reportsService.getVehicleUsageReport(start, end);
  }
}
