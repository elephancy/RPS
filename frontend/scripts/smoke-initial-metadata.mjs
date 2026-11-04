import assert from 'node:assert/strict';

const origin = process.env.RPS_SMOKE_ORIGIN ?? 'http://127.0.0.1:18765';
for (const [path, title] of [
  ['/', 'RPS | Arcade Games and Collections'],
  ['/rules', 'Game Rules | RPS Arcade'],
  ['/privacy', 'Privacy Policy | RPS Arcade'],
  ['/cookies', 'Cookie Policy | RPS Arcade'],
]) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get('content-security-policy'), path);
  assert.ok(html.includes(`<title>${title}</title>`), path);
  assert.ok(html.includes(`rel="canonical" href="https://rps.elfeel.me${path}"`), path);
}
for (const path of ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password']) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes('name="robots" content="noindex,follow"'), path);
  assert.ok(!html.includes('rel="canonical"'), path);
}
const fallback = await (await fetch(origin + '/profile/example')).text();
assert.ok(!fallback.includes('rel="canonical"') && !fallback.includes('name="robots"'));
assert.equal((await fetch(origin + '/_seo/rules.html')).status, 404);
console.log('Initial route metadata and Nginx fallback verified.');
