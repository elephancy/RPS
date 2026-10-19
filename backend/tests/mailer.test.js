const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const net = require('node:net');
const { once } = require('node:events');
const test = require('node:test');
const nodemailer = require('nodemailer');
const { sendVerificationEmail, sendPasswordResetEmail, notificationStatus } = require('../utils/mailer');
const runtimePath = '/run/ops/shared-notifications/node/index.cjs';

async function withRuntime(runtime, run) {
  const original = Module._load;
  Module._load = function(request, ...args) {
    if (request === runtimePath) return runtime;
    return original.call(this, request, ...args);
  };
  try { return await run(); } finally { Module._load = original; }
}

test('account adapter forwards exact security data and delegates all mail policy', async () => {
  const events = [];
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await withRuntime({ createNotifier: options => {
    assert.deepEqual(Object.keys(options), ['createTransport']);
    assert.equal(typeof options.createTransport, 'function');
    return { sendAccount: async event => { events.push(event); return {mode: 'smtp'}; } };
  } }, async () => {
    assert.deepEqual(await sendVerificationEmail({to:'recipient@example.invalid', code:'123456', verifyUrl:'https://rps.example.invalid/verify-email?token=sample', expiresAt}), {mode:'smtp'});
    await sendPasswordResetEmail({to:'recipient@example.invalid', code:'654321', resetUrl:'https://rps.example.invalid/reset-password?token=sample', expiresAt});
  });
  assert.deepEqual(events, [
    {kind:'verify-email', to:'recipient@example.invalid', code:'123456', actionUrl:'https://rps.example.invalid/verify-email?token=sample', expiresAt},
    {kind:'reset-password', to:'recipient@example.invalid', code:'654321', actionUrl:'https://rps.example.invalid/reset-password?token=sample', expiresAt},
  ]);
});

test('status is nonthrowing with unavailable mounts and does not probe SMTP', async () => {
  await withRuntime({createNotifier: () => { throw new Error('unavailable'); }}, async () => {
    assert.equal(notificationStatus().configured, false);
    await assert.rejects(sendVerificationEmail({to:'recipient@example.invalid', verifyUrl:'https://rps.example.invalid/verify-email'}), /unavailable/);
  });
  await withRuntime({createNotifier: () => ({status: () => ({configured:true, project:'rps', mode:'smtp', contractVersion:1})})}, async () => {
    assert.deepEqual(notificationStatus(), {configured:true, project:'rps', mode:'smtp', contractVersion:1});
  });
});

test('delivery failure remains a failure without app fallback', async () => {
  const failure = Object.assign(new Error('Ops notification could not be completed.'), {code:'OPS_NOTIFY_DELIVERY_FAILED'});
  await withRuntime({createNotifier: () => ({sendAccount: async () => {throw failure;}})}, async () => {
    await assert.rejects(sendPasswordResetEmail({to:'recipient@example.invalid', resetUrl:'https://rps.example.invalid/reset-password'}), error => error === failure);
  });
});

test('real Ops bundle owns composition, TLS, sender and protected profile rotation', {skip: !process.env.RPS_NOTIFICATION_TEST_BUNDLE && 'Set RPS_NOTIFICATION_TEST_BUNDLE to a generated Ops bundle for cross-repository integration'}, async () => {
  const bundleRoot = path.resolve(process.env.RPS_NOTIFICATION_TEST_BUNDLE);
  const sdk = require(path.join(bundleRoot, 'node/index.cjs'));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rps-notification-contract-'));
  const profilePath = path.join(directory, 'profile.json');
  const profile = {schemaVersion:1, project:'rps', mode:'smtp', publicBaseUrl:'https://rps.example.invalid', smtp:{host:'smtp.example.invalid',port:587,username:'fixture-user',password:'fixture-only',from:'Ops Fixture <sender@example.invalid>',tlsMode:'opportunistic'}};
  const saveProfile = () => fs.writeFileSync(profilePath, JSON.stringify(profile), {mode:0o640});
  const originalTransport = nodemailer.createTransport;
  const sent = [], transports = [];
  nodemailer.createTransport = options => {
    transports.push(options);
    return {sendMail: async message => sent.push(message), close() {}};
  };
  const runtime = {createNotifier: options => sdk.createNotifier({...options,profilePath,bundleRoot})};
  try {
    saveProfile();
    await withRuntime(runtime, async () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const verifyUrl = 'https://rps.example.invalid/verify-email?token=sample&code=123456';
      const resetUrl = 'https://rps.example.invalid/reset-password?token=sample&code=654321';
      await sendVerificationEmail({to:'recipient@example.invalid',code:'123456',verifyUrl,expiresAt});
      await sendPasswordResetEmail({to:'recipient@example.invalid',code:'654321',resetUrl,expiresAt});
      assert.equal(transports[0].secure, false);
      assert.equal(transports[0].requireTLS, false);
      assert.equal(transports[0].ignoreTLS, false);
      for (const [index,url] of [verifyUrl,resetUrl].entries()) {
        const message = sent[index];
        assert.equal(message.to,'recipient@example.invalid');
        assert.equal(message.from,profile.smtp.from);
        assert.equal(message.subject,index === 0 ? 'Verify your RPS account' : 'Reset your RPS password');
        for (const value of [url,index === 0 ? '123456' : '654321','30 minutes','Next step','ignore this email']) assert.ok(message.text.includes(value));
        assert.ok(message.html.includes(url.replaceAll('&','&amp;')));
        assert.ok(message.html.includes('cid:ops-elephant'));
        assert.equal(message.attachments[0].contentType,'image/png');
      }
      profile.smtp.tlsMode = 'implicit'; profile.smtp.port = 465; saveProfile();
      await sendVerificationEmail({to:'recipient@example.invalid',code:'<script>unsafe</script>',verifyUrl,expiresAt});
      assert.equal(transports[2].secure,true);
      assert.ok(!sent[2].html.includes('<script>'));
      profile.smtp.tlsMode = 'starttls'; profile.smtp.port = 587; saveProfile();
      await sendPasswordResetEmail({to:'recipient@example.invalid',resetUrl,expiresAt});
      assert.equal(transports[3].requireTLS,true);
      nodemailer.createTransport = () => ({sendMail: async () => {throw new Error('fixture provider secret');}});
      await assert.rejects(sendPasswordResetEmail({to:'recipient@example.invalid',resetUrl,expiresAt}), error => error.code === 'OPS_NOTIFY_DELIVERY_FAILED' && !error.message.includes('secret'));
      fs.unlinkSync(profilePath);
      assert.equal(notificationStatus().configured,false);
    });
  } finally {
    nodemailer.createTransport = originalTransport;
    fs.rmSync(directory,{recursive:true,force:true});
  }
});

test('SMTP health verification works with the patched transporter API', async () => {
  const commands = [];
  const server = net.createServer(socket => {
    socket.setEncoding('utf8');
    socket.write('220 localhost SMTP test\r\n');
    let pending = '';
    socket.on('data', chunk => {
      pending += chunk;
      let boundary;
      while ((boundary = pending.indexOf('\r\n')) !== -1) {
        const command = pending.slice(0, boundary);
        pending = pending.slice(boundary + 2);
        commands.push(command.split(' ')[0]);
        if (command.startsWith('EHLO') || command.startsWith('HELO')) {
          socket.write('250 localhost\r\n');
        } else if (command === 'QUIT') {
          socket.end('221 goodbye\r\n');
        } else {
          socket.write('500 unsupported test command\r\n');
        }
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: server.address().port,
    secure: false,
    ignoreTLS: true,
    connectionTimeout: 2000,
    greetingTimeout: 2000,
    socketTimeout: 2000,
  });
  try {
    assert.equal(await transporter.verify(), true);
    assert.ok(commands.includes('EHLO'));
  } finally {
    transporter.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('mail composition preserves sender, recipient and text without a provider', async () => {
  const transporter = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const message = await transporter.sendMail({
    from: 'RPS <sender@example.invalid>',
    to: 'recipient@example.invalid',
    subject: 'Local compatibility check',
    text: 'This message never leaves the test process.',
  });
  assert.deepEqual(message.envelope.to, ['recipient@example.invalid']);
  assert.match(message.message.toString(), /Subject: Local compatibility check/);
  assert.match(message.message.toString(), /This message never leaves the test process\./);
});
