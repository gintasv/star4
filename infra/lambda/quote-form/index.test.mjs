/**
 * Tests for the quote form handler.
 *
 *   node --test infra/lambda/quote-form/
 *
 * The AWS SDK is stubbed via a module mock, so nothing here sends real mail or
 * needs credentials. What is under test is the part that would actually hurt if
 * it were wrong: origin enforcement, bot screening, and the sanitisation that
 * stops submitted text reaching an email as header content.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Every SendEmailCommand the handler tried to send. */
const sent = [];

before(() => {
  process.env.NOTIFY_EMAIL = 'martin@example.com';
  process.env.SENDER_IDENTITY = 'no-reply@star4construction.com';
  process.env.ALLOWED_ORIGIN = 'https://star4construction.com';

  // Intercept the module load rather than seeding require.cache: the AWS SDK
  // is provided by the Lambda runtime and is not installed here, so
  // require.resolve would throw before the stub could be registered.
  const stub = {
    SESClient: class {
      async send(command) {
        sent.push(command.input);
        return {};
      }
    },
    SendEmailCommand: class {
      constructor(input) {
        this.input = input;
      }
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request, ...rest) {
    if (request === '@aws-sdk/client-ses') return stub;
    return originalLoad.call(this, request, ...rest);
  };
});

const load = () => require('./index.js');

const ORIGIN = 'https://star4construction.com';

const post = (body, origin = ORIGIN) => ({
  headers: { origin },
  requestContext: { http: { method: 'POST' } },
  body: JSON.stringify(body),
});

const valid = {
  name: 'Jane Homeowner',
  phone: '630-555-0100',
  message: 'Refinish the oak floors in two bedrooms.',
  loadedAt: 0,
};

describe('quote form handler', () => {
  test('rejects a non-POST method', async () => {
    const { handler } = load();
    const res = await handler({
      headers: { origin: ORIGIN },
      requestContext: { http: { method: 'GET' } },
    });
    assert.equal(res.statusCode, 405);
  });

  test('answers the CORS preflight', async () => {
    const { handler } = load();
    const res = await handler({
      headers: { origin: ORIGIN },
      requestContext: { http: { method: 'OPTIONS' } },
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.headers['Access-Control-Allow-Origin'], ORIGIN);
  });

  test('rejects a foreign origin', async () => {
    const { handler } = load();
    const res = await handler(post(valid, 'https://evil.example'));
    assert.equal(res.statusCode, 403);
  });

  test('accepts the www origin', async () => {
    const { handler } = load();
    const res = await handler(post(valid, 'https://www.star4construction.com'));
    assert.equal(res.statusCode, 200);
  });

  test('rejects malformed JSON', async () => {
    const { handler } = load();
    const res = await handler({
      headers: { origin: ORIGIN },
      requestContext: { http: { method: 'POST' } },
      body: '{not json',
    });
    assert.equal(res.statusCode, 400);
  });

  test('requires name, phone and message', async () => {
    const { handler } = load();
    for (const missing of ['name', 'phone', 'message']) {
      const body = { ...valid };
      delete body[missing];
      const res = await handler(post(body));
      assert.equal(res.statusCode, 400, `expected 400 when ${missing} is absent`);
    }
  });

  test('silently drops a submission that fills the honeypot', async () => {
    const { handler } = load();
    const before = sent.length;
    const res = await handler(post({ ...valid, website: 'http://spam.example' }));
    assert.equal(res.statusCode, 204);
    assert.equal(sent.length, before, 'no mail should be sent');
  });

  test('silently drops a submission made within two seconds', async () => {
    const { handler } = load();
    const before = sent.length;
    const res = await handler(post({ ...valid, loadedAt: Date.now() }));
    assert.equal(res.statusCode, 204);
    assert.equal(sent.length, before, 'no mail should be sent');
  });

  test('strips CR and LF from single-line fields', async () => {
    const { handler } = load();
    await handler(
      post({
        ...valid,
        name: 'Jane\r\nBcc: attacker@evil.example',
        phone: '630-555-0100\nX-Injected: yes',
      }),
    );

    const mail = sent.at(-1);
    assert.ok(!mail.Message.Subject.Data.includes('\n'), 'subject must be one line');
    assert.ok(!mail.Message.Subject.Data.includes('\r'), 'subject must be one line');

    const body = mail.Message.Body.Text.Data;
    const phoneLine = body.split('\n').find((l) => l.startsWith('Phone:'));
    assert.equal(phoneLine, 'Phone:   630-555-0100X-Injected: yes');
  });

  test('keeps newlines in the message body', async () => {
    const { handler } = load();
    await handler(post({ ...valid, message: 'Line one.\r\nLine two.\n\n\n\nLine three.' }));

    const body = sent.at(-1).Message.Body.Text.Data;
    assert.ok(body.includes('Line one.\nLine two.'), 'newlines should survive');
    assert.ok(!body.includes('\n\n\n'), 'long blank runs should collapse');
    assert.ok(!body.includes('\r'), 'CR should be normalised away');
  });

  test('sets Reply-To to the customer when an email is supplied', async () => {
    const { handler } = load();
    await handler(post({ ...valid, email: 'jane@example.com' }));
    assert.deepEqual(sent.at(-1).ReplyToAddresses, ['jane@example.com']);
  });

  test('omits Reply-To when no email is supplied', async () => {
    const { handler } = load();
    await handler(post(valid));
    assert.equal(sent.at(-1).ReplyToAddresses, undefined);
  });

  test('truncates an oversized message', async () => {
    const { handler } = load();
    await handler(post({ ...valid, message: 'x'.repeat(9000) }));
    const body = sent.at(-1).Message.Body.Text.Data;
    const xs = (body.match(/x+/g) ?? [''])[0];
    assert.equal(xs.length, 3000);
  });

  test('sends to the configured address from the configured identity', async () => {
    const { handler } = load();
    await handler(post(valid));
    const mail = sent.at(-1);
    assert.deepEqual(mail.Destination.ToAddresses, ['martin@example.com']);
    assert.ok(mail.Source.includes('no-reply@star4construction.com'));
  });
});


