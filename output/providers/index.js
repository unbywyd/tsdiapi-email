"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerProvider = exports.SendgridProvider = void 0;
exports.createEmailProvider = createEmailProvider;
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const loadNodemailer = () => Promise.resolve().then(() => __importStar(require("nodemailer")));
const loadSendgrid = () => Promise.resolve().then(() => __importStar(require("@sendgrid/mail")));
const buildTemplate = async (path, meta, additionalTemplateData) => {
    const content = fs_1.default.readFileSync(path, "utf-8");
    const template = handlebars_1.default.compile(content);
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
class SendgridProvider {
    config;
    logger;
    sgMail;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
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
            await this.sgMail.send({ from: this.config.senderEmail, to, subject, html: _html });
            this.logger.info(`Email with subject "${subject}" sent to ${to}`);
        }
        catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}
exports.SendgridProvider = SendgridProvider;
class NodemailerProvider {
    config;
    logger;
    transporter;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
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
            await this.transporter.sendMail({ from: this.config.senderEmail || this.config.smtp?.auth?.user, to, subject, html: _html });
            this.logger.info(`Email with subject "${subject}" sent to ${to}`);
        }
        catch (error) {
            this.logger.error("Error sending email", error);
        }
    }
}
exports.NodemailerProvider = NodemailerProvider;
async function createEmailProvider(config, logger) {
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
//# sourceMappingURL=index.js.map