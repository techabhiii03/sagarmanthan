import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  Ship,
  Anchor,
  Calculator,
  FileText,
  TestTube2,
  AlertTriangle,
  Archive,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/',                      label: 'Overview',              icon: LayoutDashboard },
  { to: '/new-requirement',       label: 'New Requirement',       icon: PlusCircle },
  { to: '/freight-trends',        label: 'Freight Trends',        icon: TrendingUp },
  { to: '/vessel-evaluation',     label: 'Vessel Evaluation',     icon: Ship },
  { to: '/port-berth-data',       label: 'Port & Berth Data',     icon: Anchor },
  { to: '/voyage-cost',           label: 'Voyage Cost',           icon: Calculator },
  { to: '/contract-planning',     label: 'Contract Planning',     icon: FileText },
  { to: '/assumption-testing',    label: 'Assumption Testing',    icon: TestTube2 },
  { to: '/risk-register',         label: 'Risk Register',         icon: AlertTriangle },
  { to: '/previous-evaluations',  label: 'Previous Evaluations',  icon: Archive },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-navy
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-start justify-between px-4 py-4 border-b border-white/10">
          <div>
            <div className="text-white font-semibold text-base leading-tight tracking-tight">
              SagarManthan
            </div>
            <div className="text-white/50 text-[10px] leading-snug mt-0.5 font-normal">
              Freight &amp; Charter Decision Support
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/60 hover:text-white mt-0.5"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" role="navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={15} strokeWidth={1.8} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/35 text-[10px] leading-snug">
            SIH 2026 • PS 26006
          </p>
        </div>
      </aside>
    </>
  );
}
