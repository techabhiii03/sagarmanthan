interface InfoPanelProps {
  label: string;
  value: string;
  sub?: string;
}

export default function InfoPanel({ label, value, sub }: InfoPanelProps) {
  return (
    <div className="flex-1 min-w-[140px] border border-border-base bg-white rounded px-3 py-2.5">
      <div className="text-xs text-text-sub leading-snug">{label}</div>
      <div className="mt-1 text-lg font-semibold text-text-main leading-tight">{value}</div>
      {sub && <div className="mt-0.5 text-2xs text-text-sub">{sub}</div>}
    </div>
  );
}
