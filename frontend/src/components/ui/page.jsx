import { motion } from 'framer-motion';

export function PageFrame({ children, className = '' }) {
  return (
    <main className={`min-h-screen px-4 pb-24 pt-24 text-white sm:px-6 md:pb-16 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

export function PageHero({ title, description, actions, meta }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {meta && <div className="text-xs uppercase tracking-[0.35em] text-white/40">{meta}</div>}
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-white/65">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}

export function StatCard({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
      <div className="text-xs uppercase tracking-[0.24em] text-white/40">{label}</div>
      <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

export function SectionHeader({ title, description, action, className = '' }) {
  return (
    <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <h2 className="text-2xl font-black tracking-tight">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 ">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <PageFrame>
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/15 border-t-cyan-200" />
          <div>
            <div className="font-semibold text-white">{label}</div>
            <div className="mt-1 text-sm text-white/50">Preparing the latest state.</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      </div>
    </PageFrame>
  );
}

export function RiskBadge({ value }) {
  const risk = Number(value || 0);
  const label = risk >= 0.75 ? 'High risk' : risk >= 0.45 ? 'Medium risk' : 'Low risk';
  const tone = risk >= 0.75
    ? 'border-rose-300/25  text-rose-100'
    : risk >= 0.45
      ? 'border-amber-300/25  text-amber-100'
      : 'border-emerald-300/25  text-emerald-100';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-xl backdrop-blur-xl">
      <div className="mx-auto mb-4 h-2 w-20 rounded-full bg-gradient-to-r from-cyan-200 via-white to-pink-200 opacity-70" />
      <h2 className="text-2xl font-black">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ActionButton({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'border-white/10 bg-white/10 text-white hover:bg-white/15',
    cyan: 'border-cyan-200/20 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/20',
    rose: 'border-rose-200/20 bg-rose-400/10 text-rose-50 hover:bg-rose-400/20',
    emerald: 'border-emerald-200/20 bg-emerald-400/10 text-emerald-50 hover:bg-emerald-400/20',
  };
  return (
    <button
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
