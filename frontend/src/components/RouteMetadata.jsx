import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pages = {
  '/': ['RPS | Arcade Games and Collections', 'Sign in to play arcade games, collect member cards, and use in-game coins in the RPS game world.'],
  '/rules': ['Game Rules | RPS Arcade', 'Learn how RPS players earn coins, play games, trade, and keep the game fair.'],
  '/privacy': ['Privacy Policy | RPS Arcade', 'Read how RPS handles account information, gameplay data, and privacy.'],
  '/cookies': ['Cookie Policy | RPS Arcade', 'Learn about essential storage and optional analytics choices in RPS.'],
};
const accountPaths = new Set(['/login', '/register', '/verify-email', '/forgot-password', '/reset-password']);

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = pages[pathname];
    document.title = page?.[0] ?? 'RPS | Arcade Games and Collections';
    const description = document.head.querySelector('meta[name="description"]');
    if (description) description.content = page?.[1] ?? pages['/'][1];
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = `https://rps.elfeel.me${pathname}`;
    } else {
      canonical?.remove();
    }
    let robots = document.head.querySelector('meta[name="robots"]');
    if (accountPaths.has(pathname)) {
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
