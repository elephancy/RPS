import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EmptyState, LoadingState, PageFrame, PageHero, StatCard } from '../../components/ui/page';

const TABS = ['pets','foods','toys','cosmetics','shards'];

export default function PetShopPage() {
  const { token } = useAuth();
  const [tab,    setTab]     = useState('pets');
  const [items,  setItems]   = useState({});
  const [balance,setBalance]= useState(0);
  const [petCoins,setPet]    = useState(0);
  const [loading,setLoad]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, uRes] = await Promise.all([
          axios.get(`${API_BASE}/api/shop/items`, { headers:{ Authorization:`Bearer ${token}` }}),
          axios.get(`${API_BASE}/api/user/me`,    { headers:{ Authorization:`Bearer ${token}` }})
        ]);
        setItems(sRes.data);
        setBalance(uRes.data.balance);
        setPet(uRes.data.resources.coins);
      } catch {
        toast.error('Failed to load shop');
      } finally {
        setLoad(false);
      }
    })();
  }, [token]);

  const buy = async (item) => {
    try {
      let url, body;
      if (item.type==='cosmetic') {
        url = '/api/shop/buy-cosmetic';
        body = { itemId:item._id };
      } else if (item.type==='pet') {
        url = '/api/shop/buy-pet';
        body = { species:item.name };
      } else {
        url = '/api/shop/buy';
        body = { itemId:item._id, quantity:item.quantity||1 };
      }
      await axios.post(`${API_BASE}${url}`, body, { headers:{ Authorization:`Bearer ${token}` }});
      toast.success(`Purchased ${item.name}`);
      if (item.coinType==='user') setBalance(b=>b - item.price);
      else                      setPet(p=>p - item.price);

      setItems(prev => ({
        ...prev,
        [tab]: prev[tab].filter(i=>i._id!==item._id)
      }));
    } catch (e) {
      toast.error(e.response?.data?.error||'Purchase failed');
    }
  };

  if (loading) {
    return <LoadingState label="Loading pet shop" />;
  }

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_5%,rgba(34,197,94,0.13),transparent_32%),radial-gradient(circle_at_88%_2%,rgba(168,85,247,0.12),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <div className="mb-4">
        <Link to="/games/virtual-pet" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Sanctuary
        </Link>
      </div>
      <PageHero
        title="Pet shop"
        description="Food, toys, cosmetics, shards, and pets for the sanctuary loop."
        actions={(
          <>
            <StatCard label="Coins" value={Number(balance || 0).toLocaleString()} tone="text-amber-100" />
            <StatCard label="Pet coins" value={Number(petCoins || 0).toLocaleString()} tone="text-emerald-100" />
          </>
        )}
      />

      <div className="mb-6 flex flex-wrap justify-center gap-2 rounded-[28px] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-xl">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? 'border-emerald-300/30  text-emerald-50' : 'border-white/10 bg-black/20 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items[tab]?.map(item => (
          <div
            key={item._id}
            className="interactive-lift flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-xl backdrop-blur-xl"
          >
            <div>
              <h4 className="text-lg font-semibold mb-1">{item.name}</h4>
              {item.rarity && <div className="text-sm text-purple-300 mb-1">Rarity: {item.rarity}</div>}
              <p className="text-sm text-white/55">
                {item.effect?.affectionBonus ? `+${item.effect.affectionBonus} affection ` : ''}
                {item.effect?.expBonus       ? `+${item.effect.expBonus} XP`      : ''}
                {item.quantity              ? ` x${item.quantity}`              : ''}
              </p>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-white/70">
                {Number(item.price || 0).toLocaleString()} {item.coinType === 'user' ? 'coins' : 'pet coins'}
              </span>
              <button onClick={()=>buy(item)} className="btn-primary px-4 py-2 text-sm">
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
      {!items[tab]?.length && (
        <div className="mt-6">
          <EmptyState title="Nothing in this category" description="Switch tabs or check back after the shop refreshes." />
        </div>
      )}
    </PageFrame>
  );
}
