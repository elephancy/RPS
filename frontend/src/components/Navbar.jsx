import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Dice5,
  User,
  Shield,
  Menu,
  X,
  BookOpen,
  TrendingUp,
  LogOut,
  Store,
  BriefcaseBusiness,
  Landmark
} from 'lucide-react';
import SkipLink from './SkipLink';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const isStaff = ['admin', 'global-admin', 'game-master'].includes(user?.role);
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const firstLinkRef = useRef(null);
  const toggleRef = useRef(null);
  const location = useLocation();

  const items = useMemo(() => {
    if (isLoggedIn) {
      return [
        { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { id: 'games', label: 'Games', to: '/games', icon: Gamepad2 },
        { id: 'store', label: 'Store', to: '/store', icon: Store },
        { id: 'market', label: 'Market', to: '/market', icon: TrendingUp },
        { id: 'economy', label: 'Economy', to: '/economy', icon: Landmark },
        { id: 'bets', label: 'Bets', to: '/bets', icon: Dice5 },
        { id: 'services', label: 'Services', to: '/services', icon: BriefcaseBusiness },
        { id: 'profile', label: 'Profile', to: '/profile', icon: User },
        ...(isStaff ? [{ id: 'admin', label: 'Admin', to: '/admin', icon: Shield }] : []),
      ];
    }

    return [
      { id: 'rules', label: 'Rules', to: '/rules', icon: BookOpen },
      { id: 'login', label: 'Login', to: '/login', icon: User },
    ];
  }, [isLoggedIn, isStaff]);

  const desktopCenterItems = items.filter(item => item.id !== 'login');
  const desktopRightItem = items.find(item => item.id === 'login');

  const dockItems = isLoggedIn
    ? items.slice(0, 4)
    : items;

  const mobileGroups = isLoggedIn
    ? [
        { title: 'Play', items: items.filter(item => ['games', 'bets'].includes(item.id)) },
        { title: 'Economy', items: items.filter(item => ['store', 'market', 'economy', 'services'].includes(item.id)) },
        { title: 'Account', items: items.filter(item => ['dashboard', 'profile', 'admin'].includes(item.id)) },
      ].filter(group => group.items.length)
    : [{ title: 'Navigation', items }];

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (!open || !drawerRef.current || e.key !== 'Tab') return;
      const list = Array.from(drawerRef.current.querySelectorAll('a,button'));
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 px-2 sm:px-4 pt-[env(safe-area-inset-top)]">
        <SkipLink />
        <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-[28px] glass-shell px-3 py-2.5">
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-white/10 hover:shadow-[0_0_22px_rgba(255,255,255,0.18)]"
            aria-label="Home"
          >
            <img src="/assets/brand/logo.png" alt="RPS logo" className="h-8 w-8 rounded-2xl object-cover shadow-lg shadow-black/20 ring-1 ring-white/10 transition group-hover:ring-white/50 group-hover:brightness-110" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-[0.18em] uppercase text-white/95">RPS</div>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/10 px-1.5 py-1 backdrop-blur-xl">
              {desktopCenterItems.map(item => (
                <NavPill key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="ml-auto hidden md:flex">
            {desktopRightItem ? (
              <NavPill item={desktopRightItem} />
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            ) : null}
          </div>

          <button
            ref={toggleRef}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10  px-3 py-2 text-sm text-white/90 transition  md:hidden"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </nav>

      <div className="md:hidden fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50">
        <div className="glass-shell rounded-[28px] px-2 py-2">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${dockItems.length + 1}, minmax(0, 1fr))` }}
          >
            {dockItems.map(item => (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                    isActive ? ' text-white' : 'text-white/60  hover:text-white',
                  ].join(' ')
                }
              >
                <item.icon size={18} />
                <span className="mt-1">{item.label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold text-white/60 transition  hover:text-white"
            >
              <Menu size={18} />
              <span className="mt-1">More</span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/35 px-3 pt-[calc(4.8rem+env(safe-area-inset-top))] backdrop-blur-xs md:hidden">
          <div
            id="mobile-drawer"
            ref={drawerRef}
            className="glass-shell max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[28px] p-3 [-webkit-overflow-scrolling:touch]"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Navigation</div>
                <div className="text-xs text-white/45">Shortcuts and account links</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10  p-2 text-white/70 transition "
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-4">
              {mobileGroups.map((group, groupIndex) => (
                <div key={group.title}>
                  <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">{group.title}</div>
                  <div className="grid gap-2">
              {group.items.map((item, idx) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  ref={groupIndex === 0 && idx === 0 ? firstLinkRef : undefined}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                      isActive ? ' text-white' : 'text-white/70  hover:text-white',
                    ].join(' ')
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
                  </div>
                </div>
              ))}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-3 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavPill({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition',
          isActive ? 'bg-white/15 text-white shadow-lg shadow-black/10' : 'text-white/70  hover:text-white',
        ].join(' ')
      }
    >
      <item.icon size={15} />
      <span>{item.label}</span>
    </NavLink>
  );
}
