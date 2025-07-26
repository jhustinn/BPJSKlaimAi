import React from 'react';
import { Home, FileText, BarChart3, Settings, HelpCircle, LogOut, User, Guitar as Hospital, Building2, Users, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, onMenuChange }) => {
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'data-sep', label: 'Data SEP', icon: FileText },
    { id: 'analisa-sep', label: 'Analisa SEP', icon: BarChart3 },
    { id: 'master-rumah-sakit', label: 'Rumah Sakit', icon: Building2 },
    { id: 'master-pasien', label: 'Pasien', icon: Users },
    { id: 'master-dokter', label: 'Dokter', icon: UserCheck },
  ];

  const bottomMenuItems = [
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
    { id: 'bantuan', label: 'Bantuan', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
    }
  };

  return (
    <div className="w-64 bg-blue-700 text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-blue-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Hospital className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold">HOSPITAL GATE</h1>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeMenu === item.id
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-blue-600">
        <ul className="space-y-1 px-3 py-4">
          {bottomMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-blue-100 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-blue-100 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Keluar</span>
            </button>
          </li>
        </ul>

        {/* User Profile */}
        <div className="px-3 py-4 border-t border-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-blue-200">Rumah Sakit Umum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
