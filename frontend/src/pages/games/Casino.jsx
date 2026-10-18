import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { API_BASE } from '../../api';
import { ActionButton, PageFrame, PageHero, StatCard } from '../../components/ui/page';

const CASINO_GAMES = [
  { id: 'blackjack', label: 'Blackjack', desc: 'Dealer game with player decisions' },
  { id: 'roulette', label: 'Roulette', desc: 'Color odds and repeat spins' },
  { id: 'coin-flip', label: 'Coin Flip', desc: 'Fast even-odds rounds' },
  { id: 'slots', label: 'Slots', desc: 'Combos, reels, and luck boosts' },
];

const SLOT_SYMBOL_META = {
  '🍒': ['CH', 'Cherry', 'from-rose-400 to-red-900'],
  '🍋': ['LM', 'Lemon', 'from-yellow-300 to-amber-800'],
  '🍉': ['ML', 'Melon', 'from-emerald-300 to-rose-800'],
  '⭐': ['ST', 'Star', 'from-amber-200 to-orange-800'],
  '7️⃣': ['7', 'Seven', 'from-white to-red-700'],
  '💎': ['DM', 'Diamond', 'from-cyan-200 to-blue-900'],
  '🔔': ['BL', 'Bell', 'from-yellow-200 to-orange-700'],
  '🍇': ['GR', 'Grape', 'from-violet-300 to-purple-900'],
  '🥝': ['KW', 'Kiwi', 'from-lime-300 to-emerald-900'],
  '🎰': ['SL', 'Slot', 'from-slate-100 to-slate-800'],
  '💰': ['BN', 'Bonus', 'from-emerald-200 to-yellow-800'],
  '🍓': ['SB', 'Berry', 'from-pink-300 to-red-900'],
  '🍊': ['OR', 'Orange', 'from-orange-300 to-amber-900'],
  '👑': ['CR', 'Crown', 'from-yellow-200 to-purple-900'],
  '🃏': ['JK', 'Joker', 'from-fuchsia-300 to-slate-900'],
  '🍀': ['LK', 'Luck', 'from-green-300 to-emerald-950'],
  '🪙': ['CN', 'Coin', 'from-amber-200 to-yellow-900'],
  '🛎️': ['RG', 'Ring', 'from-amber-100 to-slate-800'],
  '🌈': ['PR', 'Prism', 'from-cyan-200 to-fuchsia-800'],
  '🔥': ['FR', 'Fire', 'from-orange-300 to-red-950'],
  '💣': ['BL', 'Blast', 'from-slate-200 to-slate-950'],
  '❔': ['?', 'Ready', 'from-white/40 to-white/5']
};

function SlotSymbol({ value }) {
  const [code, label, tone] = SLOT_SYMBOL_META[value] || [String(value || '?').slice(0, 2).toUpperCase(), 'Symbol', 'from-cyan-200 to-slate-900'];
  return (
    <div className={`grid h-full w-full place-items-center rounded-[26px] bg-gradient-to-br ${tone} p-[1px]`}>
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[25px] ">
        <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">{code}</span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.18em] ">{label}</span>
      </div>
    </div>
  );
}

export default function Casino() {
  const [game, setGame] = useState('blackjack');
  const selectedGame = CASINO_GAMES.find((entry) => entry.id === game);

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_15%_8%,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,#04070f_0%,#09090b_58%,#030303_100%)]">
      <PageHero
        title="Casino"
        description="Server-settled games with clear odds, cleaner controls, and enough motion to make each round feel deliberate."
        actions={<StatCard label="Selected" value={selectedGame?.label || 'Blackjack'} tone="text-amber-100" />}
      />

      <nav className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Casino games">
        {CASINO_GAMES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setGame(entry.id)}
            className={`group rounded-[26px] border p-4 text-left transition duration-300 hover:-translate-y-1 ${
              game === entry.id
                ? 'border-amber-200/35  shadow-[0_24px_80px_rgba(245,158,11,0.18)]'
                : 'border-white/10 bg-white/[0.055] hover:bg-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-black">{entry.label}</span>
              <span className={`h-2 w-8 rounded-full transition ${game === entry.id ? 'bg-amber-200' : 'bg-white/15 group-hover:bg-white/35'}`} />
            </div>
            <p className="mt-2 text-sm leading-5 ">{entry.desc}</p>
          </button>
        ))}
      </nav>

      <motion.section
        key={game}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28 }}
        className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl sm:p-6"
      >
        {game === 'blackjack' && <Blackjack />}
        {game === 'roulette' && <Roulette />}
        {game === 'coin-flip' && <CoinFlip />}
        {game === 'slots' && <Slots />}
      </motion.section>
    </PageFrame>
  );
}

function BetControls({
  bet,
  setBet,
  balance,
  disabled,
  children,
  autoRepeat,
  setAutoRepeat,
  repeatLimit,
  setRepeatLimit,
  repeatCount,
  limitLabel = 'Rounds',
}) {
  return (
    <div className="rounded-[28px] border border-white/10  p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Bet amount</span>
            <input
              type="number"
              min="1"
              placeholder="Enter bet"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="input px-4 py-3 text-center font-semibold outline-hidden focus:border-white/25"
              disabled={disabled}
            />
          </label>
          <ActionButton type="button" onClick={() => setBet(balance || 0)} disabled={disabled} className="self-end px-5">
            Max
          </ActionButton>
        </div>
        {children}
      </div>

      {setAutoRepeat && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm ">
          <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2">
            <input
              type="checkbox"
              checked={autoRepeat}
              onChange={() => {
                setAutoRepeat(!autoRepeat);
              }}
              disabled={disabled}
            />
            Auto-repeat
          </label>
          <label className="flex items-center gap-2">
            <span>{limitLabel}</span>
            <input
              type="number"
              min="1"
              max="100"
              value={repeatLimit}
              onChange={(e) => setRepeatLimit(Number(e.target.value))}
              className="w-20 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-center text-white outline-hidden"
              disabled={disabled || !autoRepeat}
            />
          </label>
          {autoRepeat && <span className="text-emerald-200">{repeatCount} / {repeatLimit}</span>}
          {autoRepeat && (
            <button type="button" onClick={() => setAutoRepeat(false)} className="text-rose-200 underline-offset-4 hover:underline">
              Stop
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GameHeader({ label, title, description, balance }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] ">{label}</p>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 ">{description}</p>
      </div>
      <StatCard label="Balance" value={(balance ?? 0).toLocaleString()} tone="text-cyan-100" />
    </div>
  );
}

function Roulette() {
  const { token, refreshUser, user } = useAuth();
  const [bet, setBet] = useState('');
  const [choice, setChoice] = useState('red');
  const [spinning, setSpinning] = useState(false);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [repeatLimit, setRepeatLimit] = useState(1);
  const [repeatCount, setRepeatCount] = useState(0);
  const wheelRef = useRef();
  const autoRepeatRef = useRef(autoRepeat);

  useEffect(() => {
    autoRepeatRef.current = autoRepeat;
  }, [autoRepeat]);

  const spinOnce = async () => {
    const amt = parseFloat(bet);
    if (!(amt > 0)) {
      toast.error('Enter a valid bet');
      return false;
    }

    setSpinning(true);

    try {
      const res = await fetch(`${API_BASE}/api/games/roulette`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betAmount: amt, color: choice }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const midAngles = {
        green: 9.7297 / 2,
        red: 9.7297 + 174.3243 / 2,
        black: 9.7297 + 174.3243 + 174.3243 / 2,
      };

      const wheel = wheelRef.current;
      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0deg)';
      wheel.getBoundingClientRect();

      const targetDeg = 1080 + (360 - midAngles[json.result]);
      wheel.style.transition = 'transform 2s ease-out';
      wheel.style.transform = `rotate(${targetDeg}deg)`;

      await new Promise((r) => setTimeout(r, 2000));

      if (json.win) {
        toast.success(`You hit ${json.result}! Won ${json.payout} coins!`);
      } else {
        toast.error(`Result was ${json.result}. You lost.`);
      }

      await refreshUser();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSpinning(false);
    }
  };

  const handleSpin = async (e) => {
    if (e) e.preventDefault();
    setRepeatCount(1);
    await spinOnce();

    for (let i = 1; i < repeatLimit; i++) {
      if (!autoRepeatRef.current) break;
      const success = await spinOnce();
      if (!success || user.balance < parseFloat(bet)) break;
      setRepeatCount(i + 1);
    }

    setAutoRepeat(false);
  };

  return (
    <form onSubmit={handleSpin} className="space-y-6">
      <GameHeader
        label="Roulette"
        title="Choose the lane"
        description="Red and black are steady two-times bets. Green is rare and pays much harder."
        balance={user?.balance}
      />

      <div className="wheel-container mx-auto mb-2">
        <div className="pointer" />
        <div ref={wheelRef} className="wheel" />
      </div>

      <BetControls
        bet={bet}
        setBet={setBet}
        balance={user?.balance}
        disabled={spinning}
        autoRepeat={autoRepeat}
        setAutoRepeat={(next) => {
          setAutoRepeat(next);
          setRepeatCount(0);
        }}
        repeatLimit={repeatLimit}
        setRepeatLimit={setRepeatLimit}
        repeatCount={repeatCount}
        limitLabel="Spins"
      >
        <select
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="select px-4 py-3 outline-hidden"
          disabled={spinning}
        >
          <option value="red">Red (2×)</option>
          <option value="black">Black (2×)</option>
          <option value="green">Green (14×)</option>
        </select>
      </BetControls>

      <button
        type="submit"
        disabled={spinning}
        className="btn-primary w-full px-4 py-4 disabled:opacity-45"
      >
        {spinning ? 'Spinning...' : 'Spin roulette'}
      </button>
    </form>
  );
}

function CoinFlip() {
  const { token, refreshUser, user } = useAuth();
  const [bet, setBet] = useState('');
  const [guess, setGuess] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [side, setSide] = useState('H');
  const coinRef = useRef(null);

  const [autoRepeat, setAutoRepeat] = useState(false);
  const autoRepeatRef = useRef(autoRepeat);
  const [repeatLimit, setRepeatLimit] = useState(1);
  const [repeatCount, setRepeatCount] = useState(0);

  useEffect(() => {
    autoRepeatRef.current = autoRepeat;
  }, [autoRepeat]);

  const flipOnce = async () => {
    const amt = parseFloat(bet);
    if (!(amt > 0)) {
      toast.error('Enter a valid bet');
      return false;
    }

    setFlipping(true);
    coinRef.current?.classList.add('animate-flipY');

    try {
      const res = await fetch(`${API_BASE}/api/games/coin-flip`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betAmount: amt, guess }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setSide(json.result === 'heads' ? 'H' : 'T');
      await new Promise((r) => setTimeout(r, 1000));

      if (json.win) {
        toast.success(`Correct! You won ${json.payout} coins!`);
      } else {
        toast.error(`It was ${json.result}. Better luck next time.`);
      }

      await refreshUser();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      coinRef.current?.classList.remove('animate-flipY');
      setFlipping(false);
    }
  };

  const handleFlip = async (e) => {
    if (e) e.preventDefault();
    setRepeatCount(1);
    await flipOnce();

    for (let i = 1; i < repeatLimit; i++) {
      if (!autoRepeatRef.current) break;
      const success = await flipOnce();
      if (!success || user.balance < parseFloat(bet)) break;
      setRepeatCount(i + 1);
    }

    setAutoRepeat(false);
  };

  return (
    <form onSubmit={handleFlip} className="space-y-6">
      <GameHeader
        label="Coin flip"
        title="Call the side"
        description="Fast even-odds wager. Use repeat mode only when the bet size is intentional."
        balance={user?.balance}
      />
      <div ref={coinRef} className="coin mx-auto mb-2">
        <span className="face-letter">{side}</span>
      </div>

      <BetControls
        bet={bet}
        setBet={setBet}
        balance={user?.balance}
        disabled={flipping}
        autoRepeat={autoRepeat}
        setAutoRepeat={(next) => {
          setAutoRepeat(next);
          setRepeatCount(0);
        }}
        repeatLimit={repeatLimit}
        setRepeatLimit={setRepeatLimit}
        repeatCount={repeatCount}
      >
        <select
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="select px-4 py-3 outline-hidden"
          disabled={flipping}
        >
          <option value="heads">Heads (2×)</option>
          <option value="tails">Tails (2×)</option>
        </select>
      </BetControls>

      <button
        type="submit"
        disabled={flipping}
        className="btn-primary w-full px-4 py-4 disabled:opacity-45"
      >
        {flipping ? 'Flipping...' : 'Flip coin'}
      </button>
    </form>
  );
}

function Slots() {
  const { token, refreshUser, user } = useAuth();
  const [bet, setBet] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState(['❔', '❔', '❔']);
  const [comboName, setComboName] = useState(null);
  const [settledPulse, setSettledPulse] = useState(false);

  const [autoRepeat, setAutoRepeat] = useState(false);
  const autoRepeatRef = useRef(autoRepeat);
  const [maxRepeats, setMaxRepeats] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);

  const slotsLuckEntry = user.inventory?.find(
    e => e.quantity > 0 && e.item.effectType === 'slots-luck'
  );
  const luckValue = slotsLuckEntry?.item.effectValue || 0;

  const cycleRefs = useRef([null, null, null]);
  const SYMBOLS = ['🍒','🍋','🍉','⭐','7️⃣','💎','🔔','🍇','🥝','🎰','💰','🍓','🍊','👑','🃏','🍀','🪙','🛎️','🌈','🔥','💣'];
  const MIN_SPIN_TIME = 2000;

  useEffect(() => {
    autoRepeatRef.current = autoRepeat;
  }, [autoRepeat]);

  const spinReel = (index) => {
    cycleRefs.current[index] = setInterval(() => {
      setReel((prev) => {
        const updated = [...prev];
        updated[index] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        return updated;
      });
    }, 80 + index * 40);
  };

  const stopReel = (index) => {
    clearInterval(cycleRefs.current[index]);
  };

  const performSpin = async () => {
    const amt = parseFloat(bet);
    if (!(amt > 0)) {
      toast.error('Enter a valid bet');
      return false;
    }

    setSpinning(true);
    setComboName(null);
    const startTime = Date.now();

    for (let i = 0; i < 3; i++) spinReel(i);

    try {
      const res = await fetch(`${API_BASE}/api/games/slots`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ betAmount: amt })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SPIN_TIME) {
        await new Promise((r) => setTimeout(r, MIN_SPIN_TIME - elapsed));
      }

      for (let i = 0; i < 3; i++) {
        stopReel(i);
        await new Promise((r) => setTimeout(r, 300));
        setReel((prev) => {
          const updated = [...prev];
          updated[i] = json.reel[i];
          return updated;
        });
      }

      setSettledPulse(true);
      await new Promise((r) => setTimeout(r, 500));

      if (json.win) {
        setComboName(json.combo || null);
        toast.success(json.combo
          ? `${json.combo}. Won ${json.payout} coins.`
          : `Won ${json.payout} coins.`);
      } else {
        toast.error(`Result: ${json.reel.join(' ')}. No payout.`);
      }

      await refreshUser();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setSpinning(false);
      setSettledPulse(false);
    }
  };

  const handleSpin = async (e) => {
    if (e) e.preventDefault();
    setCurrentRepeat(1);
    const success = await performSpin();

    if (!success) {
      setAutoRepeat(false);
      return;
    }

    for (let i = 1; i < maxRepeats; i++) {
      if (!autoRepeatRef.current || user.balance < parseFloat(bet)) break;
      setCurrentRepeat(i + 1);
      const ok = await performSpin();
      if (!ok) break;
    }

    setAutoRepeat(false);
  };

  return (
    <form onSubmit={handleSpin} className="space-y-6">
      <GameHeader
        label="Slots"
        title="Set the reels"
        description="A higher-variance game with named combos and item-based luck modifiers."
        balance={user?.balance}
      />
        
      {luckValue > 0 && (
      <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100">
        +{luckValue}% slot luck active
      </div>
      )}

      <div className="flex justify-center gap-3 sm:gap-5">
        {reel.map((sym, i) => (
          <motion.div
            key={i}
            animate={settledPulse ? { y: [0, -10, 0], scale: [1, 1.06, 1] } : {}}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="slot-symbol flex h-24 w-20 items-center justify-center rounded-[28px] border  bg-gradient-to-br  to-white/[0.03] p-1 shadow-inner sm:h-28 sm:w-24"
          >
            <SlotSymbol value={sym} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {comboName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-center font-semibold text-emerald-100"
          >
            Combo: {comboName}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls
        bet={bet}
        setBet={setBet}
        balance={user?.balance}
        disabled={spinning}
        autoRepeat={autoRepeat}
        setAutoRepeat={(next) => {
          setAutoRepeat(next);
          setCurrentRepeat(0);
        }}
        repeatLimit={maxRepeats}
        setRepeatLimit={setMaxRepeats}
        repeatCount={currentRepeat}
        limitLabel="Spins"
      />

      <button
        type="submit"
        disabled={spinning}
        className="btn-primary w-full px-4 py-4 disabled:opacity-45"
      >
        {spinning ? 'Rolling...' : 'Spin slots'}
      </button>
    </form>
  );
}

function Blackjack() {
  const { token, refreshUser, user } = useAuth();
  const [bet, setBet] = useState('');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadState = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/games/blackjack`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setState(json.blackjack);
    } catch (err) {
      toast.error(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const submit = async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/games/blackjack/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(endpoint === 'start' ? { betAmount: Number(bet) } : {})
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setState(json.blackjack);
      await refreshUser();
      if (json.blackjack.finished) {
        const resultText = json.blackjack.result === 'player'
          ? 'You beat the dealer.'
          : json.blackjack.result === 'push'
            ? 'Push. Bet returned.'
            : 'Dealer wins.';
        if (json.blackjack.result === 'player') {
          toast.success(resultText);
        } else if (json.blackjack.result === 'push') {
          toast(resultText);
        } else {
          toast.error(resultText);
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const playerCards = state?.playerHand || [];
  const dealerCards = state?.dealerHand || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <GameHeader
          label="Blackjack"
          title="Beat the dealer"
          description="Natural blackjack pays more. Hit, stand, or start a fresh hand after each round."
          balance={user?.balance}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HandPanel
          title="Dealer"
          cards={dealerCards}
          total={state?.active && !state?.finished ? state?.dealerTotal : state?.dealerTotal}
          hidden={!!state?.active && !state?.finished && (state?.dealerHand?.length || 0) > 0}
          placeholderText="Dealer hole card hidden"
        />
        <HandPanel
          title="You"
          cards={playerCards}
          total={state?.playerTotal}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-white/45">Bet</div>
          <input
            type="number"
            min="1"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            disabled={loading || (state?.active && !state?.finished)}
            className="input mt-2 px-4 py-3 text-white outline-hidden"
            placeholder="Enter bet"
          />
        </div>
        <button
          type="button"
          disabled={loading || (state?.active && !state?.finished) || !(Number(bet) > 0)}
          onClick={() => submit('start')}
          className="btn-primary rounded-2xl px-4 py-3 disabled:opacity-40"
        >
          Deal
        </button>
        <button
          type="button"
          disabled={loading || !state?.canHit}
          onClick={() => submit('hit')}
          className="btn-secondary rounded-2xl px-4 py-3 disabled:opacity-40"
        >
          Hit
        </button>
        <button
          type="button"
          disabled={loading || !state?.canStand}
          onClick={() => submit('stand')}
          className="btn-secondary rounded-2xl px-4 py-3 disabled:opacity-40"
        >
          Stand
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        {state?.finished ? (
          <span>
            Round complete. Result: <strong className="text-white">{state.result}</strong>
          </span>
        ) : state?.active ? (
          <span>Round live. Hit until you want to stand, or bust.</span>
        ) : (
          <span>Place a bet to start a round.</span>
        )}
      </div>
    </div>
  );
}

function HandPanel({ title, cards, total, hidden = false, placeholderText = 'Hole card hidden' }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-white/60">Total: {total ?? 0}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {cards.length ? cards.map((card, index) => (
          <div
            key={`${card}-${index}`}
            className="flex h-20 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-2xl font-semibold"
          >
            {card}
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/50">
            Waiting for cards
          </div>
        )}
        {hidden && (
          <div className="flex h-20 w-16 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-xs text-white/40">
            {placeholderText}
          </div>
        )}
      </div>
    </div>
  );
}
