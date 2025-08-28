import handlebars from "handlebars";
import fs from "fs";
const loadNodemailer = () => import("nodemailer");
const loadSendgrid = () => import("@sendgrid/mail");
// Вспомогательная функция для проверки devMode
const isDevModeEnabled = async (devMode, appContext) => {
    if (devMode === undefined || devMode === false) {
        return false;
    }
    if (devMode === true) {
        return true;
    }
    if (typeof devMode === 'function') {
        return await devMode(appContext);
    }
    if (devMode instanceof Promise) {
        return await devMode;
    }
    return false;
};
const buildTemplate = async (path, meta, additionalTemplateData) => {
    const content = fs.readFileSync(path, "utf-8");
    const template = handlebars.compile(content);
    const metaData = additionalTemplateData instanceof Function ? await additionalTemplateData(meta) : (additionalTemplateData || {});
    const finalHtml = template({
        ...meta,
        ...metaData,
        content: meta.html,
    });
    return `<html><head><style type="text/css">
            .im {
               color: inherit !important;
            }
            img {max-width: 100%;}
            p, h1, h2, h3, h4, h5, h6 {
                color: inherit !important;
            }</style></head><body>${finalHtml}</body></html>`;
};
export class SendgridProvider {
    config;
    logger;
    appContext;
    sgMail;
    constructor(config, logger, appContext) {
        this.config = config;
        this.logger = logger;
        this.appContext = appContext;
    }
    async checkSendgridConfig() {
        if (!this.config.sendgridApiKey) {
            throw new Error("Sendgrid API key is required for sendgrid provider.");
        }
    }
    async init() {
        await this.checkSendgridConfig();
        const sendgrid = await loadSendgrid();
        this.sgMail = sendgrid.default;
        this.sgMail.setApiKey(this.config.sendgridApiKey);
    }
    async sendEmail(to, subject, html, payload) {
        if (!this.sgMail) {
            throw new Error("Sendgrid is not initialized. Call `init()` first.");
        }
        try {
            let _html = html;
            let ctx = { subject, to, html, payload: payload || {} };
            if (this.config.context) {
                try {
                    ctx = await this.config.context(ctx);
                }
                catch (error) {
                    this.logger.error("Error in context function", error);
                }
            }
            if (this.config.handlebarsTemplatePath) {
                _html = await buildTemplate(this.config.handlebarsTemplatePath, ctx, this.config.additionalTemplateData || {});
            }
            const devModeEnabled = await isDevModeEnabled(this.config.devMode, this.appContext);
            if (devModeEnabled) {
                this.logger.info(`📧 [DEV MODE] Email would be sent:`, {
                    from: this.config.senderEmail,
                    to: to,
                    subject: subject,
                    html: _html,
                    provider: 'sendgrid'
                });
            }
            else {
                await this.sgMail.send({ from: this.config.senderEmail, to, subject, html: _html });
                this.logger.info(`Email with subject "${subject}" sent to ${to}`);
            }
        }
        catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}
export class NodemailerProvider {
    config;
    logger;
    appContext;
    transporter;
    constructor(config, logger, appContext) {
        this.config = config;
        this.logger = logger;
        this.appContext = appContext;
    }
    async checkSmtpConfig() {
        if (!this.config.smtp) {
            throw new Error("SMTP configuration is required for nodemailer provider.");
        }
        if (!this.config.smtp.auth) {
            throw new Error("SMTP auth configuration is required for nodemailer provider.");
        }
        if (!this.config.smtp.auth.user) {
            throw new Error("SMTP auth user and pass are required for nodemailer provider.");
        }
        if (!this.config.smtp.host) {
            throw new Error("SMTP host is required for nodemailer provider.");
        }
    }
    async init() {
        await this.checkSmtpConfig();
        const nodemailer = await loadNodemailer();
        this.transporter = nodemailer.default.createTransport(this.config.smtp);
    }
    async sendEmail(to, subject, html, payload) {
        if (!this.transporter) {
            throw new Error("Nodemailer is not initialized. Call `init()` first.");
        }
        try {
            let _html = html;
            let ctx = { subject, to, html, payload: payload || {} };
            if (this.config.context) {
                try {
                    ctx = await this.config.context(ctx);
                }
                catch (error) {
                    this.logger.error("Error in context function", error);
                }
            }
            if (this.config.handlebarsTemplatePath) {
                _html = await buildTemplate(this.config.handlebarsTemplatePath, ctx, this.config.additionalTemplateData || {});
            }
            // Проверяем devMode
            const devModeEnabled = await isDevModeEnabled(this.config.devMode, this.appContext);
            if (devModeEnabled) {
                // В режиме разработки логируем письмо вместо отправки
                this.logger.info(`📧 [DEV MODE] Email would be sent:`, {
                    from: this.config.senderEmail || this.config.smtp?.auth?.user,
                    to: to,
                    subject: subject,
                    html: _html,
                    provider: 'nodemailer'
                });
            }
            else {
                // Отправляем письмо как обычно
                await this.transporter.sendMail({ from: this.config.senderEmail || this.config.smtp?.auth?.user, to, subject, html: _html });
                this.logger.info(`Email with subject "${subject}" sent to ${to}`);
            }
        }
        catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}
export async function createEmailProvider(config, app) {
    if (config.provider === "nodemailer") {
        const provider = new NodemailerProvider(config, app.fastify.log, app);
        await provider.init();
        return provider;
    }
    if (config.provider === "sendgrid") {
        const provider = new SendgridProvider(config, app.fastify.log, app);
        await provider.init();
        return provider;
    }
    throw new Error("Invalid email provider. Choose 'nodemailer' or 'sendgrid'.");
}
//# sourceMappingURL=providers.js.map