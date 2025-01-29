"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmail = void 0;
exports.default = createPlugin;
require("reflect-metadata");
const providers_1 = require("./providers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let SendEmail = async () => { throw new Error("Email provider not initialized"); };
exports.SendEmail = SendEmail;
class App {
    name = 'tsdiapi-email';
    config;
    context;
    provider;
    constructor(config) {
        this.config = { ...config };
    }
    findTemplate(ph) {
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
        this.context?.logger?.warn(`Template file for email not found at ${ph}`);
        return null;
    }
    async onInit(ctx) {
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
        this.provider = await (0, providers_1.createEmailProvider)(this.config, this.context.logger);
        exports.SendEmail = SendEmail = this.provider.sendEmail.bind(this.provider);
    }
}
function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map