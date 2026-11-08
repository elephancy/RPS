import { appRoutes } from '../src/config/appRoutes.mjs';
import { accountPaths, pages } from '../src/seoMetadata.mjs';

// React Router decodes each segment, preserving encoded slashes as part of the
// segment. If any decodeURIComponent fails, it matches the whole original path.
// Use the raw request URI: Nginx's $uri has already decoded encoded slashes.
const byte = '%[89ABab][0-9A-Fa-f]';
const decodedCharacter = [
  '[^%/?]', '%[0-7][0-9A-Fa-f]', `%(?:[Cc][2-9A-Fa-f]|[Dd][0-9A-Fa-f])${byte}`,
  `%[Ee]0%[ABab][0-9A-Fa-f]${byte}`,
  `%[Ee][1-9ABCEFabcef]${byte}${byte}`,
  `%[Ee][Dd]%[89][0-9A-Fa-f]${byte}`,
  `%[Ff]0%[9ABab][0-9A-Fa-f]${byte}${byte}`,
  `%[Ff][1-3]${byte}${byte}${byte}`,
  `%[Ff]4%8[0-9A-Fa-f]${byte}${byte}`,
].join('|');

const literal = (value) => [...value].map(character => {
  const codes = [...new Set([character.toLowerCase(), character.toUpperCase()])]
    .map(letter => `%${letter.charCodeAt(0).toString(16)}`);
  return `(?:${character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${codes.join('|')})`;
}).join('');

export function routePatterns(path) {
  // Fail closed at build time if a future route needs optional segments, splats,
  // Unicode literals or other syntax; do not silently publish a partial matcher.
  if (!/^\/(?:[a-z-]+\/)*(?:[a-z-]+|:[a-zA-Z]+)?$/.test(path)) {
    throw new Error(`Unsupported Nginx route syntax: ${path}`);
  }
  const segments = path.slice(1).split('/');
  const dynamic = segments.some(segment => segment.startsWith(':'));
  const pattern = (encoded, strict) => '/' + segments.map(segment => segment.startsWith(':')
    ? strict ? `(?:${decodedCharacter})+` : '[^/?]+'
    : encoded ? literal(segment) : segment).join('/');
  const patterns = [pattern(true, true)];
  // A malformed dynamic parameter still matches when the prefix was literal.
  if (dynamic) patterns.push(pattern(false, false));
  return patterns.map(value => `^${value}/*(?:\\?.*)?$`);
}

export function renderNginxRouteMap() {
  return '# Generated from appRoutes.mjs; do not edit.\n' + appRoutes.flatMap(({ path }) => {
    const target = pages[path] || accountPaths.has(path)
      ? `/_seo/${path === '/' ? 'home' : path.slice(1)}.html` : '/index.html';
    // Quoted map keys need escaped backslashes for the Nginx configuration lexer.
    return routePatterns(path).map(pattern => `"~*${pattern.replaceAll('\\', '\\\\')}" ${target};`);
  }).join('\n') + '\n';
}
