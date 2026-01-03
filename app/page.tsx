'use client';

import { useState, useEffect, Suspense } from 'react';
import DashboardStats from './components/DashboardStats';
import Filters from './components/Filters';
import Calendar from './components/Calendar';
import CalendarActions from './components/CalendarActions';

function HomeContent() {
  const [isStatsVisible, setIsStatsVisible] = useState(true);

  useEffect(() => {
    // localStorage'dan durumu yükle
    if (typeof window !== 'undefined') {
      const savedStatsVisible = localStorage.getItem('statsVisible');
      if (savedStatsVisible !== null) {
        setIsStatsVisible(savedStatsVisible === 'true');
      }
    }
  }, []);

  const toggleStats = () => {
    const newState = !isStatsVisible;
    setIsStatsVisible(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('statsVisible', String(newState));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Page Title */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rezervasyon Takvimi
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tüm etkinliklerinizi tek bir takvimde görüntüleyin ve yönetin
          </p>
        </div>
        {/* Toggle Button - Sadece desktop */}
        <button
          onClick={toggleStats}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title={isStatsVisible ? 'İstatistikleri Gizle' : 'İstatistikleri Göster'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isStatsVisible ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="hidden sm:inline">{isStatsVisible ? 'Gizle' : 'Göster'}</span>
        </button>
      </div>

      {/* Dashboard Stats & View Mode Selector - Sadece desktop'ta göster */}
      <div className="hidden md:block">
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isStatsVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-6">
            {/* Dashboard Stats */}
            <DashboardStats />

            {/* Calendar Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-end">
              <CalendarActions />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Filters />

      {/* Calendar */}
      <Suspense fallback={
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Takvim yükleniyor...</p>
        </div>
      }>
        <Calendar />
      </Suspense>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}

