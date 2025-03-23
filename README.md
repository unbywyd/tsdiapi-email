# **@tsdiapi/email: Email Plugin for TSDIAPI-Server**

The **@tsdiapi/email** plugin provides seamless email integration for **TSDIAPI-Server** applications. It supports both **Nodemailer** and **SendGrid**, enabling flexibility in email delivery.

With the latest update, the plugin is now **usable both as a TSDIAPI plugin and as a standalone package**, allowing developers to integrate email functionality in different contexts.

---

## **Installation**

### Install via NPM
```sh
npm install @tsdiapi/email
```

### Or Add via CLI
```sh
tsdiapi plugins add email
```

---

## **Usage**

### **Registering the Plugin in TSDIAPI**

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

### **Alternatively, configure via ENV variables**

```env
# Use SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=no-reply@example.com

# Or use SMTP (Nodemailer)
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
```

---

## **Sending Emails**

The plugin exposes a **global provider**, allowing you to send emails from anywhere after initialization.

### **Sending Emails via the Global Provider**
```typescript
import { useEmailProvider } from "@tsdiapi/email";

const emailProvider = useEmailProvider();

await emailProvider.sendEmail("user@example.com", "Welcome!", "<h1>Hello!</h1>");

// Send with dynamic payload (Handlebars support)
await emailProvider.sendEmail("user@example.com", "Welcome!", "<h1>Hello, {{name}}!</h1>", { name: "John" });
```

> **Note:** Ensure that `createPlugin()` has been called before accessing `useEmailProvider()`.

---

## **Standalone Usage (Without TSDIAPI)**

The plugin can be used independently as an ES module:

```typescript
import { createEmailProvider } from "@tsdiapi/email";
import { Logger } from "winston";

const config = {
  senderEmail: "no-reply@example.com",
  provider: "nodemailer",
  smtp: {
    host: "smtp.example.com",
    port: 587,
    auth: { user: "your-smtp-user", pass: "your-smtp-pass" }
  },
  handlebarsTemplatePath: "src/templates/email.hbs"
};

async function run() {
  const logger = console as unknown as Logger;
  const emailProvider = await createEmailProvider(config, logger);

  await emailProvider.sendEmail("user@example.com", "Standalone Email", "<p>This email was sent without TSDIAPI.</p>");
}

run();
```

---

## **Handlebars Templating Support**

You can use **Handlebars** for dynamic email content by specifying a template file:

```typescript
import createPlugin from "@tsdiapi/email";

createPlugin({
  handlebarsTemplatePath: "src/templates/email.hbs",
  additionalTemplateData: { company: "My Company" }
});
```

### **Example Template (`email.hbs`):**
```hbs
<h1>Welcome, {{payload.name}}</h1>
<p>Thank you for joining {{company}}.</p>
```

---

## **Context Customization**

Modify the email context dynamically before sending:

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

## **Features**

✅ **Supports Multiple Providers** – Easily switch between **SendGrid** and **Nodemailer**.  
✅ **Global Provider Access** – Get the initialized email provider anywhere with `useEmailProvider()`.  
✅ **Standalone Usage** – Use it **with or without TSDIAPI**.  
✅ **Environment Configuration** – Load settings via `.env` variables.  
✅ **Templating with Handlebars** – Create **dynamic email templates**.  
✅ **Type-Safe** – Fully typed configuration and email payloads.

---

## **License**

This library is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

### **What’s New?**
- **Global Access with `useEmailProvider()`** – No more manually binding functions.
- **Dual Usage** – Works inside **TSDIAPI** or as a standalone module.
- **Better Configuration Handling** – ENV support and **default settings**.

🚀 **Ready to send emails the right way?** Start using **@tsdiapi/email** today!