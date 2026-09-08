type StatusVariant =
  | 'Under evaluation'
  | 'Rate movement observed'
  | 'No immediate concern'
  | 'Recommended'
  | 'Feasible – inefficient'
  | 'Acceptable'
  | 'Not suitable'
  | 'High'
  | 'Medium'
  | 'Medium-Low'
  | 'Low'
  | 'Pending'
  | 'Closed';

const variantStyles: Record<StatusVariant, string> = {
  'Under evaluation':       'bg-blue-50 text-primary border border-blue-200',
  'Rate movement observed': 'bg-amber-50 text-warning border border-amber-200',
  'No immediate concern':   'bg-emerald-50 text-success border border-emerald-200',
  'Recommended':            'bg-emerald-50 text-success border border-emerald-200',
  'Feasible – inefficient': 'bg-amber-50 text-warning border border-amber-200',
  'Acceptable':             'bg-blue-50 text-primary border border-blue-200',
  'Not suitable':           'bg-red-50 text-risk border border-red-200',
  'High':                   'bg-red-50 text-risk border border-red-200',
  'Medium':                 'bg-amber-50 text-warning border border-amber-200',
  'Medium-Low':             'bg-amber-50 text-warning border border-amber-200',
  'Low':                    'bg-emerald-50 text-success border border-emerald-200',
  'Pending':                'bg-gray-50 text-text-sub border border-border-base',
  'Closed':                 'bg-gray-50 text-text-sub border border-border-base',
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = variantStyles[status as StatusVariant] ?? 'bg-gray-50 text-text-sub border border-border-base';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide whitespace-nowrap ${styles}`}>
      {status}
    </span>
  );
}
