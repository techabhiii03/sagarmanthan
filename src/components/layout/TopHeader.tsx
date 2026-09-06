import { Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/':                      'Overview',
  '/new-requirement':       'New Requirement',
  '/freight-trends':        'Freight Trends',
  '/vessel-evaluation':     'Vessel Evaluation',
  '/port-berth-data':       'Port & Berth Data',
  '/voyage-cost':           'Voyage Cost',
  '/contract-planning':     'Contract Planning',
  '/assumption-testing':    'Assumption Testing',
  '/risk-register':         'Risk Register',
  '/previous-evaluations':  'Previous Evaluations',
};

interface TopHeaderProps {
  onMenuClick: () => void;
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { pathname } = useLocation();

  // Match recommendation pages
  const isRecommendation = pathname.startsWith('/recommendation');
  const pageTitle = isRecommendation
    ? pathname.split('/').pop() || 'Recommendation'
    : pageTitles[pathname] ?? 'SagarManthan';

  return (
    <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-border-base bg-white px-4">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-text-sub hover:text-text-main"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <span className="font-semibold text-text-main text-sm">{pageTitle}</span>
      </div>

      {/* Right: meta + user */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-xs text-text-sub">
          Data last updated:&nbsp;
          <span className="text-text-main font-medium">02 Sep 2026, 18:30</span>
        </span>

        <div className="h-4 w-px bg-border-base hidden sm:block" />

        <span className="hidden sm:block text-xs text-text-sub">
          User:&nbsp;
          <span className="text-text-main font-medium">Planning Division</span>
        </span>

        <button
          onClick={() => window.location.assign('/risk-register')}
          className="relative text-text-sub hover:text-text-main"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.8} />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-risk" />
        </button>
      </div>
    </header>
  );
}
