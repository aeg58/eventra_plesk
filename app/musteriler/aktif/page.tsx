'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerTable from '../components/CustomerTable';

interface Customer {
  id: string;
  adSoyad: string;
  telefon: string | null;
  email: string | null;
  Reservation?: Array<{
    id: string;
    rezervasyonNo: string | null;
    rezervasyonTarihi: Date | null;
    durum: string | null;
    sozlesmeFiyati: number | null;
    davetiSayisi: number | null;
    OrganizasyonGrup?: {
      name: string;
    } | null;
    Subeler?: {
      name: string;
    } | null;
  }>;
}

export default function AktifMusterilerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [durumFilter, setDurumFilter] = useState('Hepsi');
  const [turFilter, setTurFilter] = useState('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [organizationGroups, setOrganizationGroups] = useState<Array<{ id: string; name: string }>>([]);

  // Organizasyon gruplarını çek
  useEffect(() => {
    const fetchOrganizationGroups = async () => {
      try {
        const res = await fetch('/eventra/api/organizasyon-gruplari', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setOrganizationGroups(data.groups || []);
        }
      } catch (error) {
        console.error('Fetch organization groups error:', error);
      }
    };
    fetchOrganizationGroups();
  }, []);

  // Müşterileri API'den çek
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const url = new URL('/eventra/api/customers', window.location.origin);
        if (searchQuery) {
          url.searchParams.set('search', searchQuery);
        }
        
        const res = await fetch(url.toString(), {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        } else {
          setToastMessage('Müşteriler yüklenemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch (error) {
        console.error('Fetch customers error:', error);
        setToastMessage('Müşteriler yüklenirken bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [searchQuery]);

  // Müşterileri rezervasyon bilgileriyle dönüştür
  const transformedCustomers = useMemo(() => {
    return customers
      .map(customer => {
        // En son rezervasyonu al
        const latestReservation = customer.Reservation?.[0];
        
        if (!latestReservation) {
          return null; // Rezervasyonu olmayan müşterileri gösterme
        }

        // Durum filtresi
        if (durumFilter !== 'Hepsi' && latestReservation.durum !== durumFilter) {
          return null;
        }

        // Tür filtresi (organizasyon grubu)
        if (turFilter !== 'Hepsi' && latestReservation.OrganizasyonGrup?.name !== turFilter) {
          return null;
        }

        return {
          id: customer.id,
          adSoyad: customer.adSoyad || 'İsimsiz',
          telefon: customer.telefon || '',
          email: customer.email || '',
          tarih: latestReservation.rezervasyonTarihi 
            ? new Date(latestReservation.rezervasyonTarihi).toLocaleDateString('tr-TR')
            : '-',
          etkinlikTuru: latestReservation.OrganizasyonGrup?.name || '-',
          salon: latestReservation.Subeler?.name || '-',
          misafirSayisi: latestReservation.davetiSayisi || 0,
          toplamTutar: latestReservation.sozlesmeFiyati ? Number(latestReservation.sozlesmeFiyati) : 0,
          odenecekTutar: latestReservation.sozlesmeFiyati ? Number(latestReservation.sozlesmeFiyati) : 0, // TODO: Ödeme hesaplaması
          durum: latestReservation.durum || 'Açık',
          rezervasyonId: latestReservation.id,
          rezervasyonNo: latestReservation.rezervasyonNo,
        };
      })
      .filter(c => c !== null) as any[];
  }, [customers, durumFilter, turFilter]);

  // İstatistikler
  const stats = useMemo(() => {
    const kesin = transformedCustomers.filter(c => c.durum === 'Kesin').length;
    const tamamlandi = transformedCustomers.filter(c => c.durum === 'Tamamlandı').length;
    const iptal = transformedCustomers.filter(c => c.durum === 'İptal').length;
    const toplamGelir = transformedCustomers
      .filter(c => c.durum !== 'İptal')
      .reduce((sum, c) => sum + c.toplamTutar, 0);
    const bekleyenOdeme = transformedCustomers
      .filter(c => c.durum === 'Kesin')
      .reduce((sum, c) => sum + c.odenecekTutar, 0);

    return { kesin, tamamlandi, iptal, toplamGelir, bekleyenOdeme };
  }, [transformedCustomers]);

  const handleViewDetails = (id: string) => {
    const customer = transformedCustomers.find(c => c.id === id);
    if (customer?.rezervasyonId) {
      router.push(`/rezervasyon/${customer.rezervasyonId}`);
    } else {
      setToastMessage('Rezervasyon bulunamadı');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Müşteriler
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Kesinleşmiş müşterilerinizi görüntüleyin ve yönetin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">
            Kesin Rezervasyonlar
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats.kesin}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
            Tamamlanan
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.tamamlandi}
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="text-sm text-red-600 dark:text-red-400 mb-1">
            İptal Edilenler
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {stats.iptal}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
            Toplam Gelir
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
            ₺{stats.toplamGelir.toLocaleString('tr-TR')}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">
            Bekleyen Ödeme
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
            ₺{stats.bekleyenOdeme.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Arama
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Müşteri adı, telefon veya email..."
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Durum
            </label>
            <select
              value={durumFilter}
              onChange={(e) => setDurumFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Hepsi">Hepsi</option>
              <option value="Açık">Açık</option>
              <option value="Kesin">Kesin</option>
              <option value="İptal">İptal</option>
              <option value="Tamamlandı">Tamamlandı</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Etkinlik Türü
            </label>
            <select
              value={turFilter}
              onChange={(e) => setTurFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Hepsi">Hepsi</option>
              {organizationGroups.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {(durumFilter !== 'Hepsi' || turFilter !== 'Hepsi' || searchQuery) && (
            <button
              onClick={() => {
                setDurumFilter('Hepsi');
                setTurFilter('Hepsi');
                setSearchQuery('');
              }}
              className="self-end px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Müşteriler yükleniyor...</p>
        </div>
      ) : (
        <CustomerTable customers={transformedCustomers} onViewDetails={handleViewDetails} />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

