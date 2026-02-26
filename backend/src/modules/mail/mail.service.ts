import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT', 587);
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    const secure = this.config.get<string>('MAIL_SECURE') === 'true';

    this.from = this.config.get<string>('MAIL_FROM') || user || 'noreply@fleet.local';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host, port, secure,
        auth: { user, pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
      });
      this.logger.log(`Mail transporter created (host=${host}, port=${port}, secure=${secure})`);
    } else {
      this.logger.warn('Mail not configured. Notifications will be in-app only.');
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (err) {
      this.logger.error(
        `SMTP verification failed: ${err instanceof Error ? err.message : err}. Check MAIL_HOST, MAIL_PORT, credentials.`,
      );
    }
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.debug('Mail not sent: SMTP not configured');
      return;
    }
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.transporter.sendMail({ from: this.from, to, subject, text });
        this.logger.log(`Email sent to ${to}: ${subject}`);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < this.maxRetries) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(`Email to ${to} failed (attempt ${attempt}/${this.maxRetries}): ${msg}. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          this.logger.error(`Email to ${to} failed after ${this.maxRetries} attempts: ${msg}`);
        }
      }
    }
  }
}
