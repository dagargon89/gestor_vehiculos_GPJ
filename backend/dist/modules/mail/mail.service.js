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
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = null;
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
        }
        else {
            this.logger.warn('Mail not configured (MAIL_HOST, MAIL_USER, MAIL_PASSWORD). Notifications will be in-app only.');
        }
    }
    async send(to, subject, text) {
        if (!this.transporter)
            return;
        const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@fleet.local';
        try {
            await this.transporter.sendMail({
                from,
                to,
                subject,
                text,
            });
            this.logger.log(`Email sent to ${to}: ${subject}`);
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map