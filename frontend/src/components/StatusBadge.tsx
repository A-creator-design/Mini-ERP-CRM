const STYLES: Record<string, string> = {
  LEAD: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  INACTIVE: 'bg-slate-200 text-slate-600',
  DRAFT: 'bg-slate-200 text-slate-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-700',
  IN: 'bg-emerald-100 text-emerald-800',
  OUT: 'bg-rose-100 text-rose-700',
  RETAIL: 'bg-brand-50 text-brand-700',
  WHOLESALE: 'bg-indigo-100 text-indigo-700',
  DISTRIBUTOR: 'bg-purple-100 text-purple-700',
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${STYLES[value] || 'bg-slate-100 text-slate-700'}`}>{value}</span>;
}
