import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Trash2,
  Pencil,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { API_BASE } from '../../api';
import { EmptyState, PageFrame, PageHero, StatCard } from '../../components/ui/page';

export default function Services() {
  const { user, token, refreshUser } = useAuth();
  const userIdStr = user?.userId;

  const [services, setServices] = useState([]);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [history, setHistory] = useState({ asProvider: [], asBuyer: [] });
  const [selectedService, setSelectedService] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [servicesRes, purchasesRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/services?showAll=true`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/services/purchases`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/services/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (!servicesRes.ok) throw new Error('Failed to fetch services');
      const servicesData = await servicesRes.json();
      setServices(servicesData);

      setPurchases(await purchasesRes.json());
      setHistory(await historyRes.json());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  useEffect(() => {
    if (editing) setTab('my');
  }, [editing]);

  const handleCreateOrUpdate = async e => {
    e.preventDefault();
    try {
      const url = editing
        ? `${API_BASE}/api/services/${editingId}`
        : `${API_BASE}/api/services`;
      const method = editing ? 'PUT' : 'POST';
      const payload = { ...form, price: parseFloat(form.price) };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(editing ? 'Service updated' : 'Service created');
      setForm({ title: '', description: '', price: '' });
      setEditing(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async id => {
    try {
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Service deleted');
      if (editing && editingId === id) {
        setEditing(false);
        setEditingId(null);
        setForm({ title: '', description: '', price: '' });
      }
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBuyClick = service => {
    setSelectedService(service);
    setShowConfirm(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedService) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/services/buy/${selectedService._id}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Purchase successful!');
      setShowConfirm(false);
      setSelectedService(null);
      fetchData();
      refreshUser();
    } catch (err) {
      toast.error(err.message);
      setShowConfirm(false);
      setSelectedService(null);
    }
  };

  const handleFinalize = async serviceId => {
    try {
      const res = await fetch(`${API_BASE}/api/services/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ serviceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Service finalized!');
      fetchData();
      refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAccept = async serviceId => {
    try {
      const res = await fetch(`${API_BASE}/api/services/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ serviceId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success('Finalization accepted!');
      fetchData();
      refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancelBuy = () => {
    setShowConfirm(false);
    setSelectedService(null);
  };

  const filteredServices = () => {
    switch (tab) {
      case 'my':
        return services.filter(
          s => s.provider && (s.provider._id ?? s.provider.id).toString() === userIdStr
        );
      case 'purchased':
        return purchases.filter(s => !s.buyerAccepted);
      case 'history':
        return [...history.asProvider, ...history.asBuyer];
      case 'all':
      default:
        return services.filter(s => !s.buyer);
    }
  };

  const showForm = tab === 'my';
  const currentServices = filteredServices();

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_5%,rgba(16,185,129,0.13),transparent_32%),radial-gradient(circle_at_88%_2%,rgba(59,130,246,0.11),transparent_32%),linear-gradient(180deg,#04070f_0%,#09090b_55%,#020202_100%)]">
      <PageHero
        title="Services"
        description="Player-created paid services. Create offers, buy open listings, and finalize completed work from one place."
        actions={(
          <>
            <StatCard label="Open" value={services.filter(s => !s.buyer).length} tone="text-emerald-100" />
            <StatCard label="Purchases" value={purchases.length} tone="text-cyan-100" />
          </>
        )}
      />
      <div className="mb-8 flex flex-wrap justify-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] p-3 backdrop-blur-xl">
        {[
          { key: 'all', label: 'All services' },
          { key: 'my', label: 'My services' },
          { key: 'purchased', label: 'My purchases' },
          { key: 'history', label: 'History' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
              tab === key
                ? 'border-emerald-300/30  text-emerald-50 shadow-lg'
                : 'border-white/10 bg-black/20  hover:bg-white/10 hover:text-white'
            }`}
            onClick={() => {
              setTab(key);
              setEditing(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {showForm && (
        <form
          onSubmit={handleCreateOrUpdate}
          className="mx-auto mb-10 max-w-2xl space-y-4 rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur-xl"
        >
          <h2 className="text-center text-2xl font-black">
            {editing ? 'Update service' : 'Create service'}
          </h2>
          <input
            type="text"
            placeholder="Service Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="input px-4 py-3 outline-hidden"
            required
          />
          <textarea
            placeholder="Service Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input h-32 px-4 py-3 outline-hidden"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="input px-4 py-3 outline-hidden"
            required
          />
          <div className="flex justify-center gap-4">
            <button
              type="submit"
              className="btn-primary px-6 py-3"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => handleDelete(editingId)}
                className="btn-outline px-6 py-3 text-red-100"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {currentServices.map(service => {
          const providerIdStr = service.provider?._id
            ? String(service.provider._id)
            : null;

          const isOwner = userIdStr && providerIdStr && userIdStr === providerIdStr;

          const isPurchased = Boolean(service.buyer);
          const isFinalized = service.finalized;
          const buyerAccepted = service.buyerAccepted;

          return (
            <div
              key={service._id}
              className="interactive-lift relative rounded-[30px] border border-white/10 bg-white/[0.055] p-6 shadow-xl backdrop-blur-xl hover:border-white/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    service.provider?.profileImage
                      ? `${API_BASE}${service.provider.profileImage}`
                      : '/assets/avatars/default-avatar.png'
                  }
                  alt={service.provider?.username}
                  className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
                />
                <div>
                  <Link
                    to={`/profile/${service.provider?.username}`}
                    className="font-semibold hover:text-green-400 transition-colors"
                  >
                    {service.provider?.username}
                  </Link>
                  <p className="text-xs text-white/60">
                    {isFinalized && buyerAccepted
                      ? 'Completed'
                      : isFinalized
                      ? 'Finalized'
                      : 'Provider'}
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{service.title}</h3>
              <p className="text-white/75 mb-4">{service.description}</p>
              <div className="text-2xl font-bold text-green-400 mb-6">
                {Number(service.price || 0).toLocaleString()} coins
              </div>
              {service.buyer && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        service.buyer.profileImage
                          ? `${API_BASE}${service.buyer.profileImage}`
                          : '/assets/avatars/default-avatar.png'
                      }
                      className="w-8 h-8 rounded-full"
                      alt={service.buyer.username}
                    />
                    <div>
                      <p className="text-xs text-white/60">Purchased by</p>
                      <Link
                        to={`/profile/${service.buyer.username}`}
                        className="font-semibold hover:text-green-400 transition-colors"
                      >
                        {service.buyer.username}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                {isOwner && !isPurchased && !isFinalized && (
                  <>
                    <button
                      onClick={() => {
                        setForm({
                          title: service.title,
                          description: service.description,
                          price: service.price
                        });
                        setEditing(true);
                        setEditingId(service._id);
                      }}
                      className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100 flex items-center gap-1"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
                      className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-rose-100 flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
                {isOwner && isPurchased && !isFinalized && (
                  <button
                    onClick={() => handleFinalize(service._id)}
                    className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-violet-100 flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Finalize
                  </button>
                )}
                {!isOwner && !isPurchased && !isFinalized && (
                  <button
                    onClick={() => handleBuyClick(service)}
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100 flex items-center gap-1"
                  >
                    <ShoppingCart size={14} /> Buy
                  </button>
                )}
                {isPurchased && isFinalized && !buyerAccepted && (
                  <button
                    onClick={() => handleAccept(service._id)}
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100 flex items-center gap-1"
                  >
                    <ThumbsUp size={14} /> Accept
                  </button>
                )}
              </div>
              {isFinalized && service.completedAt && (
                <div className="text-sm text-white/50 mt-4">
                  Finalized on:{' '}
                  {new Date(service.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!currentServices.length && (
        <div className="mt-6">
          <EmptyState title="No services here" description="Switch tabs or create your own listing from My services." />
        </div>
      )}
      <Modal
        isOpen={showConfirm}
        onClose={handleCancelBuy}
        title="Confirm Purchase"
        onConfirm={handleConfirmPurchase}
      >
        <p>Are you sure you want to purchase this service?</p>
      </Modal>
    </PageFrame>
  );
}
