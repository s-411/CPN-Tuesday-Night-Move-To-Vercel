import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Settings, LogOut, Plus, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Profiles', path: '/profiles' },
    { icon: Crown, label: 'Subscription', path: '/subscription' },
    { icon: Crown, label: 'Subscription', path: '/subscription' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">ProfileSync</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Add Profile Button */}
            <div className="mt-8">
              <button
                onClick={() => handleNavigation('/profiles/new')}
                className="w-full flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-3" />
                Add Profile
              </button>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}