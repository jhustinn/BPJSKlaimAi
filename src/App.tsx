import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DataSEP from './components/DataSEP';
import AnalisaSEP from './components/AnalisaSEP';
import MasterRumahSakit from './components/MasterRumahSakit';
import MasterPasien from './components/MasterPasien';
import MasterDokter from './components/MasterDokter';

function App() {
  const [activeMenu, setActiveMenu] = useState('data-sep');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeMenu) {
      case 'data-sep':
        return <DataSEP />;
      case 'analisa-sep':
        return <AnalisaSEP />;
      case 'master-rumah-sakit':
        return <MasterRumahSakit />;
      case 'master-pasien':
        return <MasterPasien />;
      case 'master-dokter':
        return <MasterDokter />;
      case 'dashboard':
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Selamat datang di Sistem RME</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Halaman {activeMenu} sedang dalam pengembangan</p>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            
            {/* Content */}
            <main className="flex-1 overflow-y-auto">
              {renderContent()}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
