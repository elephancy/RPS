const nodemailer = require('nodemailer');

// Presentation and delivery policy are supplied by the mounted Ops release.
// Load lazily so builds and non-mail application paths do not require secrets.
function notifier() {
  const { createNotifier } = require('/run/ops/shared-notifications/node/index.cjs');
  return createNotifier({ createTransport: options => nodemailer.createTransport(options) });
}

function notificationStatus() {
  try {
    return notifier().status();
  } catch {
    return { configured: false, project: null, mode: null, contractVersion: 1 };
  }
}

async function sendVerificationEmail({ to, code, verifyUrl, expiresAt }) {
  return notifier().sendAccount({
    kind: 'verify-email', to, code, actionUrl: verifyUrl, expiresAt,
  });
}

async function sendPasswordResetEmail({ to, code, resetUrl, expiresAt }) {
  return notifier().sendAccount({
    kind: 'reset-password', to, code, actionUrl: resetUrl, expiresAt,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, notificationStatus };
