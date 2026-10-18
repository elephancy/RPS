import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { TRAIT_INFO } from './TraitDisplay';

const rarityColors = {
  common:   "text-slate-200",
  uncommon: "text-emerald-200",
  rare:     "text-cyan-200",
  epic:     "text-violet-200"
};

const rarityCosts = {
  common:   30,
  uncommon: 50,
  rare:     75,
  epic:     100
};

export default function UnlockTraitModal({
  critter,
  shards,
  isOpen,
  onClose,
  onUnlock
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const ownedTraits = critter.traits && typeof critter.traits === 'object'
    ? Object.keys(critter.traits)
    : [];
  const allTraits = Object.keys(TRAIT_INFO);
  const available = allTraits.filter(t => !ownedTraits.includes(t));

  const handleUnlock = async (trait) => {
    const rarity = TRAIT_INFO[trait]?.rarity || "common";
    const cost   = rarityCosts[rarity];
    if (shards < cost) {
      toast.error(`Not enough shards! (${cost} required)`);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/traits/unlock`,
        { critterId: critter._id, trait },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Unlocked ${trait}!`);
      onUnlock(trait, res.data.newShards);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unlock failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center  px-4 backdrop-blur-xl">
      <div className="max-h-[82vh] w-full max-w-2xl overflow-auto rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,23,.96))] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] ">Trait lab</div>
            <h3 className="mt-2 text-2xl font-black">Unlock trait</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/65">{shards} shards</span>
        </div>
        {available.length === 0 ? (
          <p className="text-sm">All traits unlocked!</p>
        ) : (
          <ul className="space-y-3">
            {available.map(trait => {
              const info   = TRAIT_INFO[trait];
              const rarity = info?.rarity || "common";
              const cost   = rarityCosts[rarity];
              return (
                <li key={trait} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="pr-4">
                    <div className={`capitalize font-medium ${rarityColors[rarity]}`}>
                      {trait} <span className="text-white/40">({rarity}, {cost} shards)</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 ">{info?.desc}</p>
                  </div>
                  <button
                    disabled={loading || shards < cost}
                    onClick={() => handleUnlock(trait)}
                    className="rounded-2xl border border-cyan-200/20  px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-45"
                  >
                    Unlock
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
