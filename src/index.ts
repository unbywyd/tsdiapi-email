import SMTPTransport from "nodemailer/lib/smtp-transport";
import "reflect-metadata";
import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { createEmailProvider as createProvider, EmailProvider as IEmailProvider } from "./providers";
import fs from "fs";
import path from "path";

let globalEmailProvider: IEmailProvider | null = null;

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
    additionalTemplateData?: Record<any, any> | ((ctx: EmailUserContext<any>) => Record<any, any> | Promise<Record<any, any>>),
    context?: <T>(ctx: EmailUserContext<T>) => Promise<EmailUserContext<T>> | EmailUserContext<T>
}

class App implements AppPlugin {
    name = 'tsdiapi-email';
    config: PluginOptions;
    context: AppContext;
    provider: IEmailProvider;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
    }
    findTemplate(ph: string, silent?: boolean) {
        if (!this.context) {
            throw new Error("Plugin context is not initialized yet.");
        }
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
        if (!silent) {
            this.context?.logger?.warn(`Template file for email not found at ${ph}`);
        }
        return null;
    }
    async onInit(ctx: AppContext) {
        if (globalEmailProvider) {
            ctx.logger.warn("Email plugin is already initialized. Skipping re-initialization.");
            return;
        }
        this.context = ctx;

        const appConfig = ctx.config.appConfig || {};
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
        if (!this.config.handlebarsTemplatePath) {
            this.config.handlebarsTemplatePath = this.findTemplate("src/templates/email.hbs", true);
        }
        if (this.config.handlebarsTemplatePath) {
            ctx.logger.info(`Using email template from ${this.config.handlebarsTemplatePath}`);
        }
        this.provider = await createProvider(this.config, this.context.logger);
        globalEmailProvider = this.provider;
        this.context.logger.info("✅ Email plugin initialized successfully.");
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}

export function getEmailProvider(): IEmailProvider {
    if (!globalEmailProvider) {
        throw new Error("❌ Email plugin is not initialized. Use createPlugin() in your server context first.");
    }
    return globalEmailProvider;
}

export { createProvider as createEmailProvider };

export type { IEmailProvider as EmailProvider };