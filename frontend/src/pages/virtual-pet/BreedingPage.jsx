import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth }      from '../../context/AuthContext';
import { API_BASE }     from '../../api';
import toast            from 'react-hot-toast';
import { Link }         from 'react-router-dom';
import { ArrowLeft }    from 'lucide-react';
import { applyFallbackImage, critterFallback, critterImage } from '../../utils/assetFallbacks';
import { ActionButton, PageFrame, PageHero, StatCard } from '../../components/ui/page';

const ONE_DAY_MS       = 24 * 60 * 60 * 1000;
const PET_COST         = 500;
const GOLD_MULTIPLIER  = 10;

const rarityHex = {
  Common:    '#9CA3AF',
  Uncommon:  '#4ADE80',
  Rare:      '#60A5FA',
  Legendary: '#C084FC',
  Mythical:  '#F472B6'
};

const rarityColors = {
  Common:    'text-gray-400',
  Uncommon:  'text-green-300',
  Rare:      'text-blue-400',
  Legendary: 'text-purple-400',
  Mythical:  'text-pink-400'
};

function formatMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const getDisplayName = c => c.variant || c.species;

function makeChildName(a, b, gen) {
  const halfA = Math.ceil(a.length / 2);
  const halfB = Math.floor(b.length / 2);
  return `${a.slice(0, halfA)}${b.slice(halfB)}-G${gen}`;
}

function CountdownCard({ critter, label, targetAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  const rem = targetAt - now;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-xl backdrop-blur-xl">
      <img
        src={critterImage(critter.species)}
        alt={getDisplayName(critter)}
        className="w-16 h-16 rounded-lg"
        onError={(e) => applyFallbackImage(e, critterFallback(critter.rarity))}
      />
      <div>
        <div className={`font-medium ${rarityColors[critter.rarity] || ''}`}>
          {getDisplayName(critter)}
        </div>
        <div className="text-sm text-yellow-400">
          {label}: {formatMs(rem)}
        </div>
      </div>
    </div>
  );
}

export default function BreedingPage() {
  const { token } = useAuth();
  const [critters, setCritters]       = useState([]);
  const [eggs, setEggs]               = useState([]);
  const [parentA, setParentA]         = useState('');
  const [parentB, setParentB]         = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pet');
  const [balanceData, setBalanceData] = useState({ gold: 0, pet: 0 });

  useEffect(() => {
    const load = () => {
      axios
        .get(`${API_BASE}/api/critters/mine`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setCritters(r.data))
        .catch(() => toast.error('Load critters failed'));

      axios
        .get(`${API_BASE}/api/breeding/eggs`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setEggs(r.data))
        .catch(() => setEggs([]));
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [token]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBalanceData({ gold: r.data.balance, pet: r.data.resources.coins }))
      .catch(console.error);
  }, [token]);

  const now = Date.now();
  const critA = critters.find(c => c._id === parentA);
  const critB = critters.find(c => c._id === parentB);

  const activeBreed = critters.filter(
    c => c.breeding?.hatchAt && new Date(c.breeding.hatchAt) > now
  );
  const cooling = critters.filter(
    c =>
      !c.breeding?.hatchAt &&
      c.lastHatchedAt &&
      now - new Date(c.lastHatchedAt) < ONE_DAY_MS
  );
  const availableParents = critters.filter(
    c => !activeBreed.includes(c) && !cooling.includes(c)
  );

  const preview = useMemo(() => {
    if (!critA || !critB) return null;
    const R = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'];
    const iA = R.indexOf(critA.rarity),
      iB = R.indexOf(critB.rarity);
    const childRarity = R[Math.min(iA, iB)];
    let childSpecies;
    if (childRarity === critA.rarity && childRarity === critB.rarity) {
      childSpecies = `${critA.species} / ${critB.species}`;
    } else {
      childSpecies = iA < iB ? critA.species : critB.species;
    }
    const generation = Math.max(critA.generation, critB.generation) + 1;
    const variant = makeChildName(
      critA.variant || critA.species,
      critB.variant || critB.species,
      generation
    );
    return { childSpecies, childRarity, generation, variant };
  }, [critA, critB]);

  const costPet = PET_COST;
  const costGold = PET_COST * GOLD_MULTIPLIER;
  const cost = paymentMethod === 'gold' ? costGold : costPet;
  const canAfford =
    paymentMethod === 'gold'
      ? balanceData.gold >= cost
      : balanceData.pet >= cost;
  const parentACd = critA?.breeding?.hatchAt && now < new Date(critA.breeding.hatchAt);
  const parentBCd = critB?.breeding?.hatchAt && now < new Date(critB.breeding.hatchAt);
  const canBreed = critA && critB && !parentACd && !parentBCd && canAfford;

  const handleBreed = () => {
    if (!canBreed) return;
    axios
      .post(
        `${API_BASE}/api/breeding/critters/breed`,
        { parentA, parentB, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => toast.success('Breeding started!'))
      .catch(e => toast.error(e.response?.data?.error || 'Failed'));
  };

  const handleHatch = id => {
    axios
      .post(
        `${API_BASE}/api/breeding/eggs/${id}/hatch`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => toast.success('Hatched!'))
      .catch(e => toast.error(e.response?.data?.error || 'Hatch failed'));
  };

  const selectClasses = 'input px-4 py-3 text-white outline-hidden [&>option]:bg-slate-950 [&>option]:text-white';

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_15%_0%,rgba(34,197,94,0.14),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(244,114,182,0.12),transparent_30%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <div className="mb-4">
        <Link
          to="/games/virtual-pet"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          title="Back to Sanctuary"
        >
          <ArrowLeft className="h-4 w-4" />
          Sanctuary
        </Link>
      </div>
      <PageHero
        meta="Sanctuary lab"
        title="Breeding lab"
        description="Pair eligible critters, preview offspring, then hatch eggs after the timer finishes."
        actions={(
          <>
            <StatCard label="Coins" value={Number(balanceData.gold || 0).toLocaleString()} tone="text-amber-100" />
            <StatCard label="Pet coins" value={Number(balanceData.pet || 0).toLocaleString()} tone="text-emerald-100" />
            <StatCard label="Eggs" value={eggs.length} tone="text-rose-100" />
          </>
        )}
      />

      <section className="grid grid-cols-1 gap-5 rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-xl backdrop-blur-xl lg:grid-cols-3">
        {['A', 'B'].map(side => {
          const setter = side === 'A' ? setParentA : setParentB;
          const val = side === 'A' ? parentA : parentB;
          return (
            <div key={side}>
              <label className="mb-2 block text-sm font-semibold ">Parent {side}</label>
              <select
                value={val}
                onChange={e => setter(e.target.value)}
                className={selectClasses}
              >
                <option value="">Choose parent</option>
                {availableParents.map(c => (
                  <option
                    key={c._id}
                    value={c._id}
                    style={{ color: rarityHex[c.rarity] }}
                  >
                    {getDisplayName(c)} (Lvl {c.level})
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        <div className="flex flex-col justify-center">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <label className={`flex cursor-pointer items-center rounded-2xl border px-4 py-3 text-sm transition ${paymentMethod === 'pet' ? 'border-emerald-200/35  text-emerald-50' : 'border-white/10 bg-black/20 text-white/65'}`}>
              <input
                type="radio"
                name="pay"
                value="pet"
                checked={paymentMethod === 'pet'}
                onChange={() => setPaymentMethod('pet')}
                className="mr-2"
              />
              Pet Coins ({PET_COST})
            </label>
            <label className={`flex cursor-pointer items-center rounded-2xl border px-4 py-3 text-sm transition ${paymentMethod === 'gold' ? 'border-amber-200/35  text-amber-50' : 'border-white/10 bg-black/20 text-white/65'}`}>
              <input
                type="radio"
                name="pay"
                value="gold"
                checked={paymentMethod === 'gold'}
                onChange={() => setPaymentMethod('gold')}
                className="mr-2"
              />
              Gold Coins ({costGold})
            </label>
          </div>
          <ActionButton
            onClick={handleBreed}
            disabled={!canBreed}
            variant="emerald"
            className="w-full justify-center"
          >
            Start breeding for {cost.toLocaleString()} {paymentMethod === 'gold' ? 'coins' : 'pet coins'}
          </ActionButton>
        </div>
      </section>
      {preview && (  
        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-xl">
          <h3 className="mb-3 text-xl font-black">Expected offspring</h3>
          <div className="flex items-center gap-4">
            <img
              src={critterImage(preview.childSpecies.split(' / ')[0])}
              alt={preview.variant}
              className="h-24 w-24 rounded-3xl border border-white/10 bg-black/20 object-contain"
              onError={(e) => applyFallbackImage(e, critterFallback(preview.childRarity))}
            />
            <div>
              <div className={`font-medium ${rarityColors[preview.childRarity]}`}>
                {preview.variant}
              </div>
              <div className="text-sm text-white/60">
                Species:{' '}
                <span className={rarityColors[preview.childRarity]}>
                  {preview.childSpecies}
                </span>
              </div>
              <div className="text-sm">
                Rarity:{' '}
                <span className={rarityColors[preview.childRarity]}>
                  {preview.childRarity}
                </span>
              </div>
              <div className="text-sm">Generation: {preview.generation}</div>
            </div>
          </div>
        </section>
      )}
      {eggs.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black">Pending eggs</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eggs.map(egg => {
              const rem = new Date(egg.hatchAt) - now;
              const ready = rem <= 0;
              return (
                <div key={egg._id} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-xl">
                  <div className={`font-medium ${rarityColors[egg.child.rarity]}`}>
                    {egg.child.variant}
                  </div>
                  <div className="text-sm text-white/60 mb-2">
                    {egg.child.species} (Gen {egg.child.generation})
                  </div>
                  <div className="text-sm mb-2">
                    {ready ? (
                      <span className="text-emerald-300">Ready to hatch</span>  
                    ) : (
                      <span className="text-yellow-400">
                        Hatches in {formatMs(rem)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleHatch(egg._id)}
                    disabled={!ready}
                    className="btn-primary btn-sm w-full disabled:opacity-50"
                  >
                    Hatch
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {activeBreed.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black">Currently breeding</h3>
          <div className="space-y-2">
            {activeBreed.map(c => (
              <CountdownCard
                key={c._id}
                critter={c}
                label="Hatches in"
                targetAt={new Date(c.breeding.hatchAt)}
              />
            ))}
          </div>
        </section>
      )}
      {cooling.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black">Cooldown</h3>
          <div className="space-y-2">
            {cooling.map(c => {
              const elapsed = now - new Date(c.lastHatchedAt);
              const rem = ONE_DAY_MS - elapsed;
              return (
                <CountdownCard
                  key={c._id}
                  critter={c}
                  label="Available in"
                  targetAt={now + rem}
                />
              );
            })}
          </div>
        </section>
      )}
    </PageFrame>
  );
}
