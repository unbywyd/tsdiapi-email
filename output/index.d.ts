import SMTPTransport from "nodemailer/lib/smtp-transport";
import "reflect-metadata";
import { AppContext, AppPlugin } from "tsdiapi-server";
import { EmailProvider } from "./providers";
declare let SendEmail: EmailProvider["sendEmail"];
export type EmailUserContext<T extends Record<any, any>> = {
    subject: string;
    to: string | Array<string>;
    html: string;
    payload: T;
};
export type PluginOptions = {
    provider?: 'sendgrid' | 'nodemailer';
    senderEmail?: string;
    sendgridApiKey?: string;
    smtp?: SMTPTransport.Options;
    handlebarsTemplatePath?: string;
    additionalTemplateData?: Record<any, any>;
    context?: <T>(ctx: EmailUserContext<T>) => Promise<EmailUserContext<T>> | EmailUserContext<T>;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    provider: EmailProvider;
    constructor(config?: PluginOptions);
    findTemplate(ph: string): string;
    onInit(ctx: AppContext): Promise<void>;
}
export default function createPlugin(config?: PluginOptions): App;
export { SendEmail };
//# sourceMappingURL=index.d.ts.map