import React, { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { ActionButton, EmptyState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page';

export default function BetRequest() {
  const [form, setForm] = useState({ title: '', market: '', oddsFormat: 'decimal', desiredOdds: '', stake: '', notes: '' });
  const [list, setList] = useState([]);

  const loadMine = async () => {
    try {
      const { data } = await api.get('/requests');
      setList(data);
    } catch {
      setList(JSON.parse(localStorage.getItem('local.betRequests') || '[]'));
    }
  };
  useEffect(() => { loadMine(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests/bets', form);
      toast.success('Request submitted');
      setForm({ title: '', market: '', oddsFormat: 'decimal', desiredOdds: '', stake: '', notes: '' });
      loadMine();
    } catch {
      const k = 'local.betRequests';
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push({ ...form, at: Date.now(), status: 'pending' });
      localStorage.setItem(k, JSON.stringify(arr));
      toast.success('Saved locally');
      setForm({ title: '', market: '', oddsFormat: 'decimal', desiredOdds: '', stake: '', notes: '' });
      loadMine();
    }
  };

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_10%_0%,rgba(244,114,182,0.13),transparent_30%),radial-gradient(circle_at_92%_6%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <div className="mx-auto max-w-5xl">
        <PageHero
          title="Request a bet"
          description="Submit a market idea for staff review. Keep it clear enough that odds and settlement rules can be created cleanly."
          actions={<StatCard label="Requests" value={list.length} tone="text-cyan-100" />}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={submit} className="grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl">
          <SectionHeader title="New request" description="Describe the market, preferred odds style, and optional stake." />
          <label className="text-sm text-white/70">Title<input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" name="title" value={form.title} onChange={onChange} required /></label>
          <label className="text-sm text-white/70">Market<input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" name="market" value={form.market} onChange={onChange} /></label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm text-white/70">Odds format
              <select className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" name="oddsFormat" value={form.oddsFormat} onChange={onChange}>
                <option value="decimal">Decimal</option>
                <option value="american">American</option>
                <option value="fractional">Fractional</option>
              </select>
            </label>
            <label className="text-sm text-white/70">Desired odds<input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" name="desiredOdds" value={form.desiredOdds} onChange={onChange} placeholder="1.85 / +120" /></label>
            <label className="text-sm text-white/70">Stake<input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" name="stake" value={form.stake} onChange={onChange} placeholder="100" /></label>
          </div>
          <label className="text-sm text-white/70">Notes<textarea className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-cyan-200/50" rows="4" name="notes" value={form.notes} onChange={onChange} /></label>
          <ActionButton variant="cyan" type="submit" className="justify-center">Submit request</ActionButton>
        </form>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl">
          <SectionHeader title="My requests" description="Track submitted and locally saved requests." />
          {list.length === 0 ? (
            <EmptyState title="No requests yet" description="Submit an idea and it will appear here." />
          ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.22em] text-white/45"><tr><th className="px-3 py-3">Title</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Odds</th><th className="px-3 py-3">Stake</th><th className="px-3 py-3">Updated</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id || r.at} className="border-t border-white/10">
                  <td className="px-3 py-3 text-white">{r.title}</td>
                  <td className="px-3 py-3 capitalize">{r.status || 'pending'}</td>
                  <td className="px-3 py-3">{r.desiredOdds}</td>
                  <td className="px-3 py-3">{r.stake}</td>
                  <td className="px-3 py-3 text-white/55">{new Date(r.updatedAt || r.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          )}
        </section>
        </div>
      </div>
    </PageFrame>
  );
}
