export declare class MailService {
    private readonly logger;
    private transporter;
    constructor();
    send(to: string, subject: string, text: string): Promise<void>;
}
