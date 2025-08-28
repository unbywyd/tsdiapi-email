import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { createEmailProvider as createProvider, EmailProvider as IEmailProvider } from "./providers.js";
import fs from "fs";
import path from "path";
let globalEmailProvider: IEmailProvider | null = null;
import type { FastifyInstance } from "fastify";
declare module "fastify" {
    interface FastifyInstance {
        email: IEmailProvider;
    }
}

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
    smtp?: Record<string, any>,
    handlebarsTemplatePath?: string,
    devMode?: boolean | Promise<boolean> | ((ctx: AppContext) => Promise<boolean> | boolean),
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
            this.context?.fastify.log?.warn(`Template file for email not found at ${ph}`);
        }
        return null;
    }
    async onInit(ctx: AppContext) {
        if (globalEmailProvider) {
            ctx.fastify.log.warn("Email plugin is already initialized. Skipping re-initialization.");
            return;
        }
        this.context = ctx;

        const config = ctx.projectConfig;
        if (!this.config.smtp) {
            this.config.smtp = {};
        }
        if (!this.config.smtp.auth) {
            this.config.smtp.auth = {};
        }
        this.config.sendgridApiKey = config.get("SENDGRID_API_KEY", this.config.sendgridApiKey) as string;
        this.config.senderEmail = config.get("SENDER_EMAIL", this.config.senderEmail) as string;
        this.config.provider = config.get("EMAIL_PROVIDER", this.config.provider) as 'sendgrid' | 'nodemailer';

        this.config.smtp.host = config.get("SMTP_HOST", this.config?.smtp?.host) as string;
        this.config.smtp.port = config.get("SMTP_PORT", this.config?.smtp?.port) as number;

        const user = config.get("SMTP_USER", this.config?.smtp?.auth?.user) as string;
        const pass = config.get("SMTP_PASS", this.config?.smtp?.auth?.pass) as string;
        if (user && pass) {
            this.config.smtp.auth = { user, pass };
        }

        // Получаем devMode из переменных окружения
        const envDevMode = config.get("DEV_MODE", false) as boolean;
        if (this.config.devMode === undefined) {
            this.config.devMode = envDevMode;
        }

        if (this.config.handlebarsTemplatePath) {
            this.config.handlebarsTemplatePath = this.findTemplate(this.config.handlebarsTemplatePath);
        }
        if (!this.config.handlebarsTemplatePath) {
            this.config.handlebarsTemplatePath = this.findTemplate("src/templates/email.hbs", true);
        }
        if (this.config.handlebarsTemplatePath) {
            ctx.fastify.log.info(`Using email template from ${this.config.handlebarsTemplatePath}`);
        }
        this.provider = await createProvider(this.config, this.context);
        globalEmailProvider = this.provider;
        ctx.fastify.decorate("email", this.provider);
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}

export function useEmailProvider(): IEmailProvider {
    if (!globalEmailProvider) {
        throw new Error("❌ Email plugin is not initialized. Use createPlugin() in your server context first.");
    }
    return globalEmailProvider;
}

export { createProvider as createEmailProvider };

export type { IEmailProvider as EmailProvider };