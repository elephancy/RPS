import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import TraitDisplay from "./TraitDisplay";
import CosmeticWardrobe from "./CosmeticWardrobe";
import MiniGameHub from "./mini/MiniGameHub";
import UnlockTraitModal from "./UnlockTraitModal";
import { API_BASE } from "../../api";
import toast from "react-hot-toast";
import ExpBar from "./ExpBar";
import { applyFallbackImage, critterFallback, critterImage } from "../../utils/assetFallbacks";
import { ActionButton } from "../../components/ui/page";

export default function CritterProfile({ critter }) {
  const [data, setData] = useState(critter);
  const [shards, setShards] = useState(0);
  const [modalOpen, setModal] = useState(false);
  const [inventory, setInventory] = useState({ food: {}, toys: {} });
  const [selectedFood, setSelectedFood] = useState("");
  const [selectedToy, setSelectedToy] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    setData(prev => prev._id !== critter._id ? critter : prev);
  }, [critter]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setShards(res.data.resources.shards);
      setInventory({
        food: res.data.resources.food || {},
        toys: res.data.resources.toys || {}
      });
    })
    .catch(console.error);
  }, [token, critter._id]);

  const handleFeed = () => {
    if (!selectedFood) {
      toast.error("Select a food item first.");
      return;
    }

    axios.post(`${API_BASE}/api/critters/feed/${data._id}`, {
      foodItem: selectedFood
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setData(res.data);
      toast.success("Fed successfully.");
    })
    .catch(err => {
      toast.error(err.response?.data?.error || "Feeding failed.");
    });
  };

  const handlePlay = () => {
    if (!selectedToy) {
      toast.error("Select a toy first.");
      return;
    }

    axios.post(`${API_BASE}/api/critters/play/${data._id}`, {
      toyItem: selectedToy
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setData(res.data);
      toast.success("Play successful.");
    })
    .catch(err => {
      toast.error(err.response?.data?.error || "Play failed.");
    });
  };

  const handleEvolve = () => {
    axios.post(`${API_BASE}/api/critters/evolve`, {
      critterId: data._id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setData(res.data.critter);
      toast.success(`${res.data.critter.species} evolved.`);
    })
    .catch(err => {
      toast.error(err.response?.data?.error || "Evolve failed.");
    });
  };

  const handleTraitUnlock = (trait, newShards) => {
    setData(d => ({
      ...d,
      traits: {
        ...(d.traits || {}),
        [trait]: true
      }
    }));    setShards(newShards);
    setModal(false);
  };

  return (
    <div className="mb-4 rounded-[32px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] ">{data.rarity || 'Critter'}</div>
          <h4 className="mt-1 flex items-center gap-2 text-2xl font-black">
            {data.species}
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60">Lvl {data.level}</span>
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">{shards} shards</span>
          <ActionButton
            disabled={shards < 50}
            onClick={() => setModal(true)}
            variant="cyan"
            className="py-2"
          >
            Unlock traits
          </ActionButton>
        </div>
      </div>

      <ExpBar experience={data.experience} level={data.level} />

      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        <img
          src={critterImage(data.species)}
          alt={data.species}
          className="mx-auto h-32 w-32 rounded-[30px] border border-white/10 bg-black/20 object-contain p-3 shadow-xl sm:mx-0"
          onError={(e) => applyFallbackImage(e, critterFallback(data.rarity))}
        />

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">Food</label>
              <select
                value={selectedFood}
                onChange={e => setSelectedFood(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-hidden [&>option]:bg-slate-950"
              >
                <option value="">Select food</option>
                {Object.entries(inventory.food).map(([k, v]) => (
                  <option key={k} value={k}>{k} ({v})</option>
                ))}
              </select>
              <ActionButton onClick={handleFeed} variant="emerald" className="mt-2 w-full justify-center py-2">Feed</ActionButton>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">Toy</label>
              <select
                value={selectedToy}
                onChange={e => setSelectedToy(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-hidden [&>option]:bg-slate-950"
              >
                <option value="">Select toy</option>
                {Object.entries(inventory.toys).map(([k, v]) => (
                  <option key={k} value={k}>{k} ({v})</option>
                ))}
              </select>
              <ActionButton onClick={handlePlay} variant="cyan" className="mt-2 w-full justify-center py-2">Play</ActionButton>
            </div>
          </div>

          {!data.evolvedTo && (
            <ActionButton onClick={handleEvolve} variant="rose" className="w-full justify-center">Evolve</ActionButton>
          )}

          <TraitDisplay traits={data.traits} />
          <CosmeticWardrobe critter={data} updateCritter={setData} />

          <div className="mt-4">
            <MiniGameHub critter={data} />
          </div>
        </div>
      </div>

      <UnlockTraitModal
        critter={data}
        shards={shards}
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        onUnlock={handleTraitUnlock}
      />
    </div>
  );
}
