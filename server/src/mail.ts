import nodemailer from 'nodemailer';

import type { Config } from './config.js';

export type Mailer = {
  enabled: boolean;
  /** Resolves true when the message was handed to SMTP; never rejects for a failed send. */
  send: (to: string[], subject: string, text: string, options?: { replyTo?: string }) => Promise<boolean>;
};

/**
 * Optional email (sponsor and contact alerts, password resets, invites).
 * - MAIL_RELAY_URL/SECRET: an HTTPS relay, the Apps Script in server/scripts/mail-relay.gs running
 *   under the chapter Gmail. Use this on Railway's Hobby plan, which blocks SMTP.
 * - SMTP_*: any SMTP account, for hosts (or Railway plans) that allow it.
 * See docs/BACKEND.md → Email. With neither, email is skipped and everything else keeps working.
 */
export function createMailer(config: Config): Mailer {
  if (config.mailRelay) return createRelayMailer(config.mailRelay);
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

const RELAY_TIMEOUT_MS = 15_000;

/** Posts each message as JSON to the relay, which sends it from the chapter Gmail. */
function createRelayMailer(relay: { url: string; secret: string }): Mailer {
  return {
    enabled: true,
    async send(to, subject, text, options = {}) {
      if (to.length === 0) return false;
      try {
        const res = await fetch(relay.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: relay.secret, to, subject, text, replyTo: options.replyTo ?? '' }),
          // Apps Script answers through a redirect to googleusercontent.com.
          redirect: 'follow',
          signal: AbortSignal.timeout(RELAY_TIMEOUT_MS),
        });
        const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!res.ok || result?.ok !== true) {
          console.error('[mail] relay refused:', res.status, result?.error ?? 'no JSON reply');
          return false;
        }
        return true;
      } catch (error) {
        // Email is a convenience; never fail the request that triggered it.
        console.error('[mail] relay failed:', (error as Error).message);
        return false;
      }
    },
  };
}
