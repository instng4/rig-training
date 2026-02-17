import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Email provider abstraction for flexibility
export interface EmailProvider {
  send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ success: boolean; error?: string }>;
}

// SMTP implementation using nodemailer
class SmtpProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.senderEmail = process.env.SMTP_SENDER_EMAIL || 'noreply@example.com';
    this.senderName = process.env.SMTP_SENDER_NAME || 'RTMS';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async send(params: { to: string; subject: string; html: string }) {
    try {
      await this.transporter.sendMail({
        from: `${this.senderName} <${this.senderEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return { success: true };
    } catch (error) {
      console.error('SMTP send error:', error);
      return { success: false, error: String(error) };
    }
  }
}

// Resend implementation
class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(params: { to: string; subject: string; html: string }) {
    try {
      await this.client.emails.send({
        from: 'RTMS <noreply@yourdomain.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: String(error) };
    }
  }
}

// Console provider for development
class ConsoleProvider implements EmailProvider {
  async send(params: { to: string; subject: string; html: string }) {
    console.log('=== Email ===');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('Body:', params.html);
    console.log('=============');
    return { success: true };
  }
}

// Factory function to get the appropriate provider
export function getEmailProvider(): EmailProvider {
  // Prefer SMTP if configured
  if (process.env.SMTP_HOST) {
    return new SmtpProvider();
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    return new ResendProvider(apiKey);
  }
  
  console.warn('No email provider configured, using console provider');
  return new ConsoleProvider();
}

// Template variable replacement
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Text to HTML conversion for email body
export function textToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => `<p>${line || '&nbsp;'}</p>`)
    .join('');
}

