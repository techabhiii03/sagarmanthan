import { Link } from 'react-router-dom';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

import PageHeading from '../components/ui/PageHeading';
import SectionHeader from '../components/ui/SectionHeader';
import InfoPanel from '../components/ui/InfoPanel';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import FreightTrendChart from '../components/charts/FreightTrendChart';

import {
  requirementsAttention,
  kpiPanels,
  operationalNotices,
  freightTrendData,
} from '../data/mockData';
import type { FreightRequirement, OperationalNotice } from '../types';

const noticeIcon = {
  warning: <AlertTriangle size={13} className="text-warning mt-0.5 shrink-0" />,
  info:    <Info         size={13} className="text-primary mt-0.5 shrink-0" />,
  alert:   <AlertCircle size={13} className="text-risk mt-0.5 shrink-0" />,
};

const columns = [
  { key: 'reference', header: 'Reference', render: (row: FreightRequirement) => (
    <span className="font-mono text-xs text-primary">{row.reference}</span>
  )},
  { key: 'material',   header: 'Material' },
  { key: 'route',      header: 'Route' },
  { key: 'quantity',   header: 'Quantity' },
  { key: 'requiredBy', header: 'Required by' },
  { key: 'status', header: 'Current position', render: (row: FreightRequirement) => (
    <StatusBadge status={row.status} />
  )},
  { key: 'action', header: 'Action', render: (row: FreightRequirement) => {
    const label = row.status === 'No immediate concern' ? 'View' : 'Review';
    return (
      <Link
        to={`/recommendation/${row.reference}`}
        className="text-xs font-medium text-primary hover:underline"
      >
        {label}
      </Link>
    );
  }},
];

export default function Overview() {
  return (
    <div className="space-y-5">
      <PageHeading
        title="Freight Planning Overview"
        description="Current market position and upcoming import requirements under evaluation."
      />

      {/* KPI Panels */}
      <div className="flex flex-wrap gap-3">
        {kpiPanels.map((p) => (
          <InfoPanel key={p.label} label={p.label} value={p.value} sub={p.sub} />
        ))}
      </div>

      {/* Requirements Table */}
      <div>
        <SectionHeader title="Requirements Requiring Attention" />
        <DataTable<FreightRequirement>
          columns={columns}
          rows={requirementsAttention}
          keyField="reference"
          emptyMessage="No requirements currently require attention."
        />
      </div>

      {/* Freight Trend Chart */}
      <div>
        <SectionHeader title="Historical Freight Trend — Panamax / Supramax (USD/MT)" />
        <div className="rounded border border-border-base bg-white px-4 pt-3 pb-4">
          <FreightTrendChart data={freightTrendData} />
        </div>
      </div>

      {/* Operational Notices */}
      <div>
        <SectionHeader title="Operational Notices" />
        <div className="rounded border border-border-base bg-white divide-y divide-border-base">
          {operationalNotices.map((notice: OperationalNotice) => (
            <div key={notice.id} className="flex items-start gap-2 px-3 py-2.5">
              {noticeIcon[notice.level]}
              <span className="text-sm text-text-main">{notice.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
