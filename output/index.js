"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailProvider = void 0;
exports.default = createPlugin;
exports.getEmailProvider = getEmailProvider;
require("reflect-metadata");
const providers_1 = require("./providers");
Object.defineProperty(exports, "createEmailProvider", { enumerable: true, get: function () { return providers_1.createEmailProvider; } });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        if (fs_1.default.existsSync(ph)) {
            return ph;
        }
        if (fs_1.default.existsSync(`${projectDir}/${ph}`)) {
            return `${projectDir}/${ph}`;
        }
        const fp = path_1.default.join(projectDir, ph);
        if (fs_1.default.existsSync(fp)) {
            return fp;
        }
        if (!silent) {
            this.context?.logger?.warn(`Template file for email not found at ${ph}`);
        }
        return null;
    }
    async onInit(ctx) {
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
        this.provider = await (0, providers_1.createEmailProvider)(this.config, this.context.logger);
        globalEmailProvider = this.provider;
        this.context.logger.info("✅ Email plugin initialized successfully.");
    }
}
function createPlugin(config) {
    return new App(config);
}
function getEmailProvider() {
    if (!globalEmailProvider) {
        throw new Error("❌ Email plugin is not initialized. Use createPlugin() in your server context first.");
    }
    return globalEmailProvider;
}
//# sourceMappingURL=index.js.map