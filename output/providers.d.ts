import type { PluginOptions } from "./index.js";
import { AppContext } from "@tsdiapi/server";
export interface EmailProvider {
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare class SendgridProvider implements EmailProvider {
    private config;
    logger: AppContext['fastify']['log'];
    private appContext;
    private sgMail;
    constructor(config: PluginOptions, logger: AppContext['fastify']['log'], appContext: AppContext);
    checkSendgridConfig(): Promise<void>;
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare class NodemailerProvider implements EmailProvider {
    private config;
    logger: AppContext['fastify']['log'];
    private appContext;
    private transporter;
    constructor(config: PluginOptions, logger: AppContext['fastify']['log'], appContext: AppContext);
    checkSmtpConfig(): Promise<void>;
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}
export declare function createEmailProvider(config: PluginOptions, app: AppContext): Promise<EmailProvider>;
//# sourceMappingURL=providers.d.ts.map