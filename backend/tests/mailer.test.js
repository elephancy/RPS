const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const test = require('node:test');
const nodemailer = require('nodemailer');

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
