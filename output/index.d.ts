import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { createEmailProvider as createProvider, EmailProvider as IEmailProvider } from "./providers.js";
declare module "fastify" {
    interface FastifyInstance {
        email: IEmailProvider;
    }
}
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
    smtp?: Record<string, any>;
    handlebarsTemplatePath?: string;
    additionalTemplateData?: Record<any, any> | ((ctx: EmailUserContext<any>) => Record<any, any> | Promise<Record<any, any>>);
    context?: <T>(ctx: EmailUserContext<T>) => Promise<EmailUserContext<T>> | EmailUserContext<T>;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    provider: IEmailProvider;
    constructor(config?: PluginOptions);
    findTemplate(ph: string, silent?: boolean): string;
    onInit(ctx: AppContext): Promise<void>;
}
export default function createPlugin(config?: PluginOptions): App;
export declare function useEmailProvider(): IEmailProvider;
export { createProvider as createEmailProvider };
export type { IEmailProvider as EmailProvider };
//# sourceMappingURL=index.d.ts.map