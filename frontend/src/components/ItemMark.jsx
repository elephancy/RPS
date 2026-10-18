export default function ItemMark({ name = 'Item', className = '' }) {
  const initials =
    String(name || 'Item')
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'IT';

  return (
    <div
      className={`grid place-items-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.34),transparent_30%),linear-gradient(145deg,rgba(34,211,238,0.18),rgba(244,114,182,0.12)_48%,rgba(15,23,42,0.72))] font-black tracking-tight  shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
