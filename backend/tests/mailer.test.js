const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const test = require('node:test');
const nodemailer = require('nodemailer');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

test('account templates keep routing and exact security links with a complete readable alternative', async () => {
  const original = nodemailer.createTransport;
  const sent = [];
  nodemailer.createTransport = () => ({ sendMail: async message => sent.push(message) });
  try {
    const verifyUrl = 'https://rps.example.invalid/verify?token=sample&code=123456';
    const resetUrl = 'https://rps.example.invalid/reset?token=sample&code=123456';
    await sendVerificationEmail({ to: 'recipient@example.invalid', code: '123456', verifyUrl });
    await sendPasswordResetEmail({ to: 'recipient@example.invalid', code: '123456', resetUrl });
    for (const [index, url] of [verifyUrl, resetUrl].entries()) {
      const message = sent[index];
      assert.equal(message.to, 'recipient@example.invalid');
      assert.equal(message.from, process.env.EMAIL_FROM || 'RPS <no-reply@localhost>');
      assert.equal(message.subject, index === 0 ? 'Verify your RPS account' : 'Reset your RPS password');
      for (const value of [url, '123456', '30 minutes', 'Next step', 'ignore this email']) {
        assert.ok(message.text.includes(value));
      }
      assert.ok(message.html.includes(url.replaceAll('&', '&amp;')));
      assert.ok(message.html.includes('lang="en"'));
      assert.ok(message.html.includes('If the button does not work'));
      assert.ok(message.html.includes('30 minutes'));
    }
  } finally {
    nodemailer.createTransport = original;
  }
});

test('HTML in codes or security links is escaped', async () => {
  const original = nodemailer.createTransport;
  let sent;
  nodemailer.createTransport = () => ({ sendMail: async message => { sent = message; } });
  try {
    const verifyUrl = 'https://rps.example.invalid/verify?token="<script>';
    await sendVerificationEmail({ to: 'recipient@example.invalid', code: '<script>unsafe</script>', verifyUrl });
    assert.ok(!sent.html.includes('<script>'));
    assert.ok(sent.html.includes('&quot;&lt;script&gt;'));
    assert.ok(sent.text.includes(verifyUrl));
  } finally {
    nodemailer.createTransport = original;
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
