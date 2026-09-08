import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { FreightDataPoint } from '../../types';

interface FreightTrendChartProps {
  data: FreightDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded border border-border-base bg-white px-3 py-2 shadow-sm text-xs">
      <p className="mb-1 font-semibold text-text-main">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="leading-snug">
          {p.name}: <span className="font-medium">${p.value.toFixed(2)}/MT</span>
        </p>
      ))}
    </div>
  );
};

export default function FreightTrendChart({ data }: FreightTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF1" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#66717E' }}
          tickLine={false}
          axisLine={{ stroke: '#D9E0E6' }}
          interval={2}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#66717E' }}
          tickLine={false}
          axisLine={false}
          domain={['dataMin - 1', 'dataMax + 1']}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="plainline"
          iconSize={16}
          wrapperStyle={{ fontSize: '11px', color: '#66717E', paddingTop: '4px' }}
        />
        <Line
          type="monotone"
          dataKey="panamax"
          name="Panamax"
          stroke="#245B8A"
          strokeWidth={1.8}
          dot={false}
          activeDot={{ r: 3, fill: '#245B8A' }}
        />
        <Line
          type="monotone"
          dataKey="supramax"
          name="Supramax"
          stroke="#66717E"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          activeDot={{ r: 3, fill: '#66717E' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
