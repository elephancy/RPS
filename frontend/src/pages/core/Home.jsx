import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { API_BASE } from '../../api';
import {
  CircleDollarSign,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  PawPrint,
  BarChart3,
  Trophy,
  CheckSquare,
  BriefcaseBusiness
} from 'lucide-react';
import { EmptyState, PageFrame, StatCard } from '../../components/ui/page';
import { homeFeatureRoutes } from '../../config/appRoutes';

const iconMap = {
  bets: CircleDollarSign,
  games: Gamepad2,
  pet: PawPrint,
  store: Sparkles,
  economy: ShieldCheck,
  market: BarChart3,
  services: BriefcaseBusiness,
  tasks: CheckSquare,
  trophy: Trophy
};

const routeDescriptions = {
  '/bets': 'Review odds, place wagers, and build parlays.',
  '/games': 'Casino, Minefield, RPS, puzzles, crash, and more.',
  '/games/virtual-pet': 'Feed, evolve, breed, shop, and run mini-games.',
  '/store': 'Buy power-ups, boosts, cosmetics, and useful items.',
  '/economy': 'Cards, auctions, raids, staking, loans, and guilds.',
  '/market': 'Trade stocks, crypto, options, and member assets.',
  '/services': 'Player-created services and paid requests.',
  '/tasks': 'Daily and weekly objectives for steady coin progress.',
  '/leaderboard': 'See top balances, RPS records, and puzzle standings.'
};

export default function Home() {
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard/users?sort=balance`)
      .then((r) => r.json())
      .then((data) => setTopUsers(data.slice(0, 5)))
      .catch((err) => console.error('Leaderboard fetch error:', err));
  }, []);

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_3%,rgba(244,114,182,0.14),transparent_32%),radial-gradient(circle_at_88%_5%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#03040a_0%,#060816_48%,#030303_100%)]">
      <section className="grid gap-8 py-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] text-white sm:text-7xl">
            Arcade rounds, market moves, and collection progress in one loop.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            Play short games, build a portfolio, collect member cards, manage critters, and use coins across systems that feed into each other.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard" className="btn-primary px-6 py-3 text-center text-sm sm:text-base">
              Open dashboard
            </Link>
            <Link to="/games" className="btn-secondary px-6 py-3 text-center text-sm sm:text-base">
              Browse games
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="rounded-[36px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-2xl"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Main loops" value="Games + Economy" tone="text-cyan-100" />
            <StatCard label="Sessions" value="Quick rounds" tone="text-amber-100" />
          </div>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-4">
            <div className="mb-4 text-xs uppercase tracking-[0.28em] text-white/40">Suggested path</div>
            {['Play a round', 'Spend or invest coins', 'Claim progress', 'Upgrade collection'].map((step, index) => (
              <div key={step} className="flex items-center gap-3 border-t  py-3 first:border-t-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-black">{index + 1}</div>
                <div className="font-semibold">{step}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-6 sm:py-12">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-120px' }}
          transition={{ staggerChildren: 0.08 }}
        >
          {homeFeatureRoutes.map(route => {
            const Icon = iconMap[route.icon] || Gamepad2;
            const desc = routeDescriptions[route.path] || 'Open this section.';
            return (
            <motion.div
              key={route.path}
              className="glass-card interactive-lift p-6 will-change-transform"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link to={route.path} className="block">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10  text-pink-300">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{route.label}</h3>
                <p className="text-sm text-white/65 leading-6">{desc}</p>
              </Link>
            </motion.div>
          )})}
        </motion.div>
      </section>
      <section className="pb-10">
        <div className="max-w-3xl mx-auto glass-card-strong p-5 sm:p-6">
          <h2 className="text-center text-xl sm:text-2xl font-bold mb-4">Top players</h2>
          {topUsers.length ? (
            <ul className="divide-y divide-white/10">
              {topUsers.map((user, i) => (
                <li key={user._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50 w-5 text-right">{i + 1}.</span>
                    <img
                      src={
                        user.profileImage
                          ? user.profileImage.startsWith('http')
                            ? user.profileImage
                            : `${API_BASE}${user.profileImage}`
                          : '/assets/avatars/default-avatar.png'
                      }
                      alt={user.username}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <Link to={`/profile/${user.username}`} className="text-white text-sm font-medium hover:underline">
                      {user.username}
                    </Link>
                  </div>
                  <span className="text-pink-300 font-bold text-sm">{Number(user.balance || 0).toLocaleString()} coins</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Leaderboard loading" description="Top players will appear here once the leaderboard responds." />
          )}
        </div>
      </section>
    </PageFrame>
  );
}
