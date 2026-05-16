interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, accent }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
      <div className="text-xs text-text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className={`font-mono text-[28px] font-bold ${accent ? "text-accent" : "text-text"}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
