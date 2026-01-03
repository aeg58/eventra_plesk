'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDate, formatDateForInput } from '@/app/lib/dateUtils';
import { CalendarIcon } from '@/app/components/Icons';

interface Transaction {
  id: string;
  tarih: string;
  tur: 'Gelir' | 'Gider';
  kategori: string;
  aciklama: string;
  odemeTuru: string; // Ödeme türü: Kapora, Bakiye, Ekstra Ödeme, Genel
  odemeYontemi?: string; // Ödeme yöntemi: Nakit, Kredi Kartı, Banka Transferi, POS
  tutar: number;
  cashBoxId?: string;
  cashBoxName?: string;
  source?: 'cashbox' | 'payment';
  paymentId?: string;
}

interface CashBox {
  id: string;
  kasaAdi: string;
}

export default function FinansYonetimi() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    tarihBaslangic: '',
    tarihBitis: '',
    tur: 'all',
    kategori: 'all',
  });

  const [formData, setFormData] = useState({
    tur: 'Gelir' as 'Gelir' | 'Gider',
    kategori: '',
    tutar: '',
    odemeTuru: 'Nakit',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: '',
    cashBoxId: '',
  });

  // Verileri API'den çek
  useEffect(() => {
    fetchData();
    fetchCashBoxes();
  }, [filters]);

  const fetchCashBoxes = async () => {
    try {
      const res = await fetch('/eventra/api/cash-boxes?isActive=true', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCashBoxes(data.cashBoxes || []);
      }
    } catch (error) {
      console.error('Error fetching cash boxes:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Kasa işlemlerini ve rezervasyon ödemelerini paralel olarak çek
      const transactionParams = new URLSearchParams();
      if (filters.tarihBaslangic) transactionParams.append('startDate', filters.tarihBaslangic);
      if (filters.tarihBitis) transactionParams.append('endDate', filters.tarihBitis);
      
      const paymentParams = new URLSearchParams();
      if (filters.tarihBaslangic) paymentParams.append('startDate', filters.tarihBaslangic);
      if (filters.tarihBitis) paymentParams.append('endDate', filters.tarihBitis);
      paymentParams.append('isCancelled', 'false'); // Sadece iptal edilmemiş ödemeler
      
      const [transactionsRes, paymentsRes] = await Promise.all([
        fetch(`/eventra/api/cash-box-transactions?${transactionParams.toString()}`, {
          credentials: 'include',
        }),
        fetch(`/eventra/api/payments?${paymentParams.toString()}`, {
          credentials: 'include',
        }),
      ]);
      
      const allTransactions: any[] = [];
      
      // Kasa işlemlerini ekle (rezervasyon ödemeleri hariç - çift kayıt önlemek için)
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        const cashBoxTransactions = (transactionsData.transactions || [])
          .filter((t: any) => {
            // Sadece Gelir/Gider işlemlerini al
            if (t.islemTuru !== 'Gelir' && t.islemTuru !== 'Gider') return false;
            // Rezervasyon ödemeleri için oluşturulan cashBoxTransaction kayıtlarını hariç tut
            // (Bu kayıtlar payments tablosunda zaten var, çift kayıt önlemek için)
            const aciklama = t.aciklama || '';
            if (aciklama.includes('Rezervasyon kapora ödemesi') || 
                aciklama.includes('Kapora ödemesi') ||
                aciklama.includes('Rezervasyon ödemesi')) {
              return false;
            }
            return true;
          })
          .map((t: any) => ({
            id: t.id,
            tarih: t.tarih ? new Date(t.tarih).toISOString().split('T')[0] : '',
            tur: t.islemTuru === 'Gelir' ? 'Gelir' as const : 'Gider' as const,
            kategori: (() => {
              const aciklamaParts = t.aciklama?.split(' - ') || [];
              return aciklamaParts.length > 1 ? aciklamaParts[0] : 'Genel';
            })(),
            aciklama: (() => {
              const aciklamaParts = t.aciklama?.split(' - ') || [];
              return aciklamaParts.length > 1 ? aciklamaParts.slice(1).join(' - ') : (t.aciklama || '');
            })(),
            odemeTuru: t.CashBox_CashBoxTransaction_cashBoxIdToCashBox?.tur || 'Nakit',
            odemeYontemi: t.CashBox_CashBoxTransaction_cashBoxIdToCashBox?.tur || 'Nakit',
            tutar: parseFloat(String(t.tutar)),
            cashBoxId: t.cashBoxId,
            cashBoxName: t.CashBox_CashBoxTransaction_cashBoxIdToCashBox?.kasaAdi || '',
            source: 'cashbox',
          }));
        
        allTransactions.push(...cashBoxTransactions);
      }
      
      // Rezervasyon ödemelerini ekle (Gelir olarak, iadeler Gider olarak)
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const payments = (paymentsData.payments || [])
          .filter((p: any) => !p.isCancelled) // İptal edilmemiş ödemeler (negatif tutarlar iade için kabul edilir)
          .map((p: any) => {
            const amount = parseFloat(String(p.amount || 0));
            const isRefund = amount < 0;
            
            // Notes'tan ödeme türünü çıkar (Kapora, Bakiye, Ekstra Ödeme, İADE)
            const notes = p.notes || '';
            let odemeTuru = 'Genel';
            let aciklamaDetay = '';
            
            if (notes.startsWith('İADE:')) {
              odemeTuru = 'İade';
              aciklamaDetay = notes.replace(/^İADE:\s*/, '');
            } else if (notes.startsWith('Kapora')) {
              odemeTuru = 'Kapora';
              aciklamaDetay = notes.replace(/^Kapora\s*-\s*/, '');
            } else if (notes.startsWith('Bakiye')) {
              odemeTuru = 'Bakiye';
              aciklamaDetay = notes.replace(/^Bakiye\s*-\s*/, '');
            } else if (notes.startsWith('Ekstra Ödeme')) {
              odemeTuru = 'Ekstra Ödeme';
              aciklamaDetay = notes.replace(/^Ekstra Ödeme\s*-\s*Sebep:\s*[^.]*\.\s*/, '');
            } else {
              odemeTuru = notes || 'Genel';
            }
            
            return {
              id: `payment_${p.id}`,
              tarih: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '',
              tur: isRefund ? 'Gider' as const : 'Gelir' as const, // İade işlemleri Gider olarak gösterilir
              kategori: 'Rezervasyon',
              aciklama: `${isRefund ? 'İADE: ' : ''}Rezervasyon: ${p.Reservation?.rezervasyonNo || 'N/A'} - ${p.Reservation?.Customer?.adSoyad || 'Müşteri'}${aciklamaDetay ? ` - ${aciklamaDetay}` : ''}`,
              odemeTuru: odemeTuru, // Ödeme türü: Kapora, Bakiye, Ekstra Ödeme, İade
              odemeYontemi: p.paymentMethod || p.CashBox?.tur || 'Belirtilmemiş', // Ödeme yöntemi: Nakit, Kredi Kartı, vb.
              tutar: Math.abs(amount), // Mutlak değer (iade için de pozitif gösterilir, tur zaten Gider)
              cashBoxId: p.cashBoxId || null,
              cashBoxName: p.CashBox?.kasaAdi || '',
              source: 'payment',
              paymentId: p.id,
            };
          });
        
        allTransactions.push(...payments);
      }
      
      // Tarihe göre sırala (en yeni önce)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.tarih).getTime();
        const dateB = new Date(b.tarih).getTime();
        return dateB - dateA;
      });
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setToastMessage('Veriler yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Summary calculations
  const toplamGelir = transactions
    .filter(t => t.tur === 'Gelir')
    .reduce((sum, t) => sum + t.tutar, 0);
  
  const toplamGider = transactions
    .filter(t => t.tur === 'Gider')
    .reduce((sum, t) => sum + t.tutar, 0);
  
  const netFark = toplamGelir - toplamGider;
  
  const sonIslemTarihi = transactions.length > 0
    ? transactions.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())[0].tarih
    : '-';

  const filteredTransactions = transactions.filter(t => {
    if (filters.tur !== 'all' && t.tur !== filters.tur) return false;
    if (filters.kategori !== 'all' && t.kategori !== filters.kategori) return false;
    if (filters.tarihBaslangic && t.tarih < filters.tarihBaslangic) return false;
    if (filters.tarihBitis && t.tarih > filters.tarihBitis) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasyonlar
    if (!formData.cashBoxId) {
      setToastMessage('Lütfen bir kasa seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const tutar = parseFloat(formData.tutar);
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

    if (!formData.tarih) {
      setToastMessage('Lütfen bir tarih seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setProcessing(true);
    try {
      const islemTuru = formData.tur === 'Gelir' ? 'Gelir' : 'Gider';
      const aciklama = formData.kategori && formData.kategori !== 'Genel' 
        ? `${formData.kategori} - ${formData.aciklama || ''}`.trim()
        : formData.aciklama || formData.kategori || '';

      const url = editingTransaction 
        ? `/eventra/api/cash-box-transactions?id=${editingTransaction.id}`
        : '/eventra/api/cash-box-transactions';
      
      const method = editingTransaction ? 'PUT' : 'POST';
      
      const body = {
        cashBoxId: formData.cashBoxId,
        islemTuru,
        tutar,
        aciklama,
        tarih: formData.tarih,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setToastMessage(editingTransaction ? 'İşlem güncellendi ✅' : 'İşlem başarıyla kaydedildi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        resetForm();
        fetchData(); // Verileri yeniden yükle
      } else {
        const error = await res.json();
        setToastMessage(error.error || error.message || 'İşlem kaydedilemedi. Lütfen tekrar deneyin.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      setToastMessage(error?.message || 'İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    // Rezervasyon ödemeleri düzenlenemez (Payments tablosundan geliyor)
    if (transaction.source === 'payment') {
      setToastMessage('Rezervasyon ödemeleri buradan düzenlenemez. Rezervasyon detay sayfasından düzenleyebilirsiniz.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    setEditingTransaction(transaction);
    // Kategoriyi ve açıklamayı ayır
    const aciklamaParts = transaction.aciklama?.split(' - ') || [];
    const kategori = aciklamaParts.length > 1 ? aciklamaParts[0] : transaction.kategori;
    const aciklama = aciklamaParts.length > 1 ? aciklamaParts.slice(1).join(' - ') : transaction.aciklama;
    
    setFormData({
      tur: transaction.tur,
      kategori: kategori || '',
      tutar: transaction.tutar.toString(),
      odemeTuru: transaction.odemeTuru,
      tarih: transaction.tarih,
      aciklama: aciklama || '',
      cashBoxId: transaction.cashBoxId || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (transactionToDelete) {
      // Silinecek işlemi bul
      const transactionToDeleteObj = transactions.find(t => t.id === transactionToDelete);
      
      // Rezervasyon ödemeleri silinemez (Payments tablosundan geliyor)
      if (transactionToDeleteObj?.source === 'payment') {
        setToastMessage('Rezervasyon ödemeleri buradan silinemez. Rezervasyon detay sayfasından silebilirsiniz.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setShowDeleteModal(false);
        setTransactionToDelete(null);
        return;
      }
      
      setProcessing(true);
      try {
        const res = await fetch(`/eventra/api/cash-box-transactions?id=${transactionToDelete}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.ok) {
          setShowDeleteModal(false);
          setToastMessage('İşlem başarıyla silindi ✅');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setTransactionToDelete(null);
          fetchData(); // Verileri yeniden yükle
        } else {
          const error = await res.json();
          setToastMessage(error.error || error.message || 'İşlem silinemedi. Lütfen tekrar deneyin.');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
        }
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        setToastMessage(error?.message || 'İşlem silinirken bir hata oluştu. Lütfen tekrar deneyin.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } finally {
        setProcessing(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tur: 'Gelir',
      kategori: '',
      tutar: '',
      odemeTuru: 'Nakit',
      tarih: new Date().toISOString().split('T')[0],
      aciklama: '',
      cashBoxId: '',
    });
    setEditingTransaction(null);
  };

  const kategoriler = ['Yemek', 'İçecek', 'Süsleme', 'Müzik', 'Fotoğraf', 'Video', 'Diğer'];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Finans Yönetimi
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tüm gelir ve gider hareketlerinizi yönetin.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + Yeni İşlem
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{toastMessage || 'İşlem başarıyla kaydedildi ✅'}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Toplam Gelir</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{toplamGelir.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Toplam Gider</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{toplamGider.toLocaleString('tr-TR')} ₺</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Net Fark</p>
          <p className={`text-2xl font-bold ${netFark >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {netFark.toLocaleString('tr-TR')} ₺
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Son İşlem Tarihi</p>
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-200">{sonIslemTarihi}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Tarih Başlangıç
            </label>
            <div className="relative">
              <input
                type="date"
                id="tarihBaslangic"
                value={filters.tarihBaslangic}
                onChange={(e) => setFilters(prev => ({ ...prev, tarihBaslangic: e.target.value }))}
                className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <label
                htmlFor="tarihBaslangic"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <CalendarIcon className="w-5 h-5" />
              </label>
            </div>
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
              Tür
            </label>
            <select
              value={filters.tur}
              onChange={(e) => setFilters(prev => ({ ...prev, tur: e.target.value }))}
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              <option value="Gelir">Gelir</option>
              <option value="Gider">Gider</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Kategori
            </label>
            <select
              value={filters.kategori}
              onChange={(e) => setFilters(prev => ({ ...prev, kategori: e.target.value }))}
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              {kategoriler.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ödeme Türü</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tutar (₺)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Yükleniyor...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz işlem bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{formatDate(transaction.tarih)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.tur === 'Gelir'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {transaction.tur}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{transaction.kategori}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <div>{transaction.aciklama}</div>
                        {transaction.cashBoxName && (
                          <div className="text-xs text-slate-400 mt-1">Kasa: {transaction.cashBoxName}</div>
                        )}
                      </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <div>{transaction.odemeTuru}</div>
                        {transaction.odemeYontemi && transaction.odemeYontemi !== transaction.odemeTuru && (
                          <div className="text-xs text-slate-400 mt-1">Yöntem: {transaction.odemeYontemi}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {transaction.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {transaction.source === 'payment' ? (
                          <span className="text-xs text-slate-400 italic">Rezervasyon Ödemesi</span>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(transaction);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(transaction.id);
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 cursor-pointer transition-colors"
                            >
                              Sil
                            </button>
                          </>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingTransaction ? 'İşlem Düzenle' : 'Yeni İşlem'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kasa *
                </label>
                <select
                  value={formData.cashBoxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cashBoxId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Seçiniz</option>
                  {cashBoxes.map(cb => (
                    <option key={cb.id} value={cb.id}>{cb.kasaAdi}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tür
                </label>
                <select
                  value={formData.tur}
                  onChange={(e) => setFormData(prev => ({ ...prev, tur: e.target.value as 'Gelir' | 'Gider' }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Gelir">Gelir</option>
                  <option value="Gider">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz (Opsiyonel)</option>
                  {kategoriler.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tutar}
                  onChange={(e) => setFormData(prev => ({ ...prev, tutar: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tarih *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="formTarih"
                    value={formData.tarih}
                    onChange={(e) => setFormData(prev => ({ ...prev, tarih: e.target.value }))}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <label
                    htmlFor="formTarih"
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
                  value={formData.aciklama}
                  onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                  rows={3}
                  placeholder="İşlem açıklaması..."
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processing && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {editingTransaction ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              İşlemi Sil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bu işlemi silmek istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTransactionToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



