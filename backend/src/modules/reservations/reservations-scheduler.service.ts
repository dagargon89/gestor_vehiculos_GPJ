import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../../database/entities/reservation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
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
    // Grace period: 10 min after startDatetime with no check-in
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    // Grace period: 30 min after endDatetime with no check-out
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Case 1 – pending never approved and period ended
    // Case 2 – active, no check-in 10+ min after start
    // Case 3 – active, check-in done but no check-out 30+ min after end
    const expired = await this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.vehicle', 'v')
      .where(
        '(r.status = :pending AND r.endDatetime < :now)' +
        ' OR (r.status = :active AND r.checkinOdometer IS NULL AND r.startDatetime < :tenMinAgo)' +
        ' OR (r.status = :active AND r.checkinOdometer IS NOT NULL AND r.checkoutOdometer IS NULL AND r.endDatetime < :thirtyMinAgo)',
        { pending: 'pending', active: 'active', now, tenMinAgo, thirtyMinAgo },
      )
      .getMany();

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
          notifTitle = 'Reserva vencida – aún puedes registrar tu devolución';
          notifMessage = `Tu reserva de ${vehicleLabel} venció el ${endDate} sin registrar el check-out. Puedes completarlo desde "Mis solicitudes" → sección Vencidas.`;
          emailSubject = `[Gestión de Vehículos] Reserva vencida – registra tu devolución pendiente`;
          emailBody = [
            `${greeting},`,
            '',
            `Tu reserva del vehículo ${vehicleLabel} tenía fecha de devolución el ${endDate}.`,
            'Registraste correctamente el check-in (salida) pero aún no se ha registrado el check-out (devolución).',
            '',
            'IMPORTANTE: Aún puedes registrar el check-out para dejar el registro de gasolina y kilometraje.',
            '',
            'Pasos para completar el check-out:',
            '  1. Ingresa a la plataforma en "Mis solicitudes"',
            '  2. En la sección "Reservas vencidas" localiza esta reserva',
            '  3. Pulsa el botón "Hacer check-out"',
            '  4. Registra el kilometraje de regreso, nivel de gasolina y confirma',
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
