import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { accountPaths, pages } from '../src/seoMetadata.mjs';

const shell = await readFile('build/index.html', 'utf8');
const title = /<title>[^<]*<\/title>/g;
const description = /<meta name="description" content="[^"]*"\s*\/?>/g;
if ([...shell.matchAll(title)].length !== 1 || [...shell.matchAll(description)].length !== 1) {
  throw new Error('Expected one title and description in the built shell');
}
if (/<link\b[^>]*rel="canonical"|<meta\b[^>]*name="robots"/i.test(shell)) {
  throw new Error('Built shell unexpectedly contains canonical or robots metadata');
}

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
await mkdir('build/_seo', { recursive: true });
for (const path of [...Object.keys(pages), ...accountPaths]) {
  const [pageTitle, pageDescription] = pages[path] ?? pages['/'];
  const directive = pages[path]
    ? `<link rel="canonical" href="https://rps.elfeel.me${path}" />`
    : '<meta name="robots" content="noindex,follow" />';
  const html = shell.replace(title, `<title>${escape(pageTitle)}</title>`)
    .replace(description, `<meta name="description" content="${escape(pageDescription)}" />\n    ${directive}`);
  await writeFile(`build/_seo/${path === '/' ? 'home' : path.slice(1)}.html`, html);
}
