export const appRoutes = [
  { path: '/', label: 'Home', public: true, entry: 'navbar' },
  { path: '/rules', label: 'Rules', public: true, entry: 'navbar' },
  { path: '/login', label: 'Login', public: true, entry: 'navbar' },
  { path: '/register', label: 'Register', public: true, entry: 'auth' },
  { path: '/verify-email', label: 'Verify Email', public: true, entry: 'auth' },
  { path: '/forgot-password', label: 'Forgot Password', public: true, entry: 'auth' },
  { path: '/reset-password', label: 'Reset Password', public: true, entry: 'auth' },
  { path: '/privacy', label: 'Privacy', public: true, entry: 'footer' },
  { path: '/cookies', label: 'Cookies', public: true, entry: 'footer' },
  { path: '/profile/:username', label: 'Public Profile', public: true, entry: 'leaderboard' },

  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', entry: 'navbar' },
  { path: '/onboarding', label: 'Onboarding', icon: 'activity', entry: 'dashboard' },
  { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy', entry: 'dashboard' },
  { path: '/admin', label: 'Admin', icon: 'shield', entry: 'navbar', staffOnly: true },
  { path: '/profile', label: 'Profile', icon: 'user', entry: 'dashboard' },
  { path: '/achievements', label: 'Achievements', icon: 'badge', entry: 'dashboard' },
  { path: '/tasks', label: 'Tasks', icon: 'tasks', entry: 'dashboard' },

  { path: '/bets', label: 'Bets', icon: 'bets', entry: 'navbar' },
  { path: '/bets/parlay', label: 'Parlay', icon: 'layers', entry: 'bets' },
  { path: '/requests/bets', label: 'Bet Requests', icon: 'clipboard', entry: 'bets' },

  { path: '/store', label: 'Store', icon: 'store', entry: 'navbar' },
  { path: '/services', label: 'Services', icon: 'services', entry: 'dashboard' },
  { path: '/economy', label: 'Economy', icon: 'economy', entry: 'navbar' },
  { path: '/market', label: 'Market', icon: 'market', entry: 'navbar' },
  { path: '/investments', label: 'Investments', icon: 'market', entry: 'dashboard', aliasOf: '/market' },

  { path: '/games', label: 'Games', icon: 'games', entry: 'navbar' },
  { path: '/games/advanced-arcade', label: 'Advanced Arcade', icon: 'games', entry: 'games' },
  { path: '/games/spinner', label: 'Spinner', icon: 'coins', entry: 'games' },
  { path: '/games/minefield', label: 'Minefield', icon: 'games', entry: 'games' },
  { path: '/games/casino', label: 'Casino', icon: 'bets', entry: 'games' },
  { path: '/games/click-frenzy', label: 'Click Frenzy', icon: 'activity', entry: 'games' },
  { path: '/games/rps', label: 'RPS Arena', icon: 'games', entry: 'games' },
  { path: '/games/puzzle-rush', label: 'Puzzle Rush', icon: 'tasks', entry: 'games' },
  { path: '/games/virtual-pet', label: 'Pet Sanctuary', icon: 'pet', entry: 'games' },
  { path: '/games/virtual-pet/gacha', label: 'Critter Gacha', icon: 'sparkles', entry: 'games' },
  { path: '/games/virtual-pet/shop', label: 'Pet Shop', icon: 'store', entry: 'games' },
  { path: '/games/virtual-pet/breeding', label: 'Breeding Lab', icon: 'pet', entry: 'games' }
];

export const dashboardRoutes = appRoutes.filter(route =>
  !route.public
  && !route.staffOnly
  && ['dashboard', 'navbar', 'bets'].includes(route.entry)
  && route.path !== '/dashboard'
);

export const homeFeatureRoutes = [
  '/bets',
  '/games',
  '/games/virtual-pet',
  '/store',
  '/economy',
  '/market',
  '/services',
  '/tasks',
  '/leaderboard'
].map(path => appRoutes.find(route => route.path === path)).filter(Boolean);
