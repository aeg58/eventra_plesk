'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFilters } from '@/app/context/FilterContext';
import { useSettings } from '@/app/context/SettingsContext';

interface Status {
  id: string;
  name: string;
  slug: string;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
}

export default function Filters() {
  const { status, type, salon, date, setStatus, setType, setSalon, setDate } = useFilters();
  const { calendarSettings } = useSettings();
  
  // Başlangıçta fallback durumları set et
  const [statuses, setStatuses] = useState<Status[]>([
    { id: '1', name: 'Açık', slug: 'acik' },
    { id: '2', name: 'Kesin', slug: 'kesin' },
    { id: '3', name: 'İptal', slug: 'iptal' },
  ]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [organizationGroups, setOrganizationGroups] = useState<OrganizationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Tüm fetch'ler tamamlandığında loading'i false yap
  useEffect(() => {
    if (!loadingStatuses && !loadingSalons && !loadingOrgs) {
      setLoading(false);
    }
  }, [loadingStatuses, loadingSalons, loadingOrgs]);

  // Rezervasyon durumlarını yükle
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/eventra/api/rezervasyon-durumlari', {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          
          // API response formatını kontrol et
          let statusList: Status[] = [];
          
          if (Array.isArray(data.statuses) && data.statuses.length > 0) {
            statusList = data.statuses.map((s: any) => ({
              id: s.id || s.name,
              name: s.name,
              slug: s.slug || s.name.toLowerCase(),
            }));
          } else if (Array.isArray(data) && data.length > 0) {
            // Eğer direkt array geliyorsa
            statusList = data.map((s: any) => ({
              id: s.id || s.name,
              name: s.name,
              slug: s.slug || s.name.toLowerCase(),
            }));
          }
          
          // API'den veri geldiyse güncelle, yoksa fallback zaten set edilmiş
          if (statusList.length > 0) {
            setStatuses(statusList);
          }
        } else {
          // API hatası durumunda fallback zaten set edilmiş, sadece log
          const errorData = await res.json().catch(() => ({}));
          console.warn('Status API error:', res.status, errorData);
          // Fallback durumlar zaten başlangıçta set edilmiş
        }
      } catch (error) {
        console.error('Error fetching statuses:', error);
        // Hata durumunda fallback zaten set edilmiş
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchStatuses();
  }, []);

  // Salonları yükle
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const res = await fetch('/eventra/api/salons', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const salonList = Array.isArray(data) 
            ? data.filter((s: any) => s.isActive !== false).map((s: any) => ({
                id: s.id,
                name: s.name,
                slug: s.slug,
              }))
            : [];
          setSalons(salonList);
        }
      } catch (error) {
        console.error('Error fetching salons:', error);
        // Hata durumunda boş liste ile devam et
        setSalons([]);
      } finally {
        setLoadingSalons(false);
      }
    };

    fetchSalons();
  }, []);

  // Organizasyon gruplarını yükle (türler)
  useEffect(() => {
    const fetchOrganizationGroups = async () => {
      try {
        const res = await fetch('/eventra/api/organizasyon-gruplari', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const groups = data.groups?.filter((g: any) => g.active !== false).map((g: any) => ({
            id: g.id,
            name: g.name,
            slug: g.slug,
          })) || [];
          setOrganizationGroups(groups);
        }
      } catch (error) {
        console.error('Error fetching organization groups:', error);
        // Hata durumunda boş liste ile devam et
        setOrganizationGroups([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizationGroups();
  }, []);

  // Tarih parse et ve yıl/ay ayarla
  useEffect(() => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    if (date) {
      const parts = date.split(' ');
      if (parts.length === 2) {
        const monthIndex = months.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        if (monthIndex !== -1 && !isNaN(year)) {
          setSelectedMonth(monthIndex);
          setSelectedYear(year);
        }
      }
    }
  }, [date]);

  // Date picker dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDatePickerOpen]);

  // Yıl ve ay seçimini uygula
  const applyDateSelection = () => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const newDate = `${months[selectedMonth]} ${selectedYear}`;
    setDate(newDate);
    setIsDatePickerOpen(false);
  };

  // Durum seçeneklerini oluştur - useMemo ile optimize edildi
  const eventStatuses = useMemo(() => {
    const statusNames = statuses.length > 0 
      ? statuses.map(s => s.name)
      : ['Açık', 'Kesin', 'İptal']; // Fallback durumlar
    return ['Hepsi', ...statusNames];
  }, [statuses]);
  
  const allEventTypes = ['Hepsi', ...organizationGroups.map(g => g.name)];
  const salonOptions = ['Tümü', ...salons.map(s => s.name)];

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Filtreler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Durum Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Durum
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {eventStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Tür Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Tür
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {allEventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Salon Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Salon
          </label>
          <select
            value={salon}
            onChange={(e) => setSalon(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {salonOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Tarih Filter - Basitleştirilmiş */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Tarih
          </label>
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-left flex items-center justify-between"
            >
              <span>{date || 'Tarih Seç'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Yıl ve Ay Seçim Modal */}
            {isDatePickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-4">
                  {/* Yıl Seçimi */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Yıl
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedYear(prev => Math.max(2020, prev - 1))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="2020"
                        max="2100"
                        value={selectedYear}
                        onChange={(e) => {
                          const year = parseInt(e.target.value);
                          if (!isNaN(year) && year >= 2020 && year <= 2100) {
                            setSelectedYear(year);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => setSelectedYear(prev => Math.min(2100, prev + 1))}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Ay Seçimi */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ay
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((month, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedMonth(index)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            selectedMonth === index
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const today = new Date();
                        setSelectedYear(today.getFullYear());
                        setSelectedMonth(today.getMonth());
                        // Tarihi hemen uygula
                        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                                      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                        const newDate = `${months[today.getMonth()]} ${today.getFullYear()}`;
                        setDate(newDate);
                        setIsDateModalOpen(false);
                      }}
                      className="flex-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Bugün
                    </button>
                    <button
                      onClick={applyDateSelection}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Uygula
                    </button>
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

