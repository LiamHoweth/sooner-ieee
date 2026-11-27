/**
 * IEEE Sooners website mail relay (Google Apps Script).
 *
 * Railway's Hobby plan blocks SMTP, so the API posts each email here over HTTPS and this script
 * sends it from the Google account that owns it (the chapter Gmail). Free, no extra service.
 * Setup and handover: docs/BACKEND.md → "Email".
 *
 * Script property SECRET must equal the API's MAIL_RELAY_SECRET. Without it, nothing is sent.
 */

const MAX_RECIPIENTS = 10;
const MAX_SUBJECT = 200;
const MAX_BODY = 20000;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || body.secret !== secret) return reply({ ok: false, error: 'unauthorized' });

    const to = Array.isArray(body.to) ? body.to.filter(isEmail).slice(0, MAX_RECIPIENTS) : [];
    if (to.length === 0) return reply({ ok: false, error: 'no valid recipients' });

    const options = { name: 'IEEE Sooners website' };
    if (isEmail(body.replyTo)) options.replyTo = body.replyTo;
    MailApp.sendEmail(
      to.join(','),
      String(body.subject || 'IEEE Sooners website').slice(0, MAX_SUBJECT),
      String(body.text || '').slice(0, MAX_BODY),
      options,
    );
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: String(error) });
  }
}

/** Run this once from the editor: it asks for permission to send email and sends you a test. */
function sendTest() {
  const me = Session.getActiveUser().getEmail();
  MailApp.sendEmail(me, 'IEEE Sooners mail relay works', 'The website can now send email through this account.');
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value);
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
