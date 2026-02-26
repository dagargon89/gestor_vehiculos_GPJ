import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MailService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private transporter;
    private readonly from;
    private readonly maxRetries;
    private readonly baseDelayMs;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    send(to: string, subject: string, text: string): Promise<void>;
}
