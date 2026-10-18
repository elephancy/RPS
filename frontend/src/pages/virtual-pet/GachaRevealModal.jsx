import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { applyFallbackImage, critterFallback, critterImage } from '../../utils/assetFallbacks';

const RARITY_TONE = {
  Mythical: 'from-rose-500 via-white to-cyan-300 text-rose-50',
  Legendary: 'from-amber-400 via-orange-200 to-yellow-900 text-amber-50',
  Rare: 'from-sky-500 via-cyan-200 to-blue-900 text-cyan-50',
  Uncommon: 'from-emerald-500 via-lime-200 to-emerald-900 text-emerald-50',
  Common: 'from-slate-500 via-slate-300 to-slate-800 text-slate-50'
};

function rarityOrder(rarity) {
  return ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'].indexOf(rarity);
}

function ResultCard({ item, compact = false }) {
  const tone = RARITY_TONE[item.rarity] || RARITY_TONE.Common;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${tone} p-[1px] shadow-2xl`}
    >
      <div className="relative rounded-[27px]  p-4">
        <div className="absolute inset-0 opacity-35 mix-blend-screen bg-[radial-gradient(circle_at_30%_15%,white,transparent_24%),linear-gradient(115deg,transparent_20%,rgba(255,255,255,.26),transparent_45%)]" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              {item.rarity}
            </span>
            <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-white/60">
              {item.type === 'shard' ? `${item.shards || 0} shards` : 'New'}
            </span>
          </div>
          <div className="my-5 grid place-items-center">
            <img
              src={critterImage(item.species)}
              alt={item.species}
              className={`${compact ? 'h-20 w-20' : 'h-36 w-36'} object-contain drop-shadow-[0_18px_35px_rgba(255,255,255,.22)]`}
              onError={(e) => applyFallbackImage(e, critterFallback(item.rarity))}
            />
          </div>
          <h3 className={`${compact ? 'text-base' : 'text-2xl'} font-black capitalize text-white`}>{item.species}</h3>
          {item.variant && <div className="mt-1 text-sm text-white/45">{item.variant}</div>}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(item.traits || {}).slice(0, compact ? 2 : 4).map(([key, value]) => (
              <span key={key} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs ">
                {key}: {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GachaRevealModal({ pack = 'Pack', items, onClose }) {
  const [index, setIndex] = useState(-1);
  const [skipped, setSkipped] = useState(false);
  const timerRef = useRef();

  const sorted = useMemo(
    () => [...items].sort((a, b) => rarityOrder(b.rarity) - rarityOrder(a.rarity)),
    [items]
  );

  const advance = useCallback(() => {
    timerRef.current = setTimeout(
      () => setIndex(current => Math.min(current + 1, sorted.length)),
      650
    );
  }, [sorted.length]);

  useEffect(() => {
    advance();
    return () => clearTimeout(timerRef.current);
  }, [advance]);

  useEffect(() => {
    if (!skipped && index >= 0 && index < sorted.length) {
      advance();
    }
  }, [advance, index, skipped, sorted.length]);

  const showResults = skipped || index >= sorted.length;

  const handleSkip = () => {
    clearTimeout(timerRef.current);
    setSkipped(true);
    setIndex(sorted.length);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto  px-4 py-8 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(244,114,182,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,23,.96))] p-5 shadow-2xl sm:p-7">
        <button
          type="button"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/70 transition  hover:text-white"
          onClick={onClose}
          aria-label="Close reveal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 pr-10">
          <div className="text-xs uppercase tracking-[0.34em] text-white/40">Opening</div>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">{pack}</h2>
        </div>

        {!showResults ? (
          <div className="grid min-h-[430px] place-items-center">
            {index < 0 ? (
              <motion.div
                animate={{ rotateY: [0, 18, -18, 0], scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="grid h-72 w-52 place-items-center rounded-[32px] border border-white/15 bg-gradient-to-br  to-white/5 shadow-[0_0_80px_rgba(244,114,182,.22)]"
              >
                <div className="h-28 w-28 rounded-full border border-white/20 bg-white/10" />
              </motion.div>
            ) : (
              <ResultCard item={sorted[index]} />
            )}
            <button
              type="button"
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold  transition hover:bg-white/10"
              onClick={handleSkip}
            >
              Show all results
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {sorted.map((item, itemIndex) => (
                <ResultCard key={`${item.species}-${item.variant}-${itemIndex}`} item={item} compact />
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/20"
              >
                Add to sanctuary
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
