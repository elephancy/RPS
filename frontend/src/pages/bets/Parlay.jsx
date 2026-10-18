import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { Banknote, GripVertical, Layers3, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateParlayOdds } from '../../utils/parlayUtils';
import { API_BASE } from '../../api';
import { ActionButton, EmptyState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page';

const Draggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 60 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
};

const Droppable = ({ id, children, count }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[280px] rounded-[32px] border p-5 shadow-xl backdrop-blur-xl transition ${
        isOver ? 'border-cyan-200/50 bg-cyan-300/10' : 'border-white/10 bg-white/[0.045]'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/40">Slip</div>
          <h2 className="text-2xl font-black">Your parlay</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-white/55">
          {count} legs
        </span>
      </div>
      {children}
    </div>
  );
};

function OptionButton({ option, selected, onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? 'border-cyan-200/40  text-cyan-50'
          : 'border-white/10 bg-black/20  hover:bg-white/[0.07]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-white/35 group-hover:text-white/55" />
        <span className="truncate font-semibold">{option.text}</span>
      </span>
      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-black">
        {Number(option.odds).toFixed(2)}x
      </span>
    </button>
  );
}

export default function Parlay() {
  const [bets, setBets] = useState([]);
  const [selections, setSelections] = useState({});
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const fetchBets = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/bets/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBets(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load active bets', { position: 'bottom-right' });
      } finally {
        setLoading(false);
      }
    };
    fetchBets();
  }, [token]);

  const totalOdds = useMemo(() => calculateParlayOdds(selections), [selections]);
  const selectionList = useMemo(() => Object.values(selections), [selections]);
  const payout = amount && totalOdds > 1 ? Number(amount) * totalOdds : 0;

  const addSelection = (betId, optionText) => {
    const bet = bets.find(item => item._id === betId);
    const option = bet?.options.find(item => item.text === optionText);
    if (!bet || !option) return;
    setSelections(prev => ({
      ...prev,
      [betId]: {
        betId,
        betTitle: bet.title,
        choice: option.text,
        odds: Number(option.odds)
      },
    }));
  };

  const removeSelection = (betId) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[betId];
      return next;
    });
  };

  const handleDragEnd = (event) => {
    if (event.over?.id !== 'drop-zone') return;
    const [betId, choice] = String(event.active.id).split('|');
    addSelection(betId, choice);
  };

  const handleSubmit = async () => {
    const wager = Number(amount);
    if (!Number.isFinite(wager) || wager <= 0) {
      toast.error('Enter a valid wager', { position: 'bottom-right' });
      return;
    }
    if (selectionList.length < 2) {
      toast.error('Select at least two legs', { position: 'bottom-right' });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/api/bets/parlay`,
        {
          amount: wager,
          bets: selectionList.map(({ betId, choice, odds }) => ({ betId, choice, odds })),
          totalOdds,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Parlay placed', { position: 'bottom-right' });
      await refreshUser();
      navigate('/bets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not place parlay', { position: 'bottom-right' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_90%_8%,rgba(244,114,182,0.13),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <PageHero
        meta="Bet builder"
        title="Parlay desk"
        description="Combine two or more outcomes into one higher-risk ticket. Drag a leg into the slip or tap it on mobile."
        actions={(
          <>
            <StatCard label="Active bets" value={bets.length} tone="text-cyan-100" />
            <StatCard label="Selected" value={selectionList.length} tone="text-emerald-100" />
            <StatCard label="Odds" value={`${Number(totalOdds || 1).toFixed(2)}x`} tone="text-rose-100" />
          </>
        )}
      />

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section>
            <SectionHeader
              title="Available legs"
              description="Choose one outcome per bet. Selecting another outcome from the same bet replaces the previous leg."
            />
            {loading ? (
              <div className="grid gap-4">
                <div className="skeleton h-40" />
                <div className="skeleton h-40" />
              </div>
            ) : bets.length === 0 ? (
              <EmptyState title="No active bets" description="There are no open markets for parlays right now." />
            ) : (
              <div className="grid gap-4">
                {bets.map((bet, index) => (
                  <motion.article
                    key={bet._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-xl backdrop-blur-xl"
                  >
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black">{bet.title}</h3>
                        {bet.description && <p className="mt-1 text-sm leading-6 text-white/55">{bet.description}</p>}
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/50">
                        Ends {new Date(bet.endTime).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {bet.options.map((option) => {
                        const selected = selections[bet._id]?.choice === option.text;
                        return (
                          <Draggable key={`${bet._id}|${option.text}`} id={`${bet._id}|${option.text}`}>
                            <OptionButton
                              option={option}
                              selected={selected}
                              onAdd={() => addSelection(bet._id, option.text)}
                            />
                          </Draggable>
                        );
                      })}
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Droppable id="drop-zone" count={selectionList.length}>
              {selectionList.length === 0 ? (
                <div className="grid min-h-[190px] place-items-center rounded-[26px] border border-dashed  bg-black/20 p-6 text-center">
                  <div>
                    <Layers3 className="mx-auto mb-3 h-8 w-8 text-white/35" />
                    <p className="">Drop or tap at least two legs to build a ticket.</p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectionList.map((selection) => (
                    <li
                      key={selection.betId}
                      className="rounded-2xl border border-white/10  p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white/45">{selection.betTitle}</div>
                          <div className="mt-1 font-black text-white">{selection.choice}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelection(selection.betId)}
                          className="rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/50 transition  hover:text-rose-100"
                          aria-label={`Remove ${selection.choice}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 text-sm font-black text-cyan-100">{Number(selection.odds).toFixed(2)}x</div>
                    </li>
                  ))}
                </ul>
              )}
            </Droppable>

            <section className="mt-4 rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/40">Ticket</div>
                  <h2 className="text-xl font-black">Wager</h2>
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter wager amount"
                className="input px-4 py-3 text-white outline-hidden"
              />
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl  p-3">
                  <div className="text-white/40">Total odds</div>
                  <div className="mt-1 text-lg font-black">{Number(totalOdds || 1).toFixed(2)}x</div>
                </div>
                <div className="rounded-2xl  p-3">
                  <div className="text-white/40">Potential return</div>
                  <div className="mt-1 text-lg font-black text-emerald-100">{Number(payout || 0).toFixed(0)}</div>
                </div>
              </div>
              <ActionButton
                onClick={handleSubmit}
                disabled={submitting || selectionList.length < 2}
                variant="rose"
                className="mt-4 w-full justify-center"
              >
                {submitting ? 'Placing ticket' : 'Place parlay'}
              </ActionButton>
            </section>
          </aside>
        </div>
      </DndContext>
    </PageFrame>
  );
}
