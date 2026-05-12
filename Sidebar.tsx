import type { ActiveTab, IconName } from './appTypes';
import { Icon } from './Icon';

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: IconName;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'walkthrough', label: 'Walkthrough', icon: 'compass' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'create', label: 'My Reports', icon: 'plus' },
  { id: 'view', label: 'View Reports', icon: 'search' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trending-up' },
  { id: 'ledger', label: 'Ledger', icon: 'file-text' },
];

type SidebarProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
};

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="w-72 lg:w-80 bg-white border-r min-h-[calc(100vh-88px)] sticky top-0">
      <nav className="p-5 lg:p-6 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium transition-colors ${
              activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
        <div className="mt-10 pt-8 border-t">
          <button
            onClick={onLogout}
            className="w-full text-left px-5 py-3 text-base text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Switch Clinic (Demo Logout)
          </button>
        </div>
      </nav>
    </div>
  );
}
