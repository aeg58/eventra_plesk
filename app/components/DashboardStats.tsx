'use client';

import { useState, useEffect } from 'react';
import { ChartIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from './Icons';
import { useSettings } from '@/app/context/SettingsContext';

interface DashboardStatsData {
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  totalRevenue: number;
  totalPayments: number;
  pendingPayment: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  statusDistribution: Record<string, number>;
}

export default function DashboardStats() {
  const { calendarSettings } = useSettings();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tarih aralığını hesapla (bu ay)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        const res = await fetch(
          `/eventra/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setStats(data.stats);
            setError(null);
          } else {
            setError('İstatistik verisi bulunamadı. Lütfen sayfayı yenileyin.');
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 401) {
            setError('Oturum süreniz dolmuş. Lütfen giriş yapın.');
            // 3 saniye sonra login sayfasına yönlendir
            setTimeout(() => {
              window.location.href = '/eventra/login';
            }, 3000);
          } else {
            setError(errorData.message || errorData.error || 'İstatistikler yüklenemedi. Lütfen sayfayı yenileyin.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError('Bağlantı hatası. İnternet bağlantınızı kontrol edip sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Yaklaşan etkinlikler (7 gün içinde)
  const [upcomingEvents, setUpcomingEvents] = useState<number>(0);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const startDate = today.toISOString().split('T')[0];
        const endDate = nextWeek.toISOString().split('T')[0];

        const res = await fetch(
          `/eventra/api/reservations/calendar?startDate=${startDate}&endDate=${endDate}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (res.ok) {
          const data = await res.json();
          const upcoming = data.reservations?.filter((r: any) => {
            if (!r.rezervasyonTarihi) return false;
            const eventDate = new Date(r.rezervasyonTarihi);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            return eventDate >= today && eventDate <= nextWeek;
          }).length || 0;
          setUpcomingEvents(upcoming);
        }
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const statsList = stats ? [
    {
      title: 'Bu Ayki Toplam Rezervasyonlar',
      value: stats.totalReservations.toString(),
      icon: ChartIcon,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-500',
    },
    {
      title: 'Açık Rezervasyonlar',
      value: stats.statusDistribution?.['Açık']?.toString() || '0',
      icon: ClipboardListIcon,
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      iconColor: 'text-yellow-600 dark:text-yellow-500',
    },
    {
      title: 'Kesin Rezervasyonlar',
      value: stats.statusDistribution?.['Kesin']?.toString() || '0',
      icon: CheckCircleIcon,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-500',
    },
    {
      title: 'İptal Edilenler',
      value: stats.cancelledReservations.toString(),
      icon: XCircleIcon,
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-600 dark:text-red-500',
    },
    {
      title: 'Yaklaşan Etkinlikler (7 Gün)',
      value: upcomingEvents.toString(),
      icon: ClockIcon,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-500',
    },
  ] : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-12 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium mb-1">İstatistikler Yüklenemedi</p>
            <p className="text-yellow-600 dark:text-yellow-500 text-xs">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 underline hover:text-yellow-800 dark:hover:text-yellow-300"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statsList.map((stat) => (
        <div
          key={stat.title}
          className={`${stat.color} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group`}
        >
          <div className="flex items-start justify-between mb-2">
            <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
            <span className={`text-3xl font-bold ${stat.textColor} group-hover:scale-110 transition-transform`}>
              {stat.value}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {stat.title}
          </p>
        </div>
      ))}
    </div>
  );
}

