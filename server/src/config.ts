import path from 'node:path';

/**
 * All runtime settings come from environment variables so the service can move
 * between Railway accounts (or any Node host) without code changes.
 * See server/.env.example and docs/BACKEND.md.
 */
export type Config = {
  port: number;
  production: boolean;
  dataDir: string;
  allowedOrigins: string[];
  publicApiUrl: string;
  siteUrl: string;
  adminUrl: string;
  bootstrapOwner: { username: string; email: string; passwordHash: string } | null;
  smtp: { host: string; port: number; user: string; pass: string; from: string } | null;
  /** HTTPS mail relay (the Apps Script in server/scripts/mail-relay.gs). Used instead of SMTP when set. */
  mailRelay: { url: string; secret: string } | null;
  notifyEmails: string[];
  trustProxy: boolean;
};

/** The chapter's shared inbox: the default address for form alerts. */
export const CHAPTER_EMAIL = 'ieee@ou.edu';

function list(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const production = env.NODE_ENV === 'production';
  const dataDir = env.DATA_DIR?.trim() || (production ? '' : path.resolve('storage'));
  if (!dataDir) {
    // Railway's container filesystem is wiped on every deploy. Refuse to run
    // without the persistent volume rather than silently losing posts.
    throw new Error('DATA_DIR must point at a persistent volume (for example /data) in production.');
  }

  const owner =
    env.BOOTSTRAP_OWNER_USERNAME && env.BOOTSTRAP_OWNER_EMAIL && env.BOOTSTRAP_OWNER_PASSWORD_HASH
      ? {
          username: env.BOOTSTRAP_OWNER_USERNAME.trim().toLowerCase(),
          email: env.BOOTSTRAP_OWNER_EMAIL.trim().toLowerCase(),
          passwordHash: env.BOOTSTRAP_OWNER_PASSWORD_HASH.trim(),
        }
      : null;

  const smtp =
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
      ? {
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT || 465),
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
          from: env.SMTP_FROM || `IEEE Sooners <${env.SMTP_USER}>`,
        }
      : null;

  // Railway's Hobby plan blocks SMTP, so production email goes through an HTTPS relay.
  const relayUrl = env.MAIL_RELAY_URL?.trim() ?? '';
  const relaySecret = env.MAIL_RELAY_SECRET?.trim() ?? '';
  const mailRelay = /^https?:\/\//i.test(relayUrl) && relaySecret.length >= 16 ? { url: relayUrl, secret: relaySecret } : null;

  return {
    port: Number(env.PORT || 8080),
    production,
    dataDir,
    allowedOrigins: list(env.ALLOWED_ORIGINS || 'http://localhost:4317,http://127.0.0.1:4317'),
    publicApiUrl: (env.PUBLIC_API_URL || `http://localhost:${env.PORT || 8080}`).replace(/\/$/, ''),
    siteUrl: (env.SITE_URL || 'http://localhost:4317').replace(/\/$/, ''),
    adminUrl: env.ADMIN_URL || `${(env.SITE_URL || 'http://localhost:4317').replace(/\/$/, '')}/admin`,
    bootstrapOwner: owner,
    smtp,
    mailRelay,
    // Sponsor-application and contact-message alerts go to the chapter inbox unless overridden.
    notifyEmails: list(env.NOTIFY_EMAILS || CHAPTER_EMAIL),
    // Behind Railway's single edge proxy, the client address is the LAST X-Forwarded-For hop
    // (the one the proxy appended); earlier entries come from the client and can be forged.
    trustProxy: env.TRUST_PROXY !== 'false',
  };
}
