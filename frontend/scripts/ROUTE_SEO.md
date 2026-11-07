# Route status and metadata

`src/config/appRoutes.mjs` is the shared route registry. The production build first
checks it against all 37 explicit React Router paths in `App.jsx`; the wildcard
renders `NotFound`. There are no optional paths. `/profile/:username` is the sole
dynamic public path. The other nine public paths are home, rules, privacy,
cookies, login, register, verify-email, forgot-password and reset-password.
The remaining 27 paths retain their existing protected-route behavior.

`nginx-route-map.mjs` generates an internal map from that registry. It supports
the current absolute ASCII paths and a terminal named parameter; a future path
using other syntax fails the build until the generator is extended. Nginx reads
the original `$request_uri`, because its normalized `$uri` treats an encoded
slash as a separator, whereas React Router permits it inside a username. A
server-level rewrite selects valid app routes before normalized static asset
locations, including usernames containing encoded `../assets` or `../_seo`.
The UTF-8 percent-byte grammar follows `decodeURIComponent`: malformed UTF-8
causes React Router to fall back to the entire raw path. A literal prefix can
therefore match such a username; an encoded prefix cannot.

Known app routes return 200. Public metadata aliases (case, percent encoding and
trailing slashes) canonicalize to their declared path. Account routes retain
noindex. Unknown app paths return the existing app shell with HTTP 404, a page
not found title and noindex. Client metadata uses React Router's `matchRoutes`
and clears or restores directives during history and Link navigation. Real
assets, sounds and public root files retain static serving; internal SEO shells
and missing assets remain inaccessible/404. Security headers are retained.

Nginx itself rejects malformed percent escapes and encoded null bytes before
route selection. Four such cases in the regression corpus were confirmed to
return HTTP 400 under both the original and updated Nginx configurations. These
requests retain 400; client history paths can still reach the React router and
are tested separately.

After `npm ci` and `npm run build` in `frontend`, run Nginx with `build` mounted
at `/usr/share/nginx/html` and `nginx.conf` at
`/etc/nginx/conf.d/default.conf`. Set `RPS_SMOKE_ORIGIN` when using a port other
than 18765, then run:

```
node frontend/scripts/smoke-initial-metadata.mjs
node frontend/scripts/smoke-browser-routes.mjs
```

The browser script uses Playwright Chromium, or the executable specified by
`RPS_CHROME_PATH`. It stubs all API requests and needs no account or live backend.
CI runs both scripts against Nginx 1.27 Alpine and the production bundle. The
302 HTTP cases are representative boundaries, not an exhaustive set of URLs.
Browser checks include every protected path, encoded public profiles, unknown
paths, auth redirect destinations, client history changes, the Back home link
and browser back navigation. They do not prove that a public username exists,
authenticated gameplay works, or Google has recrawled the release.
