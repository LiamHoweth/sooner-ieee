import nodemailer from 'nodemailer';

import type { Config } from './config.js';

export type Mailer = {
  enabled: boolean;
  send: (to: string[], subject: string, text: string) => Promise<void>;
};

/**
 * Optional email (sponsor alerts, password resets) through any SMTP account.
 * The simplest setup is the chapter Gmail with an app password; see docs/BACKEND.md.
 * With no SMTP settings, email is skipped and everything else keeps working.
 */
export function createMailer(config: Config): Mailer {
  if (!config.smtp) {
    return { enabled: false, send: async () => {} };
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
    async send(to, subject, text) {
      if (to.length === 0) return;
      try {
        await transport.sendMail({ from: smtp.from, to, subject, text });
      } catch (error) {
        // Email is a convenience; never fail the request that triggered it.
        console.error('[mail] send failed:', (error as Error).message);
      }
    },
  };
}
