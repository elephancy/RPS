const nodemailer = require('nodemailer');

function getFrontendOrigin() {
  const fallback = 'http://localhost:3000';
  const raw = process.env.FRONTEND_URL || process.env.EMAIL_VERIFY_BASE_URL || fallback;
  try {
    return new URL(raw).origin;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function accountMessage({ verification, code, url }) {
  const title = verification ? 'Verify your email' : 'Reset your password';
  const summary = verification
    ? 'Welcome to RPS. Confirm your email address to finish creating your account.'
    : 'We received a request to reset your RPS password.';
  const action = verification ? 'Verify account' : 'Reset password';
  const codeLabel = verification ? 'Verification code' : 'Reset code';
  const nextStep = verification
    ? 'Open the link below, or enter the six-digit code on the RPS verification page.'
    : 'Open the link below, or enter the reset code in RPS to choose a new password. Your current password stays in place until you change it.';
  const security = verification
    ? 'If you did not create an RPS account, you can ignore this email. No account access is granted until the email is verified. Do not share this link or code with anyone.'
    : 'If you did not request a password reset, ignore this email. Do not share this link or code with anyone.';
  const safeUrl = escapeHtml(url);
  const safeLogoUrl = escapeHtml(`${getFrontendOrigin()}/assets/brand/logo.png`);
  return {
    text: ['RPS / Risk Paper Scammers', title, '', summary, '', 'Next step', nextStep,
      url, '', `${codeLabel}: ${code}`, 'This code expires in 30 minutes.', '', security].join('\n'),
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f5f8;color:#172234;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
<div style="display:none;max-height:0;overflow:hidden">${summary}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dce2ea;border-radius:16px">
<tr><td style="padding:26px 32px 20px;background:#0b1730;border-radius:16px 16px 0 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:14px"><img src="${safeLogoUrl}" width="52" height="52" alt="RPS elephant" style="display:block;border:0;border-radius:12px"></td><td style="color:#fff"><strong style="font-size:21px">RPS</strong><br><span style="font-size:13px;color:#c5d8f7">Risk Paper Scammers</span></td></tr></table></td></tr>
<tr><td style="padding:26px 32px 0"><h1 style="margin:0 0 16px;font-size:28px;line-height:1.25">${title}</h1><p style="margin:0 0 24px;color:#43516a">${summary}</p></td></tr>
<tr><td style="padding:0 32px 28px"><p style="margin:0 0 16px"><strong>Next step</strong><br>${nextStep}</p><a href="${safeUrl}" style="display:inline-block;padding:13px 22px;background:#174b9d;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px">${action}</a>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#edf3fc;border:1px solid #c7d8f2;border-radius:8px"><tr><td style="padding:16px 20px"><strong>${codeLabel}</strong><br><span style="display:inline-block;margin:8px 0;font-size:32px;font-weight:bold;letter-spacing:5px">${escapeHtml(code)}</span><br><span style="font-size:13px;color:#43516a">This code expires in 30 minutes.</span></td></tr></table>
<p style="margin:0;color:#43516a;font-size:13px">If the button does not work, copy this link into your browser:<br><a href="${safeUrl}" style="color:#124dac;word-break:break-all">${safeUrl}</a></p></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #dce2ea;color:#5b6678;font-size:13px">${security}</td></tr>
</table></td></tr></table></body></html>`,
  };
}

async function sendVerificationEmail({ to, code, verifyUrl }) {
  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'RPS <no-reply@localhost>', to,
    subject: 'Verify your RPS account',
    ...accountMessage({ verification: true, code, url: verifyUrl }),
  });
}

async function sendPasswordResetEmail({ to, code, resetUrl }) {
  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'RPS <no-reply@localhost>', to,
    subject: 'Reset your RPS password',
    ...accountMessage({ verification: false, code, url: resetUrl }),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
