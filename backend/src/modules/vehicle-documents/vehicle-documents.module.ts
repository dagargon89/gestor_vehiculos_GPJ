import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehicleDocumentsController } from './vehicle-documents.controller';
import { VehicleDocumentScheduler } from './vehicle-document-scheduler.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleDocument]), UsersModule, NotificationsModule],
  controllers: [VehicleDocumentsController],
  providers: [VehicleDocumentsService, VehicleDocumentScheduler],
  exports: [VehicleDocumentsService],
})
export class VehicleDocumentsModule {}
