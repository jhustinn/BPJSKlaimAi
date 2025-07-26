import React from 'react';
import { BarChart3, TrendingUp, Users, FileCheck } from 'lucide-react';

const AnalisaSEP: React.FC = () => {
  const stats = [
    {
      title: 'Total SEP',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: FileCheck
    },
    {
      title: 'SEP Terkirim',
      value: '987',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'SEP Menunggu',
      value: '156',
      change: '-5%',
      changeType: 'negative',
      icon: Users
    },
    {
      title: 'SEP Ditolak',
      value: '91',
      change: '+3%',
      changeType: 'negative',
      icon: BarChart3
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4">
        <span>Beranda</span> <span className="mx-2">{'>'}</span> <span className="text-blue-600 font-medium">Analisa SEP</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analisa SEP</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Trend SEP Bulanan</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chart akan ditampilkan di sini</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Status SEP Distribution</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chart akan ditampilkan di sini</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisaSEP;
