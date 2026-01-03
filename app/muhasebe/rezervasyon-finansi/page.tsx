'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatDateForInput } from '@/app/lib/dateUtils';
import { CalendarIcon } from '@/app/components/Icons';

interface ReservationPayment {
  id: string;
  rezervasyonNo: string;
  musteriAdi: string;
  salon: string;
  kapora: number;
  kalan: number;
  durum: 'Ödendi' | 'Bekliyor' | 'İptal';
  tarih: string;
  rezervasyonId?: string;
}

export default function RezervasyonFinansi() {
  const router = useRouter();
  const [payments, setPayments] = useState<ReservationPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationPayment | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [availablePaymentsForRefund, setAvailablePaymentsForRefund] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    durum: 'all',
    tarihBaslangic: '',
    tarihBitis: '',
    salonAdi: '',
    search: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    tur: 'Kapora' as 'Kapora' | 'Bakiye' | 'Ekstra Ödeme' | 'İade',
    tutar: '',
    tarih: new Date().toISOString().slice(0, 16), // datetime-local format: YYYY-MM-DDTHH:mm
    aciklama: '',
    ekstraOdemeSebep: '',
    cashBoxId: '',
    paymentMethod: 'Nakit',
    isRefund: false,
    refundPaymentId: '', // İade edilecek ödeme ID'si
  });


  const [cashBoxes, setCashBoxes] = useState<Array<{ id: string; kasaAdi: string; tur: string; bakiye: number }>>([]);

  // Summary calculations
  // Toplam kapora - negatif olamaz
  const toplamKapora = Math.max(0, payments.reduce((sum, p) => sum + (p.kapora || 0), 0));
  const kalanBakiye = payments.reduce((sum, p) => sum + (p.kalan || 0), 0);
  // Kalan bakiye gösterimi - negatif değerleri dahil etme (fazla ödeme durumunda 0 göster)
  const kalanBakiyeGosterim = payments.reduce((sum, p) => {
    // Eğer kalan negatifse (fazla ödeme), 0 olarak say
    return sum + (p.kalan < 0 ? 0 : (p.kalan || 0));
  }, 0);
  const tamamlananOdemeler = payments.filter(p => p.durum === 'Ödendi' || p.durum === 'Fazla Ödeme').length;
  const bekleyenTahsilatlar = payments.filter(p => p.durum === 'Bekliyor').length;

  // Kasaları çek
  useEffect(() => {
    const fetchCashBoxes = async () => {
      try {
        const res = await fetch('/eventra/api/cash-boxes?isActive=true', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCashBoxes((data.cashBoxes || []).map((cb: any) => ({
            id: cb.id,
            kasaAdi: cb.kasaAdi,
            tur: cb.tur,
            bakiye: (cb.currentBalance || cb.acilisBakiyesi) ? parseFloat(String(cb.currentBalance || cb.acilisBakiyesi)) : 0,
          })));
        }
      } catch (error) {
        console.error('Error fetching cash boxes:', error);
      }
    };
    fetchCashBoxes();
  }, []);

  // Rezervasyonları ve ödemelerini API'den çek (yeniden kullanılabilir fonksiyon)
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/eventra/api/reservations', window.location.origin);
      if (filters.tarihBaslangic) {
        url.searchParams.set('startDate', filters.tarihBaslangic);
      }
      if (filters.tarihBitis) {
        url.searchParams.set('endDate', filters.tarihBitis);
      }
      if (filters.search) {
        url.searchParams.set('search', filters.search);
      }

      const res = await fetch(url.toString(), {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const reservations = data.reservations || [];

        // Her rezervasyon için ödemeleri çek
        const paymentsData: ReservationPayment[] = [];
        
        for (const reservation of reservations) {
          const paymentsRes = await fetch(`/eventra/api/payments?reservationId=${reservation.id}`, {
            credentials: 'include',
          });

            let totalPaid = 0;
            if (paymentsRes.ok) {
              const paymentsData = await paymentsRes.json();
              // İptal edilmemiş ödemeleri topla (negatif tutarlar iade olarak çıkarılır)
              totalPaid = (paymentsData.payments || []).reduce((sum: number, p: any) => {
                return sum + (p.isCancelled ? 0 : Number(p.amount || 0));
              }, 0);
            }

          const totalPrice = reservation.sozlesmeFiyati ? Number(reservation.sozlesmeFiyati) : 0;
          const remaining = totalPrice - totalPaid;
          const isPaid = remaining <= 0;
          const isOverpaid = remaining < 0; // Fazla ödeme durumu
          const isCancelled = reservation.durum === 'İptal';

          // Durum filtresi
          if (filters.durum !== 'all') {
            if (filters.durum === 'Ödendi' && !isPaid && !isOverpaid) continue;
            if (filters.durum === 'Bekliyor' && (isPaid || isOverpaid || isCancelled)) continue;
            if (filters.durum === 'Fazla Ödeme' && !isOverpaid) continue;
            if (filters.durum === 'İptal' && !isCancelled) continue;
          }

          // Salon filtresi
          if (filters.salonAdi && reservation.Subeler?.name && 
              !reservation.Subeler.name.toLowerCase().includes(filters.salonAdi.toLowerCase())) {
            continue;
          }

          paymentsData.push({
            id: reservation.id,
            rezervasyonNo: reservation.rezervasyonNo || '-',
            musteriAdi: reservation.Customer?.adSoyad || 'İsimsiz',
            salon: reservation.Subeler?.name || '-',
            kapora: totalPaid,
            kalan: remaining,
            durum: isCancelled ? 'İptal' : (isOverpaid ? 'Fazla Ödeme' : (isPaid ? 'Ödendi' : 'Bekliyor')),
            tarih: reservation.rezervasyonTarihi 
              ? new Date(reservation.rezervasyonTarihi).toISOString().split('T')[0]
              : '-',
            rezervasyonId: reservation.id,
          });
        }

        setPayments(paymentsData);
      } else {
        setToastMessage('Rezervasyonlar yüklenemedi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setToastMessage('Veriler yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  }, [filters.tarihBaslangic, filters.tarihBitis, filters.search, filters.durum, filters.salonAdi]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filteredPayments = payments.filter(p => {
    if (filters.salonAdi && !p.salon.toLowerCase().includes(filters.salonAdi.toLowerCase())) return false;
    return true;
  });

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyonlar
    if (!selectedReservationId) {
      setToastMessage('Lütfen bir rezervasyon seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!paymentForm.cashBoxId) {
      setToastMessage('Lütfen bir kasa seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const tutar = parseFloat(paymentForm.tutar);
    if (isNaN(tutar) || tutar <= 0) {
      setToastMessage('Lütfen geçerli bir tutar girin (0\'dan büyük olmalıdır)');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (tutar > 1000000000) {
      setToastMessage('Tutar çok büyük (maksimum: 1.000.000.000 ₺)');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!paymentForm.tarih) {
      setToastMessage('Lütfen bir tarih seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (paymentForm.tur === 'Ekstra Ödeme' && !paymentForm.ekstraOdemeSebep) {
      setToastMessage('Ekstra ödeme için sebep belirtilmelidir');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setProcessingPayment(true);
    try {
      // Notes oluştur: Ödeme Türü + Açıklama
      let notes = '';
      if (paymentForm.tur === 'İade') {
        const selectedPayment = availablePaymentsForRefund.find(p => p.id === paymentForm.refundPaymentId);
        notes = `İADE: ${paymentForm.aciklama || selectedPayment?.notes || `Ödeme ID: ${paymentForm.refundPaymentId}`}`;
      } else if (paymentForm.tur === 'Ekstra Ödeme') {
        notes = `Ekstra Ödeme - Sebep: ${paymentForm.ekstraOdemeSebep || 'Belirtilmemiş'}. ${paymentForm.aciklama || ''}`.trim();
      } else {
        notes = `${paymentForm.tur}${paymentForm.aciklama ? ` - ${paymentForm.aciklama}` : ''}`.trim();
      }

      // İade işlemi için negatif tutar gönder
      const amount = paymentForm.tur === 'İade' ? -tutar : tutar;

      const res = await fetch('/eventra/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reservationId: selectedReservationId,
          cashBoxId: paymentForm.cashBoxId || null,
          amount: amount, // İade için negatif tutar
          paymentDate: paymentForm.tarih,
          paymentMethod: paymentForm.paymentMethod, // Ödeme yöntemi: Nakit, Kredi Kartı, vb.
          notes: notes, // Ödeme türü ve açıklama: Kapora, Bakiye, Ekstra Ödeme, İade
        }),
      });

      if (res.ok) {
        setShowPaymentModal(false);
        setToastMessage('Ödeme başarıyla kaydedildi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setPaymentForm({
          tur: 'Kapora',
          tutar: '',
          tarih: new Date().toISOString().slice(0, 16), // datetime-local format
          aciklama: '',
          ekstraOdemeSebep: '',
          cashBoxId: '',
          paymentMethod: 'Nakit',
          isRefund: false,
          refundPaymentId: '',
        });
        setAvailablePaymentsForRefund([]);
        setSelectedReservationId(null);
        // Verileri yeniden yükle (sayfa yenileme yerine)
        await fetchReservations();
      } else {
        const error = await res.json();
        setToastMessage(error.error || error.message || 'Ödeme kaydedilemedi. Lütfen tekrar deneyin.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setToastMessage(error?.message || 'Ödeme kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleViewDetail = async (payment: ReservationPayment) => {
    setSelectedReservation(payment);
    setSelectedReservationId(payment.rezervasyonId || null);
    setShowDetailModal(true);
    
    // Ödeme geçmişini çek
    if (payment.rezervasyonId) {
      try {
        setLoadingHistory(true);
        const res = await fetch(`/eventra/api/payments?reservationId=${payment.rezervasyonId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setPaymentHistory(data.payments || []);
        } else {
          setPaymentHistory([]);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        setPaymentHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  // Ödeme ekle modal'ını açarken iade için mevcut ödemeleri yükle
  const handleOpenPaymentModal = async (reservationId: string | null) => {
    setSelectedReservationId(reservationId);
    setShowPaymentModal(true);
    
    // İade için mevcut ödemeleri yükle
    if (reservationId) {
      try {
        const res = await fetch(`/eventra/api/payments?reservationId=${reservationId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          // Sadece iptal edilmemiş ve pozitif tutarlı ödemeleri göster (iade edilebilir)
          const refundablePayments = (data.payments || []).filter((p: any) => 
            !p.isCancelled && parseFloat(String(p.amount || 0)) > 0
          );
          setAvailablePaymentsForRefund(refundablePayments);
        }
      } catch (error) {
        console.error('Error fetching payments for refund:', error);
        setAvailablePaymentsForRefund([]);
      }
    }
  };

  const handleViewReservation = (rezervasyonId: string) => {
    router.push(`/rezervasyon/${rezervasyonId}`);
  };

  // İade ödeme seçildiğinde formu doldur
  const handleRefundPaymentSelect = (paymentId: string) => {
    const selectedPayment = availablePaymentsForRefund.find(p => p.id === paymentId);
    if (selectedPayment) {
      setPaymentForm(prev => ({
        ...prev,
        refundPaymentId: paymentId,
        tutar: String(Math.abs(Number(selectedPayment.amount || 0))),
        cashBoxId: selectedPayment.cashBoxId || '',
        paymentMethod: selectedPayment.paymentMethod || 'Nakit',
        aciklama: `İade: ${selectedPayment.notes || selectedPayment.Reservation?.rezervasyonNo || ''}`,
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Rezervasyon Finansı
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Rezervasyonlara ait kapora, bakiye ve iade hareketleri.
        </p>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{toastMessage || 'İşlem başarıyla tamamlandı ✅'}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Toplam Kapora</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{toplamKapora.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Kalan Bakiye</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kalanBakiyeGosterim.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tamamlanan Ödemeler</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tamamlananOdemeler}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Bekleyen Tahsilatlar</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bekleyenTahsilatlar}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Durum
            </label>
            <select
              value={filters.durum}
              onChange={(e) => setFilters(prev => ({ ...prev, durum: e.target.value }))}
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              <option value="Ödendi">Ödendi</option>
              <option value="Bekliyor">Bekliyor</option>
              <option value="Fazla Ödeme">Fazla Ödeme</option>
              <option value="İptal">İptal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Tarih Başlangıç
            </label>
            <input
              type="date"
              value={filters.tarihBaslangic}
              onChange={(e) => setFilters(prev => ({ ...prev, tarihBaslangic: e.target.value }))}
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Tarih Bitiş
            </label>
            <div className="relative">
              <input
                type="date"
                id="tarihBitis"
                value={filters.tarihBitis}
                onChange={(e) => setFilters(prev => ({ ...prev, tarihBitis: e.target.value }))}
                className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <label
                htmlFor="tarihBitis"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <CalendarIcon className="w-5 h-5" />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Salon Adı
            </label>
            <input
              type="text"
              value={filters.salonAdi}
              onChange={(e) => setFilters(prev => ({ ...prev, salonAdi: e.target.value }))}
              placeholder="Ara..."
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Arama
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Rezervasyon no, müşteri adı..."
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rezervasyon No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Müşteri Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Salon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kapora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kalan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Yükleniyor...</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz rezervasyon ödemesi bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{payment.rezervasyonNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{payment.musteriAdi}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{payment.salon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{payment.kapora.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={payment.kalan < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}>
                        {payment.kalan < 0 ? `-${Math.abs(payment.kalan).toLocaleString('tr-TR')}` : payment.kalan.toLocaleString('tr-TR')} ₺
                        {payment.kalan < 0 && <span className="ml-1 text-xs text-red-500">(Fazla)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.durum === 'Ödendi'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : payment.durum === 'Fazla Ödeme'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : payment.durum === 'Bekliyor'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {payment.durum}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{payment.tarih}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(payment)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => handleOpenPaymentModal(payment.rezervasyonId || null)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Ödeme Ekle
                        </button>
                        {payment.rezervasyonId && (
                          <button
                            onClick={() => handleViewReservation(payment.rezervasyonId!)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Rezervasyon
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ödeme Detayları - {selectedReservation.rezervasyonNo}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Müşteri</p>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">{selectedReservation.musteriAdi}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Salon</p>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">{selectedReservation.salon}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Kapora</p>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">{selectedReservation.kapora.toLocaleString('tr-TR')} ₺</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Kalan Bakiye</p>
                  <p className={`text-base font-medium ${selectedReservation.kalan < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {selectedReservation.kalan < 0 
                      ? `-${Math.abs(selectedReservation.kalan).toLocaleString('tr-TR')} ₺ (Fazla Ödeme)`
                      : `${selectedReservation.kalan.toLocaleString('tr-TR')} ₺`}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Ödeme Geçmişi</h4>
                {loadingHistory ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Yükleniyor...</p>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Henüz ödeme kaydı bulunmuyor.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Tarih</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Tutar</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Ödeme Yöntemi</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Kasa</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">Notlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paymentHistory.map((payment: any) => {
                          const amount = Number(payment.amount || 0);
                          const isRefund = amount < 0;
                          const isCancelled = payment.isCancelled;
                          
                          return (
                            <tr key={payment.id} className={isCancelled ? 'opacity-50' : ''}>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className={`px-3 py-2 font-medium ${isRefund ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {isRefund ? '-' : ''}{Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                {isRefund && <span className="ml-1 text-xs text-red-500">(İade)</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {payment.paymentMethod || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {payment.CashBox?.kasaAdi || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                {payment.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedReservation(null);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ödeme Ekle
            </h3>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Ödeme Türü
                </label>
                <select
                  value={paymentForm.tur}
                  onChange={(e) => {
                    const newTur = e.target.value as 'Kapora' | 'Bakiye' | 'Ekstra Ödeme' | 'İade';
                    setPaymentForm(prev => ({ 
                      ...prev, 
                      tur: newTur,
                      isRefund: newTur === 'İade',
                      refundPaymentId: newTur === 'İade' ? prev.refundPaymentId : '',
                      tutar: newTur === 'İade' ? prev.tutar : prev.tutar, // İade seçildiğinde tutar korunur
                    }));
                  }}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Kapora">Kapora</option>
                  <option value="Bakiye">Bakiye</option>
                  <option value="Ekstra Ödeme">Ekstra Ödeme</option>
                  <option value="İade">İade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kasa *
                </label>
                <select
                  value={paymentForm.cashBoxId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cashBoxId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Seçiniz</option>
                  {cashBoxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.kasaAdi} ({cb.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Ödeme Yöntemi *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Nakit">Nakit</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Banka Transferi">Banka Transferi</option>
                  <option value="POS">POS</option>
                </select>
              </div>
              {paymentForm.tur === 'İade' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    İade Edilecek Ödeme <span className="text-red-500">*</span>
                  </label>
                  {availablePaymentsForRefund.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                      Bu rezervasyon için iade edilebilir ödeme bulunmuyor.
                    </p>
                  ) : (
                    <select
                      value={paymentForm.refundPaymentId}
                      onChange={(e) => handleRefundPaymentSelect(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">İade edilecek ödemeyi seçin</option>
                      {availablePaymentsForRefund.map((payment: any) => (
                        <option key={payment.id} value={payment.id}>
                          {formatDate(payment.paymentDate)} - {Math.abs(Number(payment.amount || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          {payment.notes ? ` - ${payment.notes}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {paymentForm.tur === 'Ekstra Ödeme' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Ekstra Ödeme Sebebi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.ekstraOdemeSebep}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, ekstraOdemeSebep: e.target.value }))}
                    placeholder="Örn: İptal iadesi, ekstra hizmet, vb."
                    className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {paymentForm.tur === 'İade' ? 'İade Tutarı (₺)' : 'Tutar (₺)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.tutar}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, tutar: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-md border ${
                    paymentForm.tur === 'İade' 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent outline-none`}
                  required
                  max={paymentForm.tur === 'İade' && paymentForm.refundPaymentId ? 
                    Math.abs(Number(availablePaymentsForRefund.find(p => p.id === paymentForm.refundPaymentId)?.amount || 0)) : 
                    undefined
                  }
                />
                {paymentForm.tur === 'İade' && paymentForm.refundPaymentId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Maksimum: {Math.abs(Number(availablePaymentsForRefund.find(p => p.id === paymentForm.refundPaymentId)?.amount || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tarih ve Saat
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="paymentTarih"
                    value={formatDateForInput(paymentForm.tarih)}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, tarih: e.target.value }))}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <label
                    htmlFor="paymentTarih"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={paymentForm.aciklama}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    paymentForm.tur === 'İade' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {processingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {paymentForm.tur === 'İade' ? 'İade Et' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



