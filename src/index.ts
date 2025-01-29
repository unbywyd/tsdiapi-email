import SMTPTransport from "nodemailer/lib/smtp-transport";
import "reflect-metadata";
import { AppContext, AppPlugin } from "tsdiapi-server";
import { createEmailProvider, EmailProvider } from "./providers";
import fs from "fs";
import path from "path";
let SendEmail: EmailProvider["sendEmail"] = async () => { throw new Error("Email provider not initialized") };

export type EmailUserContext<T extends Record<any, any>> = {
    subject: string,
    to: string | Array<string>,
    html: string,
    payload: T
}

export type PluginOptions = {
    provider?: 'sendgrid' | 'nodemailer',
    senderEmail?: string,
    sendgridApiKey?: string,
    smtp?: SMTPTransport.Options,
    handlebarsTemplatePath?: string,
    additionalTemplateData?: Record<any, any>,
    context?: <T>(ctx: EmailUserContext<T>) => Promise<EmailUserContext<T>> | EmailUserContext<T>
}

class App implements AppPlugin {
    name = 'tsdiapi-email';
    config: PluginOptions;
    context: AppContext;
    provider: EmailProvider;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
    }
    findTemplate(ph: string) {
        const projectDir = this.context.appDir;
        if (fs.existsSync(ph)) {
            return ph;
        }
        if (fs.existsSync(`${projectDir}/${ph}`)) {
            return `${projectDir}/${ph}`;
        }
        const fp = path.join(projectDir, ph);
        if (fs.existsSync(fp)) {
            return fp;
        }
        this.context?.logger?.warn(`Template file for email not found at ${ph}`);
        return null;
    }
    async onInit(ctx: AppContext) {
        this.context = ctx;

        const appConfig = ctx.config.appConfig;
        if ("SENDGRID_API_KEY" in appConfig) {
            this.config.sendgridApiKey = appConfig.SENDGRID_API_KEY;
        }
        if (!this.config.smtp) {
            this.config.smtp = {};
        }
        if ("SMTP_HOST" in appConfig) {
            this.config.smtp.host = appConfig.SMTP_HOST;
        }
        if ("SMTP_PORT" in appConfig) {
            this.config.smtp.port = appConfig.SMTP_PORT;
        }
        if ("SMTP_USER" in appConfig && "SMTP_PASS" in appConfig) {
            this.config.smtp.auth = { user: appConfig.SMTP_USER, pass: appConfig.SMTP_PASS };
        }
        if ("SENDER_EMAIL" in appConfig) {
            this.config.senderEmail = appConfig.SENDER_EMAIL;
        }
        if ("EMAIL_PROVIDER" in appConfig) {
            this.config.provider = appConfig.EMAIL_PROVIDER;
        }

        if (this.config.handlebarsTemplatePath) {
            this.config.handlebarsTemplatePath = this.findTemplate(this.config.handlebarsTemplatePath);
        }
        this.provider = await createEmailProvider(this.config, this.context.logger);
        SendEmail = this.provider.sendEmail.bind(this.provider);
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}

export { SendEmail }