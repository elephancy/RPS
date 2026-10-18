import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Activity,
  XCircle,
  PackageCheck,
  Gamepad2,
  Store,
  TrendingUp,
  Landmark,
  Dice5,
  Trophy,
  CheckSquare,
  BriefcaseBusiness,
  User,
  Layers3,
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../api';
import toast from 'react-hot-toast';
import { ActionButton, EmptyState, LoadingState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page';
import { dashboardRoutes } from '../../config/appRoutes';
import ItemMark from '../../components/ItemMark';

const dashboardIconMap = {
  activity: Activity,
  badge: BadgeCheck,
  bets: Dice5,
  clipboard: ClipboardList,
  dashboard: Activity,
  economy: Landmark,
  games: Gamepad2,
  layers: Layers3,
  market: TrendingUp,
  services: BriefcaseBusiness,
  store: Store,
  tasks: CheckSquare,
  trophy: Trophy,
  user: User
};

export default function Dashboard() {
  const { token, refreshUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [incomingTrades, setIncomingTrades] = useState([]);
  const [outgoingTrades, setOutgoingTrades] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [responseItems, setResponseItems] = useState({});
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [tradeRecipient, setTradeRecipient] = useState('');
  const [error, setError] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sendUsername, setSendUsername] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userMatches, setUserMatches] = useState([]);

  const formattedInventory = (userData?.inventory || []).map(entry => {
    const raw = entry.item || {};
    return {
      _id: raw._id || 'unknown',
      name: raw.name || 'Unknown Item',
      image: raw.image
        ? raw.image.startsWith('http')
          ? raw.image
          : `${API_BASE}${raw.image}`
        : null,
      emoji: raw.emoji || '◆',
      price: raw.price || 0,
      quantity: entry.quantity ?? 1,
      effect: raw.effect || 'No effect',
      effectType: raw.effectType,
    };
  });

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load user stats');
      setUserData(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/trades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load trades');
      setIncomingTrades(data.incoming || []);
      setOutgoingTrades(data.outgoing || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const handleCreateTrade = async e => {
    e.preventDefault();
    try {
      const fromItems = Object.entries(selectedItems)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity }));
      const res = await fetch(`${API_BASE}/api/trades/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUsername: tradeRecipient, fromItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Trade request failed');
      setOutgoingTrades(prev => [...prev, data.trade]);
      setSelectedItems({});
      setTradeRecipient('');
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRespondToTrade = async (tradeId, action) => {
    try {
      const toItems = Object.entries(responseItems)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, qty]) => ({ itemId, quantity: qty }));
      const res = await fetch(`${API_BASE}/api/trades/${tradeId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toItems, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Response failed');
      setIncomingTrades(prev =>
        prev.map(t => (t._id === tradeId ? data.trade : t))
      );
      setResponseItems({});
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFinalizeTrade = async tradeId => {
    try {
      const res = await fetch(`${API_BASE}/api/trades/${tradeId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Finalize failed');
      setOutgoingTrades(prev =>
        prev.map(t =>
          t._id === tradeId ? { ...t, status: 'accepted', toItems: data.trade.toItems } : t
        )
      );
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelTrade = async tradeId => {
    try {
      const res = await fetch(`${API_BASE}/api/trades/${tradeId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cancel failed');
      fetchTrades();
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendMoney = async e => {
    e.preventDefault();
    if (!sendUsername || !sendAmount) {
      return toast.error('Enter recipient and amount');
    }
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/send-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUsername: sendUsername,
          amount: sendAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transfer failed');
      toast.success(`Sent ${sendAmount} coins to ${sendUsername}`);
      setSendUsername('');
      setSendAmount('');
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleUseItem = async itemId => {
    try {
      const res = await fetch(`${API_BASE}/api/store/consume/${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not use item');
      toast.success(data.message || 'Item activated');
      await refreshUser();
      await fetchUserData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBadgeClick = badge => {
    setSelectedBadge(prev => (prev?.name === badge.name ? null : badge));
  };

  useEffect(() => {
    if (!token) return;
    fetchUserData();
    fetchTrades();
  }, [token, fetchUserData, fetchTrades]);

  useEffect(() => {
    if (!token || sendUsername.trim().length < 2) {
      setUserMatches([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/search?q=${encodeURIComponent(sendUsername.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUserMatches(Array.isArray(data) ? data : []);
      } catch {
        setUserMatches([]);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [sendUsername, token]);

  if (!userData) {
    return <LoadingState label="Loading dashboard" />;
  }

  const lockedQuantities = {};
  [...incomingTrades, ...outgoingTrades].forEach(trade => {
    if (['pending', 'responded'].includes(trade.status)) {
      [...trade.fromItems, ...trade.toItems].forEach(({ item, quantity }) => {
        const id = item._id || item;
        if (!id) return;
        lockedQuantities[id] = (lockedQuantities[id] || 0) + quantity;
      });
    }
  });
  const getLocked = id => lockedQuantities[id] || 0;
  const isItemFullyLocked = (id, qty) => (lockedQuantities[id] || 0) >= qty;

  const activeBuffs = userData.activeEffects || [];
  const buffLabel = b => {
    switch (b.effectType) {
      case 'reward-multiplier': return `Reward x${Number(b.effectValue || 1).toFixed(1)}`;
      case 'extra-safe-click':   return `${Number(b.effectValue || 0).toFixed(1)} extra safe click`;
      case 'mine-reduction':     return `-${Number(b.effectValue || 0).toFixed(1)} mines`;
      case 'slots-luck':         return `+${Number(b.effectValue || 0).toFixed(1)}% slot luck`;
      default: return b.effectType;
    }
  };
  const formatRemaining = expiresAt => {
    if (!expiresAt) return '';
    const ms = new Date(expiresAt) - Date.now();
    if (ms <= 0) return '';
    const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
    return ` (${m}m${s}s)`;
  };

  const filteredIncoming = activeOnly
    ? incomingTrades.filter(t => ['pending','responded'].includes(t.status))
    : incomingTrades;
  const filteredOutgoing = activeOnly
    ? outgoingTrades.filter(t => ['pending','responded'].includes(t.status))
    : outgoingTrades;

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_5%,rgba(236,72,153,0.13),transparent_32%),radial-gradient(circle_at_88%_2%,rgba(34,211,238,0.11),transparent_32%),linear-gradient(180deg,#04070f_0%,#09090b_55%,#020202_100%)]">
      <div className="space-y-8">
        {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</div>}
        <PageHero
          title={userData.username ? `Welcome back, ${userData.username}` : 'Your account hub'}
          description="Your command center for coins, inventory, trades, active bets, badges, and the next best action."
          actions={(
            <>
              <StatCard label="Balance" value={`${Number(userData.balance || 0).toLocaleString()} coins`} tone="text-cyan-100" />
              <StatCard label="Inventory" value={formattedInventory.length} tone="text-emerald-100" />
              <StatCard label="Trades" value={filteredIncoming.length + filteredOutgoing.length} tone="text-amber-100" />
            </>
          )}
        />
        <section className="balanced-grid">
          {dashboardRoutes.map(route => {
            const Icon = dashboardIconMap[route.icon] || Activity;
            return (
            <Link key={route.path} to={route.path} className="interactive-lift group rounded-[24px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]">
              <Icon className="mb-3 h-5 w-5 text-pink-200 transition group-hover:scale-110" />
              <div className="font-semibold">{route.label}</div>
              <div className="mt-1 text-xs text-white/45">Open section</div>
            </Link>
          )})}
        </section>
        {activeBuffs.length > 0 && (
          <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
            <h2 className="mb-2 text-lg font-semibold text-yellow-300">Active buffs</h2>
            <div className="flex flex-wrap gap-2">
              {activeBuffs.map(b => (
                <span
                  key={b.effectType}
                  className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200"
                >
                  {buffLabel(b)}{formatRemaining(b.expiresAt)}
                </span>
              ))}
            </div>
          </section>
        )}
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <SectionHeader
            title="Inventory"
            description="Items you can trade, use for boosts, or keep as collection pieces."
            action={<PackageCheck className="h-6 w-6 text-indigo-200" />}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {formattedInventory.map(item => (
              <div
                key={item._id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-indigo-400/30"
              >
                <div className="flex justify-center mb-2">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <ItemMark name={item.name} className="h-12 w-12 text-sm" />
                  )}
                </div>
                <h3 className="text-center text-lg font-semibold">{item.name}</h3>
                <p className="text-center text-sm text-white/70">x{item.quantity}</p>
                {item.effect && (
                  <p className="text-center text-xs text-white/50 mt-1">
                    {item.effect}
                  </p>
                )}
                {item.effectType && (
                  <ActionButton
                    type="button"
                    variant="cyan"
                    className="mt-3 w-full justify-center py-2"
                    onClick={() => handleUseItem(item._id)}
                  >
                    Use item
                  </ActionButton>
                )}
              </div>
            ))}
          </div>
          {!formattedInventory.length && (
            <EmptyState title="Inventory is empty" description="Visit the store or earn rewards from games to start building inventory." action={<Link className="btn-secondary px-4 py-3" to="/store">Open store</Link>} />
          )}
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <SectionHeader
            title="Send coins"
            description="Transfer coins to another player. Transfers are immediate."
            action={<BadgeCheck className="h-6 w-6 text-emerald-200" />}
          />
          <form onSubmit={handleSendMoney} className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
            <div className="flex-1">
              <label className="block text-sm text-white/70 mb-1">Recipient</label>
              <input
                type="text"
                value={sendUsername}
                onChange={e => setSendUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-2 bg-white/10 text-white rounded-sm"
              />
              {sendUsername.trim().length >= 2 && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                  {userMatches.length ? userMatches.map(match => (
                    <button
                      key={match._id}
                      type="button"
                      onClick={() => setSendUsername(match.username)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-white/10"
                    >
                      <span>{match.username}{match.isBot ? ' · bot' : ''}</span>
                      <span className="text-xs text-white/45">{Number(match.balance || 0).toLocaleString()} coins</span>
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-sm text-white/45">No user found</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Amount</label>
              <input
                type="number"
                min="1"
                value={sendAmount}
                onChange={e => setSendAmount(e.target.value)}
                placeholder="0"
                className="w-24 p-2 bg-white/10 text-white rounded-sm"
              />
            </div>
            <ActionButton
              type="submit"
              disabled={isSending}
              variant="emerald"
              className="px-5 py-3"
            >
              {isSending ? 'Sending...' : 'Send'}
            </ActionButton>
          </form>
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <SectionHeader
            title="Trade center"
            description="Send inventory offers, review incoming trades, and finalize accepted exchanges."
            action={(
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={() => setActiveOnly(!activeOnly)}
              />
              Show only active trades
            </label>
            )}
          />

          <form onSubmit={handleCreateTrade} className="space-y-4">
            <input
              value={tradeRecipient}
              onChange={e => setTradeRecipient(e.target.value)}
              placeholder="Recipient username"
              className="input px-4 py-3 text-white outline-hidden"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formattedInventory.map(({ _id, name, image, quantity }) => {
                const disabled = isItemFullyLocked(_id, quantity);
                return (
                  <div
                    key={_id}
                    className={`relative rounded-[22px] border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.07] ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <div className="mb-2">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className="w-12 h-12 object-contain mx-auto"
                        />
                      ) : (
                        <ItemMark name={name} className="mx-auto h-12 w-12 text-sm" />
                      )}
                    </div>
                    <p className="text-center text-sm font-semibold">{name}</p>
                    <p className="text-center text-xs text-white/60">
                      Qty: {quantity}
                      {getLocked(_id) > 0 && (
                        <span className="ml-1 text-red-400">
                          ({getLocked(_id)} locked)
                        </span>
                      )}
                    </p>
                    <input
                      type="number"
                      min="0"
                      max={quantity}
                      disabled={disabled}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-hidden focus:border-cyan-200/35"
                      value={selectedItems[_id] || 0}
                      onChange={e =>
                        setSelectedItems(prev => ({
                          ...prev,
                          [_id]: Math.min(Math.max(0, +e.target.value), quantity),
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="btn-primary px-4 py-3"
            >
              Create trade
            </button>
          </form>
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-xl font-semibold text-pink-300">
            Incoming trades
          </h3>
          {filteredIncoming.length === 0 ? (
            <EmptyState title="No incoming trades" description="Incoming offers from other players will appear here." />
          ) : (
            filteredIncoming.map(trade => (
              <div
                key={trade._id}
                className="mb-4 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-xl backdrop-blur-xl"
              >
                <div className="text-sm text-white/70">
                  From:&nbsp;<strong>{trade.fromUser?.username || 'Unknown'}</strong>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {trade.fromItems.map(({ name, image, price, quantity }, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10  p-3 text-sm">
                      {image ? (
                        <img
                          src={image.startsWith('http') ? image : `${API_BASE}${image}`}
                          alt={name}
                          className="w-8 h-8 mx-auto"
                        />
                      ) : (
                        <ItemMark name={name} className="mx-auto h-9 w-9 text-[11px]" />
                      )}
                      <p className="text-center">{name}</p>
                      <p className="text-center text-xs text-white/60">x{quantity}</p>
                      <p className="text-center text-xs text-white/40">${price}</p>
                    </div>
                  ))}
                </div>

                {trade.status === 'pending' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    {formattedInventory.map(({ _id, name, image, quantity }) => {
                      const disabled = isItemFullyLocked(_id, quantity);
                      return (
                        <div key={_id} className={`rounded-2xl border border-white/10  p-3 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
                          {image ? (
                            <img src={image} alt={name} className="w-10 h-10 mx-auto mb-1" />
                          ) : (
                            <ItemMark name={name} className="mx-auto h-10 w-10 text-[11px]" />
                          )}
                          <p className="text-center text-sm">{name}</p>
                          <input
                            type="number"
                            min="0"
                            max={quantity}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-hidden focus:border-cyan-200/35"
                            value={responseItems[_id] || 0}
                            onChange={e =>
                              setResponseItems(prev => ({
                                ...prev,
                                [_id]: Math.min(Math.max(0, +e.target.value), quantity),
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {trade.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleRespondToTrade(trade._id, 'accept')}
                        className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:brightness-110"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToTrade(trade._id, 'deny')}
                        className="rounded-2xl border border-rose-300/25  px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                      >
                        Deny
                      </button>
                    </>
                  )}
                  {['pending', 'responded'].includes(trade.status) && (
                    <button
                      onClick={() => handleCancelTrade(trade._id)}
                      className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-white/[0.1]"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                  {['accepted', 'denied', 'canceled'].includes(trade.status) && (
                    <span className="italic text-white/60">Status: {trade.status}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-xl font-semibold text-sky-300">
            Outgoing trades
          </h3>
          {filteredOutgoing.length === 0 ? (
            <EmptyState title="No outgoing trades" description="Trades you create will appear here until they are finalized or cancelled." />
          ) : (
            filteredOutgoing.map(trade => (
              <div
                key={trade._id}
                className="mb-4 space-y-3 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-xl backdrop-blur-xl"
              >
                <div className="text-sm text-white/70">
                  To:&nbsp;<strong>{trade.toUser?.username || 'Unknown'}</strong>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {trade.fromItems.map(({ name, image, price, quantity }, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10  p-3 text-sm">
                      {image ? (
                        <img
                          src={image.startsWith('http') ? image : `${API_BASE}${image}`}
                          alt={name}
                          className="w-8 h-8 mx-auto"
                        />
                      ) : (
                        <ItemMark name={name} className="mx-auto h-9 w-9 text-[11px]" />
                      )}
                      <p className="text-center">{name}</p>
                      <p className="text-center text-xs text-white/60">x{quantity}</p>
                      <p className="text-center text-xs text-white/40">${price}</p>
                    </div>
                  ))}
                </div>

                {['responded','accepted','denied','canceled'].includes(trade.status) && (
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold text-white/80">Their Response:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {trade.toItems.map(({ name, image, price, quantity }, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/10  p-3 text-sm">
                          {image ? (
                            <img
                              src={image.startsWith('http') ? image : `${API_BASE}${image}`}
                              alt={name}
                              className="w-8 h-8 mx-auto mb-1"
                            />
                          ) : (
                            <ItemMark name={name} className="mx-auto h-9 w-9 text-[11px]" />
                          )}
                          <p className="text-center">{name}</p>
                          <p className="text-center text-xs text-white/60">x{quantity}</p>
                          <p className="text-center text-xs text-white/40">${price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trade.status === 'responded' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleFinalizeTrade(trade._id)}
                      className="rounded-2xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:brightness-110"
                    >
                      Finalize
                    </button>
                    <button
                      onClick={() => handleCancelTrade(trade._id)}
                      className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-white/[0.1]"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </div>
                )}

                {trade.status === 'pending' && (
                  <button
                    onClick={() => handleCancelTrade(trade._id)}
                    className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-white/[0.1]"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
                {['accepted','denied','canceled'].includes(trade.status) && (
                  <span className="italic text-white/60">Status: {trade.status}</span>
                )}
              </div>
            ))
          )}
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <SectionHeader title="Active bets" description="Open bets you are currently involved in." action={<Activity className="h-6 w-6 text-green-200" />} />
          {userData.currentBets?.length > 0 ? (
            <div className="space-y-4">
              {userData.currentBets.map(bet => (
                <div key={bet._id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="font-semibold mb-1 text-white">{bet.title}</div>
                  <div className="space-y-1 text-sm text-white/80">
                    {bet.options.map(option => {
                      const yourPrediction = bet.predictions.find(
                        p => p.user === userData.userId && p.choice === option.text
                      );
                      return (
                        <div
                          key={option._id}
                          className={`flex items-center justify-between px-2 py-1 rounded-sm ${yourPrediction ? 'bg-green-700/40' : 'bg-white/5'}`}
                        >
                          <span>{option.text}</span>
                          {yourPrediction && (
                            <span className="text-xs text-green-400">
                              You bet: ${yourPrediction.amount} ✔
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    {bet.result ? `Final Result: ${bet.result}` : 'Pending...'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active bets" description="Open the bets page to place a wager or build a parlay." action={<Link className="btn-secondary px-4 py-3" to="/bets">Open bets</Link>} />
          )}
        </section>
        <section className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
          <SectionHeader title="Badges" description="Unlocked achievements and profile markers." action={<BadgeCheck className="h-6 w-6 text-pink-200" />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {userData.badges.map(badge => {
              const unlocked = userData.badges.map(b => b.name).includes(badge.name);
              const isSelected = selectedBadge?.name === badge.name;
              return (
                <div
                  key={badge.name}
                  onClick={() => handleBadgeClick(badge)}
                  className={`
                    relative group bg-white/5 border border-white/10
                    rounded-xl p-4 cursor-pointer transition-transform hover:scale-105
                    ${unlocked ? 'text-white' : 'text-white/30'}
                    ${isSelected ? 'ring-2 ring-pink-500' : ''}
                  `}
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10  text-pink-100">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div className="font-medium">{badge.name}</div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2
                    opacity-0 group-hover:opacity-100 text-xs text-white/80 bg-black/70
                    px-2 py-1 rounded-lg pointer-events-none">
                    {badge.description}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedBadge && (
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-1">{selectedBadge.name}</h3>
              <p className="text-sm">{selectedBadge.description}</p>
            </div>
          )}
        </section>

      </div>
    </PageFrame>
  );
}
