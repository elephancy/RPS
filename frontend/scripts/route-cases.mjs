import { appRoutes } from '../src/config/appRoutes.mjs';

// Representative boundary corpus, compared to the installed React Router at
// runtime. This exercises every current route; it is not an exhaustive URL set.
export const routeCases = [...new Set([
  ...appRoutes.flatMap(({ path }) => {
    const value = path.replace(':username', 'example');
    return [value, value.toUpperCase(), value + '/', value + '///',
      value.replace(/[a-z]/, letter => '%' + letter.charCodeAt(0).toString(16)),
      value + '?from=seo%2Ftest', value + '/missing-child'];
  }),
  '/missing', '/missing?from=rules', '/ru%6Ces', '/%52ULES///?x=%ZZ',
  '/rules%2F', '/%2Frules', '/%2F', '/profile/', '/profile//example',
  '/profile/alice/bob', '/profile/alice%2Fbob', '/profile/%252F', '/profile/%ZZ',
  '/profile/%', '/profile/%C0%AF', '/profile/%ED%A0%80', '/profile/%F4%90%80%80',
  '/profile/ümlaut', '/profile/%C3%BCmlaut', '/profile/%F0%9F%8E%AE',
  '/%70rofile/ümlaut', '/%70rofile/%C3%BC', '/%70rofile/%F0%9F%8E%AE',
  '/%70rofile/%ZZ', '/%70rofile/%C0%AF', '/%70rofile/%ED%A0%80',
  '/%70rofile/%F4%90%80%80', '/%70rofile/%C3x', '/%70rofile/%C3é',
  '/%70rofile/%E0%A0%80', '/%70rofile/%ED%9F%BF', '/%70rofile/%F4%8F%BF%BF',
  '/%70rofile/%00', '/%70rofile/%2F', '/%70rofile/%3F', '/%70rofile/%23',
  '/%70rofile/%25', '/%70rofile/%7F', '/%70rofile/%80', '/%70rofile/%C2%80',
  '/profile/..%2Fassets%2Fbrand%2Flogo.ico', '/profile/..%2F_seo%2Frules.html',
  '/profile/..%2Fsounds%2Fcash-register.mp3', '/profile/..%2Ffavicon.ico',
  '/profile/..%2Frules', '/profile/..%2F_rps-app-shell',
])];

// Nginx rejects these malformed requests before selecting a location. Keep its
// existing HTTP 400 behavior; browser history navigation can still reach them.
export const transportRejectedCases = new Set([
  '/profile/%ZZ', '/profile/%', '/%70rofile/%ZZ', '/%70rofile/%00',
]);
