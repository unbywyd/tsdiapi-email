# @tsdiapi/email: Email Plugin for TSDIAPI-Server

The **@tsdiapi/email** plugin enables easy integration of email functionality into **TSDIAPI-Server** applications. It supports both **Nodemailer** and **SendGrid**, giving you the flexibility to choose your preferred provider.

---

## Installation

```sh
npm install @tsdiapi/email
```

Or add the plugin via the CLI:

```sh
tsdiapi add plugin email
```

---

## Usage

### Register the Plugin

Include the plugin in your server setup:

```typescript
import createPlugin from "@tsdiapi/email";
import { createApp } from "@tsdiapi/server";

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

Alternatively, configure it through **ENV**:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=no-reply@example.com

# For SMTP (Nodemailer)
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
```

---

## Sending Emails

Use the `SendEmail` function to send emails:

```typescript
import { SendEmail } from "@tsdiapi/email";

await SendEmail("user@example.com", "Welcome!", "<h1>Hello!</h1>");

// Send with handlebars payload
await SendEmail("user@example.com", "Welcome!", "<h1>Hello!</h1>", { name: "John" });
```

---

## Handlebars Templating Support

Easily define reusable email templates using **Handlebars**:

```typescript
createPlugin({
  handlebarsTemplatePath: "src/templates/email.hbs", // Path to the template file
  additionalTemplateData: { company: "My Company" },  // Static or dynamic data
});
```

In the template file (`email.hbs`), you can use placeholders like:

```hbs
<h1>Welcome, {{payload.name}}</h1>
<p>Thank you for joining {{company}}.</p>
```

---

## Context Customization

Modify the email context dynamically with the `context` function:

```typescript
import createPlugin, { EmailUserContext } from "@tsdiapi/email";

createPlugin({
  context: async (ctx: EmailUserContext<any>) => {
    ctx.payload.company = "My Dynamic Company";
    return ctx;
  },
});
```

---

## Features

- **Multiple Providers**: Switch between SendGrid and Nodemailer easily.
- **Environment Configuration**: Use `.env` variables for better control.
- **Templating**: Dynamic email content through **Handlebars** templates.
- **Type-Safe**: Strongly-typed options and payloads.

---

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.