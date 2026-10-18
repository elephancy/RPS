import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChartNoAxesColumnIncreasing, ClipboardList, Clock, Layers3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../api';
import { EmptyState, PageFrame, PageHero, StatCard } from '../../components/ui/page';

export default function Bets() {
  const [bets, setBets] = useState([]);
  const [amount, setAmount] = useState({});
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/api/bets/active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => setBets(response.data))
      .catch(() => toast.error('Failed to load active bets'));
  }, [token]);

  const totalMarkets = bets.length;
  const totalOptions = useMemo(
    () => bets.reduce((sum, bet) => sum + (bet.options?.length || 0), 0),
    [bets]
  );

  const handlePlaceBet = async (betId, optionText) => {
    const wager = Number(amount[betId] || 0);
    if (!wager || wager <= 0) return toast.error('Enter a valid wager');
    if (user?.balance != null && wager > user.balance) return toast.error('Insufficient balance');

    try {
      await axios.post(
        `${API_BASE}/api/bets/predict`,
        { betId, choice: optionText, amount: wager },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bet placed');
      setAmount(prev => ({ ...prev, [betId]: '' }));
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bet placement failed');
    }
  };

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.14),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_58%,#020202_100%)]">
      <div className="space-y-8">
        <PageHero
          title="Bet board"
          description="Pick a market, choose an outcome, and keep stakes controlled. Parlays are available when you want a multi-leg ticket."
          actions={(
            <>
              <StatCard label="Open markets" value={totalMarkets} tone="text-cyan-100" />
              <StatCard label="Outcomes" value={totalOptions} tone="text-emerald-100" />
              <StatCard label="Balance" value={`${(user?.balance || 0).toLocaleString()} coins`} tone="text-amber-100" />
            </>
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/bets/parlay')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-5 py-3 font-semibold text-cyan-50 transition hover:bg-cyan-300/20"
              >
                <Layers3 size={18} />
                Build parlay
              </button>
              <button
                onClick={() => navigate('/requests/bets')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                <ClipboardList size={18} />
                Request market
              </button>
        </div>

        {bets.length === 0 ? (
          <EmptyState title="No active bets" description="Check back later or request a new market." />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {bets.map((bet, index) => (
              <motion.article
                key={bet._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-[32px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">{bet.title}</h2>
                    {bet.description && <p className="mt-2 text-sm leading-6 text-white/60">{bet.description}</p>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-cyan-200">
                    <ChartNoAxesColumnIncreasing size={20} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-white/45">
                  <Clock size={14} />
                  <span>Ends {new Date(bet.endTime).toLocaleString()}</span>
                </div>

                <input
                  type="number"
                  min="1"
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50"
                  placeholder="Wager amount"
                  value={amount[bet._id] || ''}
                  onChange={(e) => setAmount(prev => ({ ...prev, [bet._id]: e.target.value }))}
                />

                <div className="mt-4 grid gap-3">
                  {bet.options.map((opt) => (
                    <button
                      key={opt.text}
                      onClick={() => handlePlaceBet(bet._id, opt.text)}
                      disabled={new Date() > new Date(bet.endTime)}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left transition hover:border-cyan-200/30 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span className="font-semibold">{opt.text}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-cyan-100">{opt.odds}x</span>
                      <span className="text-xs text-white/45">{opt.votes?.length || 0} picks</span>
                    </button>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
