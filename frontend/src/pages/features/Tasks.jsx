import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, CalendarDays, Flame, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from '../../api';
import { ActionButton, EmptyState, PageFrame, PageHero, StatCard } from '../../components/ui/page';

const tabConfig = [
  { key: 'Daily',  icon: CalendarDays, accent: 'cyan' },
  { key: 'Weekly', icon: Flame, accent: 'amber' },
  { key: 'Bonus',  icon: Award, accent: 'emerald' },
];

const typeStyles = {
  Daily:  'border-cyan-200/20 bg-cyan-300/[0.055] text-cyan-100',
  Weekly: 'border-amber-200/20 bg-amber-300/[0.055] text-amber-100',
  Bonus:  'border-emerald-200/20 bg-emerald-300/[0.055] text-emerald-100',
};

export default function Tasks() {
  const { user, token, refreshUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => {
    async function load() {
      const [ tRes, sRes ] = await Promise.all([
        fetch(`${API_BASE}/api/tasks`,      { headers:{ Authorization:`Bearer ${token}` } }),
        fetch(`${API_BASE}/api/user/stats`, { headers:{ Authorization:`Bearer ${token}` } }),
      ]);
      const { tasks: tData } = await tRes.json();
      const sData            = await sRes.json();

      const normalized = tData.map(task => {
        const progVal   = sData[task.goalType] || 0;
        const progress  = Math.min(100, (progVal / task.goalAmount) * 100);
        const complete  = progress >= 100;
        const typeLabel = task.type === 'daily'
          ? 'Daily'
          : task.type === 'weekly'
            ? 'Weekly'
            : 'Bonus';
        return { ...task, progVal, progress, complete, typeLabel };
      });

      setTasks(normalized);
    }
    load().catch(console.error);
  }, [token, user, refreshUser]);

  const handleComplete = async (taskId, title) => {
    const res  = await fetch(`${API_BASE}/api/tasks/complete`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`
      },
      body: JSON.stringify({ taskId })
    });
    const data = await res.json();
    if (res.ok) {
      try { await new Audio('/assets/sounds/success.mp3').play(); } catch {}
      toast.success(`Completed "${title}" for ${data.reward} coins`, { position: 'bottom-right' });
      setTasks(ts => ts.filter(t => t._id !== taskId));
      await refreshUser();
    } else {
      toast.error(data.error || data.message, { position: 'bottom-right' });
    }
  };

  const filtered = tasks.filter(t => t.typeLabel === activeTab);
  const completedCount = tasks.filter(task => task.complete).length;

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_18%_5%,rgba(59,130,246,0.13),transparent_32%),radial-gradient(circle_at_88%_2%,rgba(245,158,11,0.11),transparent_32%),linear-gradient(180deg,#04070f_0%,#09090b_55%,#020202_100%)]">
      <PageHero
        title="Tasks"
        description="Daily, weekly, and bonus goals that push players through different parts of the game loop."
        actions={(
          <>
            <StatCard label="Player" value={user?.username || 'Player'} tone="text-cyan-100" />
            <StatCard label="Balance" value={`${Number(user?.balance || 0).toLocaleString()} coins`} tone="text-amber-100" />
            <StatCard label="Ready" value={`${completedCount}`} tone="text-emerald-100" />
          </>
        )}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        {tabConfig.map(tab => {
          const Icon = tab.icon;
          const count = tasks.filter(task => task.typeLabel === tab.key).length;
          return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'border-white/25 bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)]'
                : 'border-white/10 bg-black/20 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {tab.key}
            <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">{count}</span>
          </button>
        );})}
      </div>
      {filtered.length > 0
        ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(task => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -4 }}
                className={`relative overflow-hidden rounded-[30px] border p-5 shadow-2xl backdrop-blur-xl ${typeStyles[task.typeLabel]}`}
              >
                <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] ">{task.goalType}</p>
                    <h2 className="mt-1 text-xl font-black text-white">{task.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/10  px-3 py-1 text-xs text-white/65">
                    {task.reward} coins
                  </span>
                </div>
                <p className="min-h-12 text-sm leading-6 ">{task.description}</p>
                <div className="mt-5 flex items-center justify-between text-xs ">
                  <span>{Number(task.progVal || 0).toLocaleString()} / {Number(task.goalAmount || 0).toLocaleString()}</span>
                  <span>{Math.floor(task.progress)}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 ">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-emerald-200 to-amber-200"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                {task.complete && (
                  <ActionButton
                    onClick={() => handleComplete(task._id, task.title)}
                    className="mt-5 w-full justify-center"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Claim reward
                  </ActionButton>
                )}
              </motion.div>
            ))}
          </div>
        : <EmptyState title="No tasks here" description="Switch categories or check back after the next task refresh." />
      }
    </PageFrame>
  );
}
