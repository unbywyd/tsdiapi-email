import type { PluginOptions } from "./index.js";
import type { Logger } from "winston";
export interface EmailProvider {
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare class SendgridProvider implements EmailProvider {
    private config;
    logger: Logger;
    private sgMail;
    constructor(config: PluginOptions, logger: Logger);
    checkSendgridConfig(): Promise<void>;
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare class NodemailerProvider implements EmailProvider {
    private config;
    logger: Logger;
    private transporter;
    constructor(config: PluginOptions, logger: Logger);
    checkSmtpConfig(): Promise<void>;
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare function createEmailProvider(config: PluginOptions, logger: Logger): Promise<EmailProvider>;
//# sourceMappingURL=providers.d.ts.map