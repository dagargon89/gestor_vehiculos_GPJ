"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = null;
        this.maxRetries = 3;
        this.baseDelayMs = 1000;
        const host = this.config.get('MAIL_HOST');
        const port = this.config.get('MAIL_PORT', 587);
        const user = this.config.get('MAIL_USER');
        const pass = this.config.get('MAIL_PASSWORD');
        const secure = this.config.get('MAIL_SECURE') === 'true';
        this.from = this.config.get('MAIL_FROM') || user || 'noreply@fleet.local';
        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host, port, secure,
                auth: { user, pass },
                connectionTimeout: 10_000,
                greetingTimeout: 10_000,
                socketTimeout: 30_000,
            });
            this.logger.log(`Mail transporter created (host=${host}, port=${port}, secure=${secure})`);
        }
        else {
            this.logger.warn('Mail not configured. Notifications will be in-app only.');
        }
    }
    async onModuleInit() {
        if (!this.transporter)
            return;
        try {
            await this.transporter.verify();
            this.logger.log('SMTP connection verified successfully');
        }
        catch (err) {
            this.logger.error(`SMTP verification failed: ${err instanceof Error ? err.message : err}. Check MAIL_HOST, MAIL_PORT, credentials.`);
        }
    }
    async send(to, subject, text) {
        if (!this.transporter) {
            this.logger.debug('Mail not sent: SMTP not configured');
            return;
        }
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                await this.transporter.sendMail({ from: this.from, to, subject, text });
                this.logger.log(`Email sent to ${to}: ${subject}`);
                return;
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (attempt < this.maxRetries) {
                    const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
                    this.logger.warn(`Email to ${to} failed (attempt ${attempt}/${this.maxRetries}): ${msg}. Retrying in ${delay}ms...`);
                    await new Promise((r) => setTimeout(r, delay));
                }
                else {
                    this.logger.error(`Email to ${to} failed after ${this.maxRetries} attempts: ${msg}`);
                }
            }
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map