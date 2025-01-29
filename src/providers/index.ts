import type { Transporter } from "nodemailer";
import type { EmailUserContext, PluginOptions } from "..";
import type { MailService } from "@sendgrid/mail";
import type { Logger } from "winston";
import handlebars from "handlebars";
import fs from "fs";
const loadNodemailer = () => import("nodemailer");
const loadSendgrid = () => import("@sendgrid/mail");

export interface EmailProvider {
    init(): Promise<void>;
    sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>): Promise<void>;
}

const buildTemplate = (path: string, meta: EmailUserContext<any>, additionalTemplateData: any) => {
    const content = fs.readFileSync(path, "utf-8");
    const template = handlebars.compile(content);
    const finalHtml = template({
        ...meta,
        ...additionalTemplateData,
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
}



export class SendgridProvider implements EmailProvider {
    private sgMail: MailService;

    constructor(private config: PluginOptions, public logger: Logger) { }

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

    async sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>) {
        if (!this.sgMail) {
            throw new Error("Sendgrid is not initialized. Call `init()` first.");
        }
        try {
            let _html = html;
            let ctx = { subject, to, html, payload: payload || {} };
            if (this.config.context) {
                try {
                    ctx = await this.config.context(ctx);
                } catch (error) {
                    this.logger.error("Error in context function", error);
                }
            }
            if (this.config.handlebarsTemplatePath) {
                _html = buildTemplate(this.config.handlebarsTemplatePath, ctx, this.config.additionalTemplateData || {});
            }

            await this.sgMail.send({ from: this.config.senderEmail, to, subject, html: _html });
            this.logger.info(`Email with subject "${subject}" sent to ${to}`);
        } catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}

export class NodemailerProvider implements EmailProvider {
    private transporter: Transporter<any>;
    constructor(private config: PluginOptions, public logger: Logger) { }

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

    async sendEmail(to: string | Array<string>, subject: string, html?: string, payload?: Record<any, any>) {
        if (!this.transporter) {
            throw new Error("Nodemailer is not initialized. Call `init()` first.");
        }
        try {
            let _html = html;
            let ctx = { subject, to, html, payload: payload || {} };
            if (this.config.context) {
                try {
                    ctx = await this.config.context(ctx);
                } catch (error) {
                    this.logger.error("Error in context function", error);
                }
            }
            if (this.config.handlebarsTemplatePath) {
                _html = buildTemplate(this.config.handlebarsTemplatePath, ctx, this.config.additionalTemplateData || {});
            }
            await this.transporter.sendMail({ from: this.config.senderEmail || this.config.smtp?.auth?.user, to, subject, html: _html });
            this.logger.info(`Email with subject "${subject}" sent to ${to}`);
        } catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}

export async function createEmailProvider(config: PluginOptions, logger: Logger): Promise<EmailProvider> {
    if (config.provider === "nodemailer") {
        const provider = new NodemailerProvider(config, logger);
        await provider.init();
        return provider;
    }

    if (config.provider === "sendgrid") {
        const provider = new SendgridProvider(config, logger);
        await provider.init();
        return provider;
    }

    throw new Error("Invalid email provider. Choose 'nodemailer' or 'sendgrid'.");
}
