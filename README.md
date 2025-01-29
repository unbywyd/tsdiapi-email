# TSDIAPI Email Plugin

The `tsdiapi-email` plugin provides an easy way to integrate email sending functionality into your **TSDIAPI-Server** applications. It supports **Nodemailer** and **SendGrid**, allowing flexibility in choosing an email provider.

## Installation

```sh
npm install tsdiapi-email
```

## Usage

### Register the Plugin

Add the plugin to your `TSDIAPI-Server` setup:

```typescript
import createPlugin from "tsdiapi-email";
import { createApp } from "tsdiapi-server";

createApp({
  plugins: [
    createPlugin({
      provider: "sendgrid", // or "nodemailer"
      senderEmail: "no-reply@example.com",
      sendgridApiKey: "your-sendgrid-api-key", // required for SendGrid
      smtp: {
        host: "smtp.example.com",
        port: 587,
        auth: { user: "your-smtp-user", pass: "your-smtp-pass" },
      }, // required for Nodemailer
    }),
  ],
});
```

Alternatively, configure via **ENV**:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=no-reply@example.com

# or for SMTP (Nodemailer)
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
```

## Sending Emails

```typescript
import { SendEmail } from "tsdiapi-email";

await SendEmail("user@example.com", "Welcome!", "<h1>Hello</h1>");
```

## Handlebars Templating Support

Use **handlebars templates** for email content:

```typescript
createPlugin({
  handlebarsTemplatePath: "src/templates/email.hbs", // Default: src/templates/email.hbs
  additionalTemplateData: { company: "My Company" }, // Can be a async function too
});
```

## Using context function

The `context` function allows you to modify the email context before sending:

```typescript
import createPlugin, { EmailUserContext } from "tsdiapi-email";

createPlugin({
  handlebarsTemplatePath: "src/templates/email.hbs",
  context: async (ctx: EmailUserContext<any>) => {
    ctx?.payload = { company: "My Company" }
    return ctx
  },
});
```

## License

MIT
