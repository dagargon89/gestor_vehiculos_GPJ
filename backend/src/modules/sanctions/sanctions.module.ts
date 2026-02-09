import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sanction } from '../../database/entities/sanction.entity';
import { SanctionsService } from './sanctions.service';
import { SanctionsController } from './sanctions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sanction])],
  controllers: [SanctionsController],
  providers: [SanctionsService],
  exports: [SanctionsService],
})
export class SanctionsModule {}
