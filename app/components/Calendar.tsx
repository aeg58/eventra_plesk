'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate, generateMonthDates, generate3MonthDates, generateYearDates, formatDateKey } from '@/app/utils/helpers';
import { PartyIcon, HeartIcon } from './Icons';
import { useSettings } from '@/app/context/SettingsContext';
import { useFilters } from '@/app/context/FilterContext';
import { useRouter } from 'next/navigation';

interface Reservation {
  id: string;
  rezervasyonNo: string;
  durum: string;
  rezervasyonTarihi: string | Date | null;
  zamanDilimi: string | null;
  davetiSayisi: number | null;
  salonId: string | null;
  Customer: {
    id: string;
    adSoyad: string;
    telefon: string | null;
    email: string | null;
  };
  ReservationDynamicValues: Array<{
    fieldKey: string;
    fieldValue: string;
  }>;
  organizasyonGrupId: string | null;
}

interface ReservationsByDate {
  [key: string]: Reservation[];
}

export default function Calendar() {
  const { calendarSettings, loading: settingsLoading } = useSettings();
  const { status, type, salon, date: filterDate } = useFilters();
  const router = useRouter();
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allReservations, setAllReservations] = useState<ReservationsByDate>({});
  const [loading, setLoading] = useState(true);
  const [organizationGroups, setOrganizationGroups] = useState<{ [key: string]: string }>({});
  const [salons, setSalons] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Organizasyon gruplarını yükle
  useEffect(() => {
    fetchOrganizationGroups();
  }, []);

  // Salonları yükle
  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchOrganizationGroups = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-gruplari', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const groupsMap: { [key: string]: string } = {};
        data.groups?.forEach((group: { id: string; name: string }) => {
          groupsMap[group.id] = group.name;
        });
        setOrganizationGroups(groupsMap);
      } else {
        console.error('Failed to fetch organization groups:', res.status);
      }
    } catch (error) {
      console.error('Error fetching organization groups:', error);
    }
  };

  const fetchSalons = async () => {
    try {
      const res = await fetch('/eventra/api/salons', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const salonsMap: { [key: string]: string } = {};
        if (Array.isArray(data)) {
          data.forEach((salon: { id: string; name: string }) => {
            salonsMap[salon.id] = salon.name;
          });
        }
        setSalons(salonsMap);
      } else {
        console.error('Failed to fetch salons:', res.status);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
    }
  };

  const fetchReservations = useCallback(async () => {
    if (dates.length === 0) return;

    try {
      setLoading(true);
      // Tarih aralığını hesapla
      const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      
      // Tarihleri local timezone'da formatla (YYYY-MM-DD)
      // Timezone sorunlarını önlemek için local timezone kullan
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);

      const res = await fetch(
        `/eventra/api/reservations/calendar?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          credentials: 'include',
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Rezervasyonları tarihe göre grupla
        const reservationsByDate: ReservationsByDate = {};
        
        if (data.reservations && Array.isArray(data.reservations)) {
          data.reservations.forEach((reservation: Reservation) => {
            // İptal durumundaki rezervasyonları filtrele
            if (reservation.rezervasyonTarihi && reservation.durum !== 'İptal') {
              // Tarih key'ini oluştur - timezone sorununu önlemek için helper fonksiyon kullan
              const dateKey = formatDateKey(reservation.rezervasyonTarihi);
              
              if (!reservationsByDate[dateKey]) {
                reservationsByDate[dateKey] = [];
              }
              reservationsByDate[dateKey].push(reservation);
            }
          });
        }
        
        setAllReservations(reservationsByDate);
      } else {
        // API hatası durumunda log
        const errorData = await res.json().catch(() => ({}));
        console.error('Calendar API error:', res.status, errorData);
        if (res.status === 401) {
          setError('Oturum süreniz dolmuş. Lütfen giriş yapın.');
          // 3 saniye sonra login sayfasına yönlendir
          setTimeout(() => {
            window.location.href = '/eventra/login';
          }, 3000);
        } else {
          setError(`Rezervasyonlar yüklenirken bir hata oluştu (${res.status}). Lütfen sayfayı yenileyin.`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      setError('Bağlantı hatası. İnternet bağlantınızı kontrol edip sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  }, [dates]);

  // Rezervasyonları yükle
  useEffect(() => {
    if (dates.length > 0) {
      fetchReservations();
    }
  }, [dates, fetchReservations]);

  // Tarih filtresine göre tarih aralığını parse et
  const parseDateFilter = (dateStr: string): { year: number; month: number } | null => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                     'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return null;
    
    const monthIndex = months.indexOf(parts[0]);
    const year = parseInt(parts[1]);
    
    if (monthIndex === -1 || isNaN(year)) return null;
    
    return { year, month: monthIndex };
  };

  useEffect(() => {
    try {
      // Settings yüklenene kadar bekle
      if (settingsLoading) {
        return;
      }

      // Tarih filtresine göre tarihleri oluştur (her zaman aylık görünüm)
      const dateFilter = parseDateFilter(filterDate);
      
      if (dateFilter) {
        // Seçilen aya göre tarihleri oluştur
        const dates: Date[] = [];
        const firstDay = new Date(dateFilter.year, dateFilter.month, 1);
        const lastDay = new Date(dateFilter.year, dateFilter.month + 1, 0);
        for (let i = 1; i <= lastDay.getDate(); i++) {
          dates.push(new Date(dateFilter.year, dateFilter.month, i));
        }
        setDates(dates);
      } else {
        // Tarih filtresi yoksa mevcut ayı göster
        setDates(generateMonthDates());
      }
      setError(null);
    } catch (err: any) {
      console.error('Calendar date generation error:', err);
      setError('Takvim yüklenirken bir hata oluştu');
      setDates(generateMonthDates());
    }
  }, [filterDate, settingsLoading]);

  // Hafta sonlarını filtrele
  const filteredDates = calendarSettings && !calendarSettings.showWeekends
    ? dates.filter(date => {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Pazar ve Cumartesi değilse
      })
    : dates;

  // Organizasyon türünü al
  const getEventType = (reservation: Reservation): string => {
    if (reservation.organizasyonGrupId && organizationGroups[reservation.organizasyonGrupId]) {
      return organizationGroups[reservation.organizasyonGrupId];
    }
    return 'Etkinlik';
  };

  // Filtrelenmiş rezervasyonları hesapla
  const filteredReservations = useMemo(() => {
    const filtered: ReservationsByDate = {};
    
    Object.keys(allReservations).forEach((dateKey) => {
      const dateReservations = allReservations[dateKey].filter((reservation) => {
        // Durum filtresi
        if (status !== 'Hepsi' && reservation.durum !== status) {
          return false;
        }
        
        // Tür filtresi (organizasyon grubu)
        if (type !== 'Hepsi') {
          const eventType = getEventType(reservation);
          if (eventType !== type) {
            return false;
          }
        }
        
        // Salon filtresi - rezervasyonun salonId'sini kontrol et
        if (salon !== 'Tümü') {
          // Salon ID'sini bul
          const salonId = Object.keys(salons).find(
            (id) => salons[id] === salon
          );
          // Eğer salon seçildi ama ID bulunamadıysa veya rezervasyonun salonId'si eşleşmiyorsa filtrele
          if (!salonId || reservation.salonId !== salonId) {
            return false;
          }
        }
        
        return true;
      });
      
      if (dateReservations.length > 0) {
        filtered[dateKey] = dateReservations;
      }
    });
    
    return filtered;
  }, [allReservations, status, type, salon, organizationGroups, salons]);

  // Tarih için rezervasyonları getir
  const getReservationsForDate = (date: Date): Reservation[] => {
    const dateKey = formatDateKey(date);
    return filteredReservations[dateKey] || [];
  };

  // Müşteri adını dinamik form verilerinden veya Customer'dan al
  const getCustomerName = (reservation: Reservation): string => {
    const damatAdi = reservation.ReservationDynamicValues?.find(v => 
      v.fieldKey === 'damat_adi' || v.fieldKey === 'damat_adSoyad' || v.fieldKey === 'damatAdSoyad'
    )?.fieldValue;
    
    const gelinAdi = reservation.ReservationDynamicValues?.find(v => 
      v.fieldKey === 'gelin_adi' || v.fieldKey === 'gelin_adSoyad' || v.fieldKey === 'gelinAdSoyad'
    )?.fieldValue;

    if (damatAdi && gelinAdi) {
      return `${damatAdi} & ${gelinAdi}`;
    } else if (damatAdi) {
      return damatAdi;
    } else if (gelinAdi) {
      return gelinAdi;
    }

    return reservation.Customer?.adSoyad || 'Müşteri';
  };

  // Durum rengini al
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Kesin':
        return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400';
      case 'Açık':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400';
      case 'İptal':
        return 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400';
    }
  };

  // Event icon'unu al
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('Düğün') || eventType.includes('düğün')) {
      return PartyIcon;
    }
    if (eventType.includes('Kına') || eventType.includes('kına') || eventType.includes('Nişan') || eventType.includes('nişan')) {
      return HeartIcon;
    }
    return PartyIcon;
  };

  // Tarih formatla (sadece gün)
  const formatDateOnly = (date: Date): string => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  // Hata durumunda göster
  if (error && dates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Takvim Yüklenemedi</h3>
              <p className="text-red-700 dark:text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings yüklenirken göster
  if (settingsLoading && dates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && dates.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      {loading && dates.length === 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Rezervasyonlar yükleniyor...</p>
        </div>
      )}
      
      {/* Calendar Grid - Ayarlara göre sütun sayısı */}
      {filteredDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Takvim yükleniyor...</p>
        </div>
      ) : (
        <div 
          className={`calendar-grid grid gap-2 md:gap-3 ${
            calendarSettings?.defaultView === 'week' 
              ? 'grid-cols-7' 
              : calendarSettings?.defaultView === 'day'
              ? 'grid-cols-1'
              : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
          }`}
        >
          {filteredDates.map((date, index) => {
          const dateReservations = getReservationsForDate(date);
          const dateKey = formatDateKey(date);
          const isToday = dateKey === formatDateKey(new Date());

          return (
            <div
              key={index}
              onClick={(e) => {
                // Eğer rezervasyon kartına tıklanmadıysa, yeni rezervasyon ekleme sayfasına git
                if (!(e.target as HTMLElement).closest('[data-reservation-card]')) {
                  const dateStr = date.toISOString().split('T')[0];
                  router.push(`/rezervasyon/yeni?tarih=${dateStr}`);
                }
              }}
              className={`bg-white dark:bg-gray-900 border rounded-lg p-2 md:p-4 hover:shadow-md transition-shadow cursor-pointer min-h-[100px] md:min-h-[120px] group ${
                isToday ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {/* Date Header */}
              <div className={`text-xs md:text-sm font-semibold mb-2 md:mb-3 pb-1 md:pb-2 border-b ${
                isToday 
                  ? 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                  : 'text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-800'
              }`}>
                {formatDate(date)}
              </div>

              {/* Reservations */}
              <div className="space-y-1 md:space-y-2">
                {dateReservations.length > 0 ? (
                  (expandedDates.has(date.toISOString().split('T')[0]) 
                    ? dateReservations 
                    : dateReservations.slice(0, 3)
                  ).map((reservation) => {
                    const customerName = getCustomerName(reservation);
                    const eventType = getEventType(reservation);
                    const Icon = getEventIcon(eventType);
                    const statusColor = getStatusColor(reservation.durum);
                    const guestCount = reservation.davetiSayisi || 0;

                    return (
                      <div
                        key={reservation.id}
                        data-reservation-card
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/rezervasyon/${reservation.id}`);
                        }}
                        className={`${statusColor} border-l-4 p-1 md:p-2 rounded text-[10px] md:text-xs group-hover:opacity-90 transition-all cursor-pointer`}
                      >
                        <div className="flex items-center gap-1 font-medium">
                          <Icon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">{customerName}</span>
                        </div>
                        <div className="text-[9px] md:text-[10px] mt-1 hidden md:block">
                          {eventType} • {reservation.durum} {guestCount > 0 ? `• ${guestCount} Kişi` : ''}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dateStr = date.toISOString().split('T')[0];
                      router.push(`/rezervasyon/yeni?tarih=${dateStr}`);
                    }}
                    className="no-print w-full text-left text-[10px] md:text-xs text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 italic opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                  >
                    + Etkinlik ekle
                  </button>
                )}
                
                {/* Daha fazla rezervasyon varsa göster */}
                {dateReservations.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dateStr = date.toISOString().split('T')[0];
                      setExpandedDates(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(dateStr)) {
                          newSet.delete(dateStr);
                        } else {
                          newSet.add(dateStr);
                        }
                        return newSet;
                      });
                    }}
                    className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                  >
                    {expandedDates.has(date.toISOString().split('T')[0]) 
                      ? `-${dateReservations.length - 3} gizle` 
                      : `+${dateReservations.length - 3} daha`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
