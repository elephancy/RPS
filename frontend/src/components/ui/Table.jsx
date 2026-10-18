import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-[24px] border border-white/10 bg-white/[0.035] backdrop-blur-xl ${className}`}>
      <table className="w-full min-w-[720px] border-separate border-spacing-0">{children}</table>
    </div>
  );
}
export function THead({ children }) {
  return <thead className="text-left text-white/55">{children}</thead>;
}
export function TH({ children, className = '' }) {
  return <th className={`border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] ${className}`}>{children}</th>;
}
export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}
export function TR({ children, className = '' }) {
  return <tr className={`transition hover:bg-white/[0.055] ${className}`}>{children}</tr>;
}
export function TD({ children, className = '' }) {
  return <td className={`border-b border-white/[0.06] px-4 py-3 text-sm  ${className}`}>{children}</td>;
}
