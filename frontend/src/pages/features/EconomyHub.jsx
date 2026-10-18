import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BadgeDollarSign, Banknote, Building2, Hammer, Landmark, Swords, Trophy } from 'lucide-react';
import { API_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ActionButton, EmptyState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page';

const rarityTone = {
  common: 'from-slate-500 via-slate-300 to-slate-700',
  uncommon: 'from-emerald-500 via-lime-200 to-emerald-900',
  rare: 'from-sky-500 via-cyan-200 to-blue-900',
  epic: 'from-fuchsia-500 via-violet-200 to-indigo-950',
  legendary: 'from-amber-400 via-orange-200 to-yellow-900',
  mythic: 'from-rose-500 via-white to-cyan-400',
  anomaly: 'from-black via-red-400 to-white'
};

const rarityPalette = {
  common: ['#94a3b8', '#334155', '#020617'],
  uncommon: ['#34d399', '#bef264', '#052e1a'],
  rare: ['#38bdf8', '#2563eb', '#020617'],
  epic: ['#e879f9', '#7c3aed', '#111827'],
  legendary: ['#facc15', '#f97316', '#120a02'],
  mythic: ['#fb7185', '#e0f2fe', '#1e1b4b'],
  anomaly: ['#020617', '#ef4444', '#f8fafc']
};

function cardArtSrc(card) {
  const [a, b, c] = rarityPalette[card.rarity] || rarityPalette.common;
  const initials = String(card.name || '?').slice(0, 2).toUpperCase();
  const seed = String(card.styleSeed || card.cardKey || card.name || '');
  const offset = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 90;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${a}"/>
          <stop offset=".55" stop-color="${b}"/>
          <stop offset="1" stop-color="${c}"/>
        </linearGradient>
        <radialGradient id="halo" cx=".5" cy=".32" r=".65">
          <stop offset="0" stop-color="#fff" stop-opacity=".85"/>
          <stop offset=".35" stop-color="#fff" stop-opacity=".18"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="420" height="420" rx="44" fill="#020617"/>
      <rect x="20" y="20" width="380" height="380" rx="36" fill="url(#bg)"/>
      <circle cx="${150 + offset}" cy="145" r="150" fill="url(#halo)"/>
      <path d="M82 310c64-82 190-82 256 0v48H82z" fill="#020617" opacity=".52"/>
      <circle cx="210" cy="172" r="84" fill="#020617" opacity=".58"/>
      <circle cx="210" cy="172" r="62" fill="#fff" opacity=".16"/>
      <text x="210" y="196" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900" fill="#fff">${initials}</text>
      <text x="60" y="78" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#fff" opacity=".88">${card.tier || ''}</text>
      <path d="M54 352h312" stroke="#fff" stroke-opacity=".28" stroke-width="10" stroke-linecap="round"/>
      <path d="M72 86c58-34 122-42 192-24" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="10" stroke-linecap="round"/>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function CardFoil({ card }) {
  const tone = rarityTone[card.rarity] || rarityTone.common;
  return (
    <motion.div
      whileHover={{ y: -8, rotateX: 4, rotateY: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`relative overflow-hidden rounded-[1.7rem] border border-white/20 bg-gradient-to-br ${tone} p-[1px] shadow-2xl`}
    >
      <div className="relative min-h-56 rounded-[1.65rem]  p-4">
        <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_20%_10%,white,transparent_20%),linear-gradient(115deg,transparent_20%,rgba(255,255,255,.28),transparent_45%)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">{card.rarity}</div>
              <h3 className="mt-2 text-2xl font-black capitalize">{card.name}</h3>
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-bold">{card.tier}</div>
          </div>
          <div className="my-6 grid place-items-center">
            <img
              src={cardArtSrc(card)}
              alt={`${card.name} card art`}
              className="h-32 w-full rounded-[24px] border border-white/15 object-cover shadow-[0_0_45px_rgba(255,255,255,.18)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl bg-black/35 p-2"><div className="text-white/45">LVL</div><b>{card.level}</b></div>
            <div className="rounded-2xl bg-black/35 p-2"><div className="text-white/45">PWR</div><b>{card.power}</b></div>
            <div className="rounded-2xl bg-black/35 p-2"><div className="text-white/45">COPY</div><b>{card.quantity}</b></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SystemPanel({ icon: Icon, title, description, children, tone = 'cyan' }) {
  const tones = {
    cyan: 'text-cyan-100 bg-cyan-300/10 border-cyan-200/20',
    amber: 'text-amber-100 bg-amber-300/10 border-amber-200/20',
    emerald: 'text-emerald-100 bg-emerald-300/10 border-emerald-200/20',
    rose: 'text-rose-100 bg-rose-300/10 border-rose-200/20',
  };
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${tones[tone] || tones.cyan}`}>
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function BoardItem({ title, meta, action }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold text-white">{title}</div>
        {meta && <div className="mt-1 text-sm ">{meta}</div>}
      </div>
      {action}
    </div>
  );
}

export default function EconomyHub() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [amount, setAmount] = useState('2500');
  const [guildName, setGuildName] = useState('');
  const [guildTag, setGuildTag] = useState('');

  const cards = useMemo(() => data?.cards || [], [data]);
  const activeCount = (data?.events?.length || 0) + (data?.loans?.length || 0) + (data?.stakes?.length || 0) + (data?.auctions?.length || 0) + (data?.raid ? 1 : 0);
  const packs = data?.meta?.packs || {};

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/economy`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load economy');
    setData(json);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    load().catch(err => toast.error(err.message));
  }, [load, token]);

  const post = async (path, body = {}) => {
    setBusy(path);
    try {
      const res = await fetch(`${API_BASE}/api/economy${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Action failed');
      toast.success(json.message || 'Updated');
      await load();
      return json;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setBusy('');
    }
  };

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_20%_0%,rgba(251,191,36,0.13),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <PageHero
        meta="Economy"
        title="Economy hub"
        description="A command center for long-term progression: collect member cards, join guilds, run raids, manage risk, and decide where coins should go next."
        actions={(
          <>
            <StatCard label="League" value={data?.league || 'Bronze'} tone="text-amber-100" />
            <StatCard label="Balance" value={`${(data?.balance || 0).toLocaleString()} coins`} tone="text-cyan-100" />
            <StatCard label="Active" value={activeCount} tone="text-emerald-100" />
          </>
        )}
      />

        <div className="mb-8 balanced-grid rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-xl">
          {Object.entries(packs).map(([packKey, pack]) => ({
            label: pack.label || `${packKey} pack`,
            desc: `${Number(pack.cost || 0).toLocaleString()} coins | ${pack.count || 1} cards${pack.minRarity ? ` | ${pack.minRarity}+` : ''}`,
            action: () => post('/cards/open-pack', { pack: packKey }),
            icon: pack.minRarity === 'legendary' ? BadgeDollarSign : Trophy,
            variant: pack.minRarity === 'legendary' ? 'cyan' : pack.minRarity === 'epic' ? 'emerald' : undefined
          })).concat([
            { label: 'Craft duplicates', desc: 'Turn extras into power', action: () => post('/craft'), icon: Hammer },
            { label: 'Market event', desc: `${Math.round((data?.meta?.taxRate || 0.03) * 100)}% sink applies to packs`, action: () => post('/events'), icon: Landmark, variant: 'emerald' },
          ]).map(({ label, desc, action, icon: Icon, variant }) => (
            <button
              key={label}
              type="button"
              disabled={!!busy}
              onClick={action}
              className="interactive-lift rounded-[26px] border border-white/10 bg-black/20 p-4 text-left disabled:opacity-50"
            >
              <Icon className="mb-4 h-5 w-5 text-cyan-100" />
              <div className="font-black">{label}</div>
              <div className="mt-1 text-sm text-white/50">{desc}</div>
              <div className={`mt-4 h-1.5 w-16 rounded-full ${variant === 'emerald' ? 'bg-emerald-200/70' : variant === 'cyan' ? 'bg-cyan-200/70' : 'bg-white/25'}`} />
            </button>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_.9fr]">
          <section>
            <SectionHeader
              title="Trading cards"
              description="Cards are the collectible backbone of the economy. Upgrade duplicates for power, then use strong cards for status and future systems."
              action={<span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/55">{cards.length} owned</span>}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.slice(0, 9).map((card, index) => (
                <motion.button
                  key={card._id}
                  type="button"
                  onClick={() => post('/cards/upgrade', { cardKey: card.cardKey })}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="text-left"
                >
                  <CardFoil card={card} />
                </motion.button>
              ))}
              {!cards.length && (
                <EmptyState title="No cards yet" description="Open a pack to start collecting member cards and power up your deck." />
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <SystemPanel
              icon={Banknote}
              title="Financial tools"
              description="Use one amount field for borrowing, staking, and raid attacks. Loans are leverage; staking is slower and safer."
              tone="amber"
            >
              <input value={amount} onChange={e => setAmount(e.target.value)} className="input mt-1 px-4 py-3 text-white outline-hidden" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ActionButton onClick={() => post('/loans', { amount: Number(amount) })}>Borrow</ActionButton>
                <ActionButton onClick={() => post('/insurance', { type: 'casino' })}>Insure</ActionButton>
                <ActionButton onClick={() => post('/staking', { amount: Number(amount), days: 7 })}>Stake</ActionButton>
                <ActionButton variant="rose" onClick={() => post('/raid/attack', { amount: Number(amount) })}>Raid</ActionButton>
              </div>
            </SystemPanel>

            <SystemPanel
              icon={Building2}
              title="Guild"
              description="Guilds are the social sink: contribute coins, build treasury, and give teams something to compete around."
              tone="emerald"
            >
              {data?.guild ? (
                <div className="mt-3 text-white/70">
                  <div className="text-2xl font-black">{data.guild.name}</div>
                  <div>{data.guild.tag} | Level {data.guild.level} | Treasury {Number(data.guild.treasury || 0).toLocaleString()}</div>
                  <ActionButton onClick={() => post('/guilds/contribute', { amount: Number(amount) })} className="mt-4">Contribute</ActionButton>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <input value={guildName} onChange={e => setGuildName(e.target.value)} placeholder="Guild name" className="input px-4 py-3 text-white outline-hidden" />
                  <input value={guildTag} onChange={e => setGuildTag(e.target.value)} placeholder="TAG" className="input px-4 py-3 text-white outline-hidden" />
                  <ActionButton onClick={() => post('/guilds', { name: guildName, tag: guildTag })}>Create guild</ActionButton>
                </div>
              )}
            </SystemPanel>

            <SystemPanel
              icon={Swords}
              title="Active board"
              description="Everything currently affecting your economy state. Claim, repay, settle, or bid from here."
              tone="rose"
            >
              <div className="space-y-2 text-sm text-white/65">
                {(data?.events || []).map(event => (
                  <BoardItem key={event._id} title={event.name} meta={`Ends ${new Date(event.endsAt).toLocaleTimeString()}`} />
                ))}
                {data?.raid && (
                  <BoardItem
                    title={`Raid: ${data.raid.name}`}
                    meta={`HP ${data.raid.hp}/${data.raid.maxHp}`}
                    action={!data.raid.active ? <ActionButton variant="emerald" onClick={() => post(`/raid/${data.raid._id}/claim`)}>Claim</ActionButton> : null}
                  />
                )}
                {(data?.loans || []).map(loan => (
                  <BoardItem
                    key={loan._id}
                    title={`Loan due: ${Number(loan.outstanding || 0).toLocaleString()}`}
                    meta={`Rate ${Math.round((loan.interestRate || 0) * 100)}%`}
                    action={<ActionButton onClick={() => post(`/loans/${loan._id}/repay`)}>Repay</ActionButton>}
                  />
                ))}
                {(data?.stakes || []).map(stake => (
                  <BoardItem
                    key={stake._id}
                    title={`Stake: ${Number(stake.amount || 0).toLocaleString()}`}
                    meta={`Unlocks ${new Date(stake.unlocksAt || stake.createdAt).toLocaleDateString()}`}
                    action={<ActionButton onClick={() => post(`/staking/${stake._id}/claim`)}>Claim</ActionButton>}
                  />
                ))}
                {(data?.auctions || []).slice(0, 3).map(auction => (
                  <BoardItem
                    key={auction._id}
                    title={auction.title}
                    meta={`Current bid ${Number(auction.currentBid || 0).toLocaleString()}`}
                    action={(
                      <div className="flex gap-2">
                        <ActionButton onClick={() => post(`/auctions/${auction._id}/bid`, { amount: Number(amount) })}>Bid</ActionButton>
                        <ActionButton onClick={() => post(`/auctions/${auction._id}/settle`)}>Settle</ActionButton>
                      </div>
                    )}
                  />
                ))}
                {activeCount === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-white/50">
                    No active economy items yet. Open a pack, start an event, borrow, stake, or join a raid.
                  </div>
                )}
              </div>
            </SystemPanel>
          </aside>
        </div>
    </PageFrame>
  );
}
