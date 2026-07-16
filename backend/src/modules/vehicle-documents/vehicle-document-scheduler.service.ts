import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { VehicleDocument } from '../../database/entities/vehicle-document.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

const DAYS_THRESHOLD = 30;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  insurance: 'seguro',
  circulation_card: 'tarjeta de circulación',
  inspection: 'verificación vehicular',
};

@Injectable()
export class VehicleDocumentScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(VehicleDocumentScheduler.name);

  constructor(
    @InjectRepository(VehicleDocument)
    private repo: Repository<VehicleDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async onApplicationBootstrap() {
    await this.checkExpiringDocuments();
  }

  @Cron('0 7 * * *')
  async checkExpiringDocuments(): Promise<void> {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + DAYS_THRESHOLD);

    const expiring = await this.repo.find({
      where: { expiryDate: LessThanOrEqual(soonDate) },
      relations: ['vehicle'],
    });

    if (expiring.length === 0) return;

    const approvers = await this.usersService.findUsersWithPermission('vehicle_documents', 'delete');

    for (const doc of expiring) {
      try {
        const label = doc.vehicle ? `${doc.vehicle.plate} – ${doc.vehicle.brand} ${doc.vehicle.model}` : 'un vehículo';
        const docLabel = DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType;
        for (const approver of approvers) {
          await this.notificationsService.notifyUser(
            approver.id,
            'document_expiring',
            'Documento de vehículo por vencer',
            `El ${docLabel} de ${label} vence pronto (${new Date(doc.expiryDate).toLocaleDateString('es-MX')}).`,
            '/vehicles',
          );
        }
      } catch (err) {
        this.logger.error(`Failed to process expiring document ${doc.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }
}
