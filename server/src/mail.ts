import nodemailer from 'nodemailer';

import type { Config } from './config.js';

export type Mailer = {
  enabled: boolean;
  /** Resolves true when the message was handed to SMTP; never rejects for a failed send. */
  send: (to: string[], subject: string, text: string, options?: { replyTo?: string }) => Promise<boolean>;
};

/**
 * Optional email (sponsor and contact alerts, password resets, invites) through any SMTP account.
 * The simplest setup is the chapter Gmail with an app password; see docs/BACKEND.md.
 * With no SMTP settings, email is skipped and everything else keeps working.
 */
export function createMailer(config: Config): Mailer {
  if (!config.smtp) {
    return { enabled: false, send: async () => false };
  }
  const smtp = config.smtp;
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return {
    enabled: true,
    async send(to, subject, text, options = {}) {
      if (to.length === 0) return false;
      try {
        await transport.sendMail({ from: smtp.from, to, subject, text, replyTo: options.replyTo });
        return true;
      } catch (error) {
        // Email is a convenience; never fail the request that triggered it.
        console.error('[mail] send failed:', (error as Error).message);
        return false;
      }
    },
  };
}
