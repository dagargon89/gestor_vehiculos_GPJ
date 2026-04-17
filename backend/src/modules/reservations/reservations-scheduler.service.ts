import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

@Injectable()
export class ReservationsSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReservationsSchedulerService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async onApplicationBootstrap() {
    await this.markOverdueReservations();
  }

  @Cron('*/10 * * * *') // Every 10 minutes
  async markOverdueReservations(): Promise<void> {
    const now = new Date();

    const expired = await this.reservationRepo.find({
      where: [
        { status: 'active', endDatetime: LessThan(now) },
        { status: 'pending', endDatetime: LessThan(now) },
      ],
      relations: ['user', 'vehicle'],
    });

    if (expired.length === 0) return;

    this.logger.log(`Found ${expired.length} reservation(s) to mark overdue`);

    for (const r of expired) {
      try {
        await this.reservationRepo.update(r.id, { status: 'overdue' });

        const vehicleLabel = r.vehicle
          ? `${r.vehicle.plate} – ${r.vehicle.brand} ${r.vehicle.model}`
          : 'el vehículo';
        const endDate = formatDateEs(r.endDatetime);
        const greeting = r.user?.displayName ? `Hola, ${r.user.displayName}` : 'Hola';

        let notifTitle: string;
        let notifMessage: string;
        let emailSubject: string;
        let emailBody: string;

        if (r.status === 'pending') {
          notifTitle = 'Reserva vencida sin aprobar';
          notifMessage = `Tu solicitud de ${vehicleLabel} venció el ${endDate} sin ser aprobada. Si la necesitas, realiza una nueva solicitud.`;
          emailSubject = `[Gestión de Vehículos] Reserva vencida – ${vehicleLabel}`;
          emailBody = [
            `${greeting},`,
            '',
            `Tu solicitud de reserva del vehículo ${vehicleLabel} venció el ${endDate} sin haber sido aprobada por el área de administración.`,
            '',
            'Si aún necesitas el vehículo, realiza una nueva solicitud en la plataforma.',
            '',
            'Este es un mensaje automático del sistema de Gestión de Vehículos Institucionales.',
          ].join('\n');
        } else if (r.checkinOdometer == null) {
          notifTitle = 'Reserva vencida – sin check-in ni check-out';
          notifMessage = `Tu reserva de ${vehicleLabel} venció el ${endDate} sin registrar salida ni devolución. Comunícate con administración.`;
          emailSubject = `[Gestión de Vehículos] Reserva vencida – sin registro de salida ni devolución`;
          emailBody = [
            `${greeting},`,
            '',
            `Tu reserva del vehículo ${vehicleLabel} tenía fecha de devolución el ${endDate},`,
            'pero venció sin que se registrara ninguno de los dos controles obligatorios:',
            '',
            '  • Check-in  (salida del vehículo)',
            '  • Check-out (devolución del vehículo)',
            '',
            'Si ya devolviste el vehículo, ingresa a la plataforma en "Mis solicitudes"',
            'y completa el check-out para regularizar la reserva.',
            '',
            'De lo contrario, comunícate de inmediato con el área de administración de flota.',
            '',
            'Este es un mensaje automático del sistema de Gestión de Vehículos Institucionales.',
          ].join('\n');
        } else {
          notifTitle = 'Reserva vencida – pendiente de registrar devolución';
          notifMessage = `Tu reserva de ${vehicleLabel} venció el ${endDate} sin registrar el check-out. Ingresa a la plataforma y complétalo.`;
          emailSubject = `[Gestión de Vehículos] Reserva vencida – pendiente de registrar devolución`;
          emailBody = [
            `${greeting},`,
            '',
            `Tu reserva del vehículo ${vehicleLabel} tenía fecha de devolución el ${endDate}.`,
            'Registraste correctamente el check-in (salida) pero NO se registró el check-out (devolución).',
            '',
            'Si ya devolviste el vehículo:',
            '  1. Ingresa a la plataforma en "Mis solicitudes"',
            '  2. Localiza la reserva y pulsa "Hacer check-out"',
            '  3. Registra el kilometraje de regreso y confirma',
            '',
            'Si aún no has devuelto el vehículo, hazlo a la brevedad y completa el check-out.',
            '',
            'Este es un mensaje automático del sistema de Gestión de Vehículos Institucionales.',
          ].join('\n');
        }

        // In-app notification
        await this.notificationsService.notifyUser(
          r.userId,
          'reservation_overdue',
          notifTitle,
          notifMessage,
          '/mis-solicitudes',
        );

        // Email — mandatory regardless of user preference
        if (r.user?.email) {
          await this.mailService.send(r.user.email, emailSubject, emailBody);
        }

        this.logger.log(`Reservation ${r.id} → overdue. Notifications sent to ${r.user?.email ?? r.userId}`);
      } catch (err) {
        this.logger.error(
          `Failed to process overdue reservation ${r.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
