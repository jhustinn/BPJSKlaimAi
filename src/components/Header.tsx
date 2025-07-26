import React from 'react';
import { Search, Bell, Wifi, Signal, Battery } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="bg-blue-700 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-200" />
            <input
              type="text"
              placeholder="Cari pasien, dokter, atau rekam medis..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-blue-600 border border-blue-500 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:bg-blue-500"
            /> */}
          </div>
        </div>

        {/* Status Icons */}
        <div className="flex items-center space-x-4">
          {/* <Signal className="w-4 h-4" /> */}
          {/* <Wifi className="w-4 h-4" /> */}
          {/* <Battery className="w-4 h-4" /> */}
          {/* <span className="text-sm font-medium">A</span> */}
        </div>
      </div>
    </header>
  );
};

export default Header
