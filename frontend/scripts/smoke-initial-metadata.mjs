import assert from 'node:assert/strict';
import { matchRoutes } from 'react-router-dom';
import { appRoutes } from '../src/config/appRoutes.mjs';
import { pages, accountPaths } from '../src/seoMetadata.mjs';
import { routeCases, transportRejectedCases } from './route-cases.mjs';

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
for (const path of ['/assets/seo-missing.js', '/assets/seo-missing.css', '/assets/seo-missing.png', '/sounds/seo-missing.mp3']) {
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(origin + path, { method });
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.ok(response.headers.get('content-security-policy'), path);
  }
}
for (const path of ['/assets/brand/logo.ico', '/favicon.ico', '/favicon.svg', '/site.webmanifest', '/robots.txt', '/sitemap.xml', '/sounds/cash-register.mp3']) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  assert.ok(!response.headers.get('content-type').includes('text/html'), path);
}
console.log('Initial route metadata and Nginx fallback verified.');

// Nginx's existing public-file normalization is a separate boundary from app
// routing. These paths have no React route, but serve real non-HTML resources.
for (const resource of ['/favicon.ico', '/assets/brand/logo.ico', '/sounds/cash-register.mp3', '/robots.txt']) {
  const alias = '/unknown/..%2F' + resource.slice(1).replaceAll('/', '%2F');
  assert.equal(matchRoutes(appRoutes, alias), null, alias);
  const canonical = await fetch(origin + resource);
  const canonicalBytes = Buffer.from(await canonical.arrayBuffer());
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(origin + alias, { method });
    assert.equal(response.status, 200, `${method} ${alias}`);
    assert.equal(response.headers.get('content-type'), canonical.headers.get('content-type'), alias);
    assert.ok(!response.headers.get('content-type').includes('text/html'), alias);
    assert.ok(response.headers.get('content-security-policy'), alias);
    if (method === 'GET') assert.deepEqual(Buffer.from(await response.arrayBuffer()), canonicalBytes, alias);
  }
}
for (const alias of ['/unknown/..%2Fassets%2Fseo-missing.js', '/unknown/..%2F_seo%2Frules.html', '/unknown/..%2F_rps-app-shell']) {
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(origin + alias, { method });
    assert.equal(response.status, 404, `${method} ${alias}`);
    if (method === 'GET') assert.ok((await response.text()).includes('name="robots" content="noindex,follow"'), alias);
  }
}
console.log('Public static aliases retain identical bytes/MIME types; normalized missing and internal files remain 404.');

for (const path of routeCases) {
  // URL normalizes dot segments and encodes raw Unicode before transmission,
  // just as browser navigation does. React Router sees that URL pathname.
  const url = new URL(origin + path);
  const route = matchRoutes(appRoutes, url.pathname)?.at(-1)?.route.path;
  for (const method of ['GET', 'HEAD']) {
    const response = await fetch(url, { method });
    assert.equal(response.status, transportRejectedCases.has(path) ? 400 : route ? 200 : 404,
      `${method} ${path} matched ${route}`);
    if (transportRejectedCases.has(path)) continue;
    assert.ok(response.headers.get('content-security-policy'), path);
    if (method === 'HEAD') continue;
    const html = await response.text();
    const noindex = !route || accountPaths.has(route);
    assert.equal(html.includes('name="robots" content="noindex,follow"'), noindex, path);
    assert.equal(html.includes('rel="canonical"'), Boolean(pages[route]), path);
    if (pages[route]) assert.ok(html.includes(`href="https://rps.elfeel.me${route}"`), path);
    if (!route) assert.ok(html.includes('<title>Page not found | RPS Arcade</title>'), path);
  }
}
console.log(`Nginx GET/HEAD status and metadata agree with React Router for ${routeCases.length} representative paths.`);
