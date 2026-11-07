import { useEffect } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import { appRoutes } from '../config/appRoutes.mjs';
import { accountPaths, pages } from '../seoMetadata.mjs';

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const route = matchRoutes(appRoutes, pathname)?.at(-1)?.route.path;
    const page = pages[route];
    document.title = page?.[0] ?? (route ? pages['/'][0] : 'Page not found | RPS Arcade');
    const description = document.head.querySelector('meta[name="description"]');
    if (description) description.content = page?.[1] ?? (route ? pages['/'][1] : 'This RPS page could not be found.');
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = `https://rps.elfeel.me${route}`;
    } else {
      canonical?.remove();
    }
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!route || accountPaths.has(route)) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.append(robots);
      }
      robots.content = 'noindex,follow';
    } else {
      robots?.remove();
    }
  }, [pathname]);
  return null;
}
