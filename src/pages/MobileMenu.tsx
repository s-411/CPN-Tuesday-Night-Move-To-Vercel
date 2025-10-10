import { Users, TrendingUp, BarChart3, Plus, Table, Globe, Trophy, Share2, Settings, LogOut } from 'lucide-react';

interface MobileMenuProps {
  activeView: string;
  onNavigate: (view: 'dashboard' | 'girls' | 'overview' | 'analytics' | 'dataentry' | 'datavault' | 'leaderboards' | 'sharecenter' | 'settings') => void;
  onSignOut: () => void;
}

export function MobileMenu({ activeView, onNavigate, onSignOut }: MobileMenuProps) {
  const menuItems = [
    { view: 'dashboard' as const, label: 'Dashboard', icon: TrendingUp },
    { view: 'girls' as const, label: 'Girls', icon: Users },
    { view: 'dataentry' as const, label: 'Quick Data Entry', icon: Plus },
    { view: 'overview' as const, label: 'Overview', icon: Table },
    { view: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { view: 'datavault' as const, label: 'Data Vault', icon: Globe },
    { view: 'leaderboards' as const, label: 'Leaderboards', icon: Trophy },
    { view: 'sharecenter' as const, label: 'Share', icon: Share2 },
    { view: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-3xl mb-2">Menu</h2>
        <p className="text-cpn-gray">Navigate to any page</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.view}
              className={`sidebar-item ${activeView === item.view ? 'active' : ''}`}
              onClick={() => onNavigate(item.view)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}

        <div className="sidebar-item" onClick={onSignOut}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </div>
      </nav>
    </div>
  );
}
