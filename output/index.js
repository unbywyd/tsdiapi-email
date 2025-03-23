import { createEmailProvider as createProvider } from "./providers.js";
import fs from "fs";
import path from "path";
let globalEmailProvider = null;
class App {
    name = 'tsdiapi-email';
    config;
    context;
    provider;
    constructor(config) {
        this.config = { ...config };
    }
    findTemplate(ph, silent) {
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
    async onInit(ctx) {
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
        this.config.sendgridApiKey = config.get("SENDGRID_API_KEY", this.config.sendgridApiKey);
        this.config.senderEmail = config.get("SENDER_EMAIL", this.config.senderEmail);
        this.config.provider = config.get("EMAIL_PROVIDER", this.config.provider);
        this.config.smtp.host = config.get("SMTP_HOST", this.config?.smtp?.host);
        this.config.smtp.port = config.get("SMTP_PORT", this.config?.smtp?.port);
        const user = config.get("SMTP_USER", this.config?.smtp?.auth?.user);
        const pass = config.get("SMTP_PASS", this.config?.smtp?.auth?.pass);
        if (user && pass) {
            this.config.smtp.auth = { user, pass };
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
export default function createPlugin(config) {
    return new App(config);
}
export function useEmailProvider() {
    if (!globalEmailProvider) {
        throw new Error("❌ Email plugin is not initialized. Use createPlugin() in your server context first.");
    }
    return globalEmailProvider;
}
export { createProvider as createEmailProvider };
//# sourceMappingURL=index.js.map