/**
 * Quote form handler - the canonical source.
 *
 * This file is the only copy. infra/build-template.mjs splices it into
 * site-stack.yaml at deploy time, so the deployed code and this file cannot
 * drift apart.
 *
 * CommonJS on purpose: CloudFormation inline `ZipFile` code is written to
 * index.js with no package.json, so the runtime loads it as CommonJS.
 * The AWS SDK v3 ships inside the nodejs22.x runtime, so there is nothing to
 * bundle or upload.
 *
 * Behaviour: validate, screen out bots, send one plain-text email via SES.
 * Nothing is persisted anywhere.
 */
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({});

const NOTIFY = process.env.NOTIFY_EMAIL;
const SENDER = process.env.SENDER_IDENTITY;
const ORIGIN = process.env.ALLOWED_ORIGIN;

/** Apex and www are both legitimate origins for the same site. */
const allowedOrigins = () => [ORIGIN, ORIGIN.replace('https://', 'https://www.')];

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '3600',
});

const reply = (statusCode, body, origin) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  body: JSON.stringify(body),
});

// Written as escape sequences and never as literal control bytes: this file is
// spliced into a YAML document, where a raw control character would corrupt the
// template.
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;
const CONTROL_EXCEPT_NEWLINE = /[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]/g;

/**
 * Single-line fields. Strips every control character, CR and LF included,
 * because those are the header-injection vector once a value reaches an email.
 */
const clean = (value, max) =>
  String(value ?? '')
    .replace(CONTROL_CHARS, '')
    .trim()
    .slice(0, max);

/**
 * The message is a textarea, so newlines are content rather than a threat.
 * Normalise line endings, keep LF, drop every other control character, and
 * collapse long runs of blank lines so a pasted block cannot pad the email.
 */
const cleanMultiline = (value, max) =>
  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_EXCEPT_NEWLINE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

/** Subject lines must stay on one line regardless of what was submitted. */
const subjectSafe = (value) => clean(value, 120).replace(/\s+/g, ' ');

exports.handler = async (event) => {
  const requestOrigin = event.headers?.origin ?? '';
  const allowed = allowedOrigins();
  const origin = allowed.includes(requestOrigin) ? requestOrigin : ORIGIN;

  const method = event.requestContext?.http?.method;
  if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin) };
  if (method !== 'POST') return reply(405, { error: 'Method not allowed' }, origin);
  if (!allowed.includes(requestOrigin)) return reply(403, { error: 'Forbidden' }, origin);

  let data;
  try {
    data = JSON.parse(event.body ?? '{}');
  } catch {
    return reply(400, { error: 'Invalid JSON' }, origin);
  }

  // Honeypot: a person never fills in a field they cannot see. Answer 204 so
  // the bot reads it as success and does not retry with a different shape.
  if (clean(data.website, 200)) return reply(204, {}, origin);

  // Time trap: nobody reads and completes this form inside two seconds.
  const loadedAt = Number(data.loadedAt);
  if (Number.isFinite(loadedAt) && loadedAt > 0 && Date.now() - loadedAt < 2000) {
    return reply(204, {}, origin);
  }

  const name = clean(data.name, 120);
  const phone = clean(data.phone, 40);
  const message = cleanMultiline(data.message, 3000);

  if (!name || !phone || !message) {
    return reply(400, { error: 'Name, phone and message are required.' }, origin);
  }

  const email = clean(data.email, 160);
  const service = clean(data.service, 80);
  const city = clean(data.city, 80);

  const body = [
    `Name:    ${name}`,
    `Phone:   ${phone}`,
    `Email:   ${email || '(not given)'}`,
    `Service: ${service || '(not specified)'}`,
    `Town:    ${city || '(not specified)'}`,
    '',
    'Message:',
    message,
    '',
    '--',
    'Sent by the Star 4 Construction website quote form.',
  ].join('\n');

  const subject = subjectSafe(`Website enquiry: ${name}${city ? ` (${city})` : ''}`);

  try {
    await ses.send(
      new SendEmailCommand({
        Source: `Star 4 Construction Website <${SENDER}>`,
        Destination: { ToAddresses: [NOTIFY] },
        // Replying reaches the customer, not the unattended sender address.
        ReplyToAddresses: email ? [email] : undefined,
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }),
    );
  } catch (err) {
    // Logged to CloudWatch, but SES internals never reach the browser.
    console.error('SES send failed', err);
    return reply(502, { error: 'Could not send the message.' }, origin);
  }

  return reply(200, { ok: true }, origin);
};
