import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { matchRoutes } from 'react-router-dom';
import { appRoutes } from '../src/config/appRoutes.mjs';
import { pages, accountPaths } from '../src/seoMetadata.mjs';

const origin = process.env.RPS_SMOKE_ORIGIN ?? 'http://127.0.0.1:18765';
const browser = await chromium.launch({ executablePath: process.env.RPS_CHROME_PATH || undefined });
try {
  const context = await browser.newContext();
  // No live accounts or API writes: these checks exercise the production bundle
  // and router, with unavailable public profiles supplied by a local stub.
  await context.route('**/api/**', route => route.fulfill({ status: 404, json: {} }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checkMetadata = async path => {
    const url = new URL(origin + path);
    const match = matchRoutes(appRoutes, url.pathname)?.at(-1)?.route;
    const route = match && !match.public ? '/login' : match?.path;
    await page.waitForFunction(({ title, canonical, noindex }) =>
      document.title === title
      && (document.querySelector('link[rel="canonical"]')?.href ?? null) === canonical
      && (document.querySelector('meta[name="robots"]')?.content ?? null) === noindex,
    {
      title: pages[route]?.[0] ?? (route ? pages['/'][0] : 'Page not found | RPS Arcade'),
      canonical: pages[route] ? `https://rps.elfeel.me${route}` : null,
      noindex: !route || accountPaths.has(route) ? 'noindex,follow' : null,
    });
    if (!route) await page.getByRole('heading', { name: 'Page not found', exact: true }).waitFor();
    else assert.equal(await page.getByRole('heading', { name: 'Page not found', exact: true }).count(), 0, path);
    if (match && !match.public) {
      assert.equal(new URL(page.url()).pathname, '/login', path);
      const from = await page.evaluate(() => history.state.usr.from);
      assert.equal(from.pathname, url.pathname, path);
      assert.equal(from.search, url.search, path);
    }
  };
  const directPaths = [
    '/RULES///?source=seo', '/ru%6Ces', '/LOGIN/', '/profile/alice%2Fbob',
    '/%70rofile/%C3%BC', '/profile/%F0%9F%8E%AE', '/profile/%C0%AF',
    '/missing?source=seo', '/profile/alice/bob', '/%70rofile/%C0%AF',
    '/GAMES/VIRTUAL-PET///?source=seo',
    '/profile/..%2Fassets%2Fbrand%2Flogo.ico', '/profile/..%2F_seo%2Frules.html',
    ...appRoutes.filter(route => !route.public).map(route => route.path),
  ];
  for (const path of directPaths) {
    const response = await page.goto(origin + path);
    const route = matchRoutes(appRoutes, new URL(origin + path).pathname);
    assert.equal(response.status(), route ? 200 : 404, path);
    await checkMetadata(path);
  }
  // Exercise client history changes without a document request, including paths
  // that the HTTP parser rejects but React Router can still encounter in-app.
  await page.goto(origin + '/rules');
  for (const path of ['/missing', '/LOGIN/', '/profile/alice%2Fbob', '/profile/%ZZ',
    '/%70rofile/%ZZ', '/%70rofile/%00', '/%70rofile/%C3%BC', '/RULES///?x=1']) {
    await page.evaluate(path => {
      history.pushState({}, '', path);
      dispatchEvent(new PopStateEvent('popstate'));
    }, path);
    await checkMetadata(path);
  }
  await page.evaluate(() => {
    history.pushState({}, '', '/missing');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await checkMetadata('/missing');
  await page.getByRole('link', { name: 'Back home', exact: true }).click();
  await checkMetadata('/');
  await page.goBack();
  await checkMetadata('/missing');
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(`Production browser routes, auth redirects and client navigation verified (${directPaths.length} direct paths).`);
} finally {
  await browser.close();
}
