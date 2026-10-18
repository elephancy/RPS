import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { ActionButton, EmptyState, PageFrame, PageHero, StatCard } from '../../components/ui/page';
import {
  BadgeCheck,
  Sparkles,
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Clock,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from '../../api';
import ItemMark from '../../components/ItemMark';

const resolveImage = (src) => {
  if (!src) return null;
  return src.startsWith('http') ? src : `${API_BASE}${src}`;
};

const revealTone = (item) => {
  if (item?.type === 'badge') return { a: 'rgba(34,211,238,0.95)', b: 'rgba(14,165,233,0.45)', c: 'rgba(103,232,249,0.18)' };
  if (item?.type === 'power-up') return { a: 'rgba(251,191,36,0.95)', b: 'rgba(245,158,11,0.45)', c: 'rgba(253,230,138,0.18)' };
  return { a: 'rgba(244,114,182,0.95)', b: 'rgba(168,85,247,0.45)', c: 'rgba(251,207,232,0.18)' };
};

const Store = () => {
  const { token, refreshUser } = useAuth();

  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [balance, setBalance] = useState(0);

  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('title');
  const [sortAsc, setSortAsc] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [recentReveal, setRecentReveal] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/store`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load items');
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/store/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch store data');
      const data = await res.json();

      const inv = Array.isArray(data.inventory) ? data.inventory : [];
      const formatted = inv
        .map(entry => {
          if (entry.item && entry.item._id) {
            const img = entry.item.image
            return {
              _id:      entry.item._id,
              name:     entry.item.name,
              type:     entry.item.type,
              emoji:    entry.item.emoji,
              description: entry.item.description,
              effect:   entry.item.effect,
              effectType: entry.item.effectType,
              image: resolveImage(img),
              price:    entry.item.price,
              quantity: entry.quantity || 1
            };
          }
          return null;
        })
        .filter(Boolean);

      setInventory(formatted);
      setPurchaseHistory(Array.isArray(data.purchaseHistory) ? data.purchaseHistory : []);
      setBalance(data.balance ?? 0);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load user data');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchItems();
    fetchUserData();
  }, [token, fetchItems, fetchUserData]);

  const purchaseItem = async (itemId) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const product = items.find(i => i._id === itemId);
      const res = await fetch(`${API_BASE}/api/store/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setItems(prev =>
        prev.map(i => (i._id === itemId ? { ...i, stock: Math.max(0, i.stock - 1) } : i))
      );

      const revealedItem = result.purchasedItem || product;
      if (revealedItem) setRecentReveal(revealedItem);
      toast.success(`${revealedItem?.name || 'Item'} purchased`, { position: "bottom-right" });
      await refreshUser();
    } catch (err) {
      toast.error(err.message, { position: "bottom-right" });
    } finally {
      await fetchUserData();
      setIsPurchasing(false);
    }
  };

  const activateItem = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/api/store/consume/${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not activate item');
      toast.success(data.message || 'Item activated', { position: 'bottom-right' });
      await fetchUserData();
      await refreshUser();
    } catch (err) {
      toast.error(err.message || 'Could not activate item', { position: 'bottom-right' });
    }
  };

  const groupedInventory = Object.values(
    inventory.reduce((acc, item) => {
      const key = item._id;
      if (!acc[key]) {
        acc[key] = { ...item, count: 0, uniqueKey: key };
      }
      acc[key].count += item.quantity;
      return acc;
    }, {})
  );

  const safeSort = (a, b) => {
    if (sortField === 'title') {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === 'price') {
      return sortAsc ? a.price - b.price : b.price - a.price;
    }
    if (sortField === 'stock') {
      return sortAsc ? a.stock - b.stock : b.stock - a.stock;
    }
    return 0;
  };

  const filteredItems = items
    .filter(i => (typeFilter === 'all' || i.type === typeFilter) && i.stock > 0)
    .sort(safeSort);

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_20%_8%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_82%_2%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,#04070f_0%,#09090b_55%,#020202_100%)]">
      <div className="space-y-8">
        <PageHero
          title="Store"
          description="Buy badges, cosmetics, and power-ups. The shop is built around quick decisions, clear prices, and inventory you can actually scan."
          actions={<StatCard label="Balance" value={`${balance.toLocaleString()} coins`} tone="text-cyan-100" />}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() =>
              setExpandedSection(expandedSection === 'inventory' ? null : 'inventory')
            }
          >
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <PackageCheck size={20} className="text-indigo-300" />
              Inventory
              <span className="ml-2 text-sm text-indigo-300">
                ({groupedInventory.length})
              </span>
            </h3>
            <motion.div
              animate={{ rotate: expandedSection === 'inventory' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} className="text-indigo-400" />
            </motion.div>
          </div>

          <AnimatePresence>
            {expandedSection === 'inventory' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="max-h-64 overflow-y-auto scrollable-pane pr-2">
                  {groupedInventory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-white/60">
                      Your inventory is empty
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {groupedInventory.map(item => (
                        <div
                          key={item.uniqueKey}
                          className="rounded-2xl border border-white/10 bg-white/[0.055] p-3"
                        >
                          <div className="flex items-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="mr-2 h-9 w-9 rounded-xl object-cover"
                              />
                            ) : (
                              <ItemMark name={item.name} className="mr-2 h-9 w-9 text-[11px]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.name}</p>
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs text-indigo-300">
                                  {item.effect}
                                </p>
                                <p className="text-xs text-indigo-300">
                                  x{item.count}
                                </p>
                              </div>
                            </div>
                          </div>
                          {item.effectType && (
                            <ActionButton
                              type="button"
                              variant="ghost"
                              onClick={() => activateItem(item._id)}
                              className="mt-3 w-full justify-center py-2 text-xs"
                            >
                              Use item
                            </ActionButton>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

          <Card className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-xl backdrop-blur-xl">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() =>
              setExpandedSection(expandedSection === 'history' ? null : 'history')
            }
          >
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Clock size={20} className="text-pink-300" />
              Recent purchases
              <span className="ml-2 text-sm text-pink-300">
                ({purchaseHistory.length})
              </span>
            </h3>
            <motion.div
              animate={{ rotate: expandedSection === 'history' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} className="text-pink-400" />
            </motion.div>
          </div>

          <AnimatePresence>
            {expandedSection === 'history' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="max-h-64 overflow-y-auto scrollable-pane pr-2">
                  {purchaseHistory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-white/60">
                      No purchases yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {purchaseHistory.map(entry => (
                        <div
                          key={entry._id || entry.purchasedAt}
                          className="group flex items-center rounded-2xl border border-white/10  p-3"
                        >
                          <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-900/20">
                            <Clock size={14} className="text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{entry.item?.name || 'Unknown Item'}</p>
                              <span className="text-xs text-pink-300">
                                {new Date(entry.purchasedAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-pink-300">
                              {new Date(entry.purchasedAt).toLocaleTimeString([], {
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
      <div className="mb-10 flex flex-col justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'All',       value: 'all',      icon: <Filter size={14}/> },
            { label: 'Badges',    value: 'badge',    icon: <BadgeCheck size={14}/> },
            { label: 'Power-Ups', value: 'power-up', icon: <Sparkles  size={14}/> },
            { label: 'Cosmetics', value: 'cosmetic', icon: <Sparkles  size={14}/> },
          ].map(({ label, value, icon }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                typeFilter === value
                  ? 'border-cyan-200/35  text-cyan-50 shadow-[0_12px_40px_rgba(34,211,238,0.14)]'
                  : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="rounded-full border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
            aria-label="Toggle sort direction"
          >
            {sortAsc ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
          </button>
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            className="select px-4 py-3 text-sm outline-hidden"
          >
            <option value="title">Title</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
        </div>
      </div>
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        layout
        initial="hidden"
        whileInView="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', duration: 0.3, delay: index * 0.02 }}
              viewport={{ once: true }}
            >
              <Card className="group h-full overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.075]">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-white/10  px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                    {item.type}
                  </span>
                  <span className="text-sm font-semibold text-cyan-100">{item.stock} left</span>
                </div>
                <div className="my-6 flex justify-center">
                  {resolveImage(item.image) ? (
                    <img
                      src={resolveImage(item.image)}
                      alt={item.name}
                      className="h-24 w-24 rounded-[28px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
                    />
                  ) : (
                    <ItemMark name={item.name} className="h-24 w-24 rounded-[28px] text-xl" />
                  )}
                </div>
                <h3 className="text-lg font-black text-white">{item.name}</h3>
                <p className="mt-2 min-h-10 text-sm leading-5 ">
                  {item.effect || item.description || 'A store item for your account.'}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] ">Price</div>
                    <div className="font-semibold text-white">{Number(item.price || 0).toLocaleString()} coins</div>
                  </div>
                  <motion.div whileTap={{ scale: 0.96 }}>
                    <ActionButton
                      onClick={() => purchaseItem(item._id)}
                      disabled={item.stock <= 0 || isPurchasing}
                      variant="cyan"
                      className="px-5"
                    >
                      {item.stock > 0
                        ? isPurchasing ? 'Processing...' : 'Buy'
                        : 'Sold out'}
                    </ActionButton>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {!filteredItems.length && (
        <EmptyState
          title="No items available"
          description="Try another filter or wait for the shop to refresh."
        />
      )}
      </div>
      <AnimatePresence>
        {recentReveal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden  p-4 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRecentReveal(null)}
          >
            {Array.from({ length: 18 }, (_, index) => {
              const tone = revealTone(recentReveal);
              return (
                <motion.span
                  key={index}
                  className="pointer-events-none absolute h-2 w-2 rounded-full"
                  style={{ background: index % 3 === 0 ? tone.a : index % 3 === 1 ? '#fff' : tone.b }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(index * 1.9) * (140 + index * 12),
                    y: Math.sin(index * 1.9) * (110 + index * 8),
                    scale: [0, 1.25, 0.55],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ delay: 0.55 + index * 0.015, duration: 1.3, ease: 'easeOut' }}
                />
              );
            })}
            <motion.div
              initial={{ scale: 0.78, rotate: -6, y: 34 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 13 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[40px] border  bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,rgba(15,23,42,0.97),rgba(3,7,18,0.98))] p-7 text-center shadow-[0_40px_140px_rgba(0,0,0,0.55)]"
              onClick={event => event.stopPropagation()}
            >
              <motion.div
                className="absolute inset-x-8 top-8 h-72 rounded-[34px] border  bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04)),radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_18%)] shadow-[0_25px_90px_rgba(0,0,0,0.38)]"
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: [1, 1, 0], scale: [1, 1.02, 1.22], y: [0, -6, -24] }}
                transition={{ duration: 1.15, times: [0, 0.5, 1], ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 rounded-[34px] bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.16)_0,rgba(255,255,255,0.16)_1px,transparent_1px,transparent_13px)]" />
                <div className="absolute left-1/2 top-8 h-20 w-20 -translate-x-1/2 rounded-3xl border border-white/20 bg-black/25 shadow-inner" />
                <div className="absolute bottom-8 left-8 right-8 rounded-2xl border  bg-black/25 py-3 text-xs font-black uppercase tracking-[0.28em] text-white/70">
                  RPS pack
                </div>
              </motion.div>
              <motion.div
                className="absolute left-8 top-8 h-72 w-[calc(50%-2rem)] origin-right rounded-l-[34px] border border-white/10 bg-white/10"
                initial={{ x: 0, rotateY: 0, opacity: 0 }}
                animate={{ x: [-2, -80], rotateY: [0, -58], opacity: [0, 1, 0] }}
                transition={{ delay: 0.62, duration: 0.95, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute right-8 top-8 h-72 w-[calc(50%-2rem)] origin-left rounded-r-[34px] border border-white/10 bg-white/10"
                initial={{ x: 0, rotateY: 0, opacity: 0 }}
                animate={{ x: [2, 80], rotateY: [0, 58], opacity: [0, 1, 0] }}
                transition={{ delay: 0.62, duration: 0.95, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
                style={{ background: revealTone(recentReveal).c }}
                animate={{ scale: [0.6, 1.25, 1], opacity: [0, 0.9, 0.52] }}
                transition={{ delay: 0.62, duration: 1.15 }}
              />
              <motion.div
                className="relative mx-auto mb-6 mt-10 flex h-44 w-44 items-center justify-center rounded-[38px] border  bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.035))] shadow-[0_28px_90px_rgba(0,0,0,0.38)]"
                initial={{ y: 36, scale: 0.62, rotate: -10, opacity: 0 }}
                animate={{ y: [36, -12, 0], scale: [0.62, 1.1, 1], rotate: [-10, 4, 0], opacity: [0, 1, 1] }}
                transition={{ delay: 0.72, duration: 0.9, ease: 'easeOut' }}
              >
                <motion.div
                  className="absolute inset-[-18px] rounded-[48px] border"
                  style={{ borderColor: revealTone(recentReveal).a }}
                  animate={{ scale: [0.82, 1.16, 1.02], opacity: [0, 0.8, 0.24] }}
                  transition={{ delay: 0.86, duration: 1.1 }}
                />
                {resolveImage(recentReveal.image) ? (
                  <img src={resolveImage(recentReveal.image)} alt={recentReveal.name} className="h-32 w-32 rounded-[30px] object-cover shadow-2xl" />
                ) : (
                  <ItemMark name={recentReveal.name} className="h-32 w-32 rounded-[30px] text-3xl" />
                )}
              </motion.div>
              <motion.p
                className="text-xs uppercase tracking-[0.32em] text-cyan-100/70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                Unpacked
              </motion.p>
              <motion.h2
                className="mt-2 text-3xl font-black text-white"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.08 }}
              >
                {recentReveal.name}
              </motion.h2>
              <motion.p
                className="mt-3 text-sm leading-6 "
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.16 }}
              >
                {recentReveal.effect || recentReveal.description || 'Added to your inventory.'}
              </motion.p>
              <ActionButton onClick={() => setRecentReveal(null)} className="mt-7 w-full justify-center">
                Continue
              </ActionButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .scrollable-pane::-webkit-scrollbar { width: 6px; }
        .scrollable-pane::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1); border-radius: 3px;
        }
        .scrollable-pane::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3); border-radius: 3px;
        }
        .scrollable-pane::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </PageFrame>
  );
};

export default Store;
