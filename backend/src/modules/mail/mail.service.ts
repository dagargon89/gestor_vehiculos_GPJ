import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;
    const secure = process.env.MAIL_SECURE === 'true';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log('Mail service configured');
    } else {
      this.logger.warn('Mail not configured (MAIL_HOST, MAIL_USER, MAIL_PASSWORD). Notifications will be in-app only.');
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug('Mail not sent: SMTP not configured');
      return;
    }
    const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@fleet.local';
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
