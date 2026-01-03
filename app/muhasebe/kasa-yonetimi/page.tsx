'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatDate, formatDateForInput } from '@/app/lib/dateUtils';
import { CalendarIcon } from '@/app/components/Icons';

interface Transaction {
  id: string;
  tarih: string;
  aciklama: string;
  islemTuru: 'Giriş' | 'Çıkış' | 'Transfer';
  tutar: number;
  yeniBakiye: number;
}

interface CashBox {
  id: string;
  kasaAdi: string;
  tur: 'Nakit' | 'POS' | 'Banka' | 'Kredi Kartı';
  iban?: string;
  dovizCinsi: 'TL' | 'USD' | 'EUR';
  bakiye: number;
  transactions: Transaction[];
}

export default function KasaYonetimi() {
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [showEditCashModal, setShowEditCashModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCashBox, setSelectedCashBox] = useState<CashBox | null>(null);
  const [editingCashBox, setEditingCashBox] = useState<CashBox | null>(null);
  const [showNewTransactionDropdown, setShowNewTransactionDropdown] = useState(false);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [processingCashBox, setProcessingCashBox] = useState(false);
  
  const [filters, setFilters] = useState({
    tur: 'all',
    arama: '',
    siralama: 'bakiye-desc',
  });

  // Kasaları API'den çek
  useEffect(() => {
    const fetchCashBoxes = async () => {
      try {
        setLoading(true);
        const res = await fetch('/eventra/api/cash-boxes?isActive=true', {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Kasalar API\'den alındı:', data.cashBoxes?.length || 0, 'kasa');
          const cashBoxesData = (data.cashBoxes || []).map((cb: any) => ({
            id: cb.id,
            kasaAdi: cb.kasaAdi,
            tur: cb.tur as 'Nakit' | 'POS' | 'Banka' | 'Kredi Kartı',
            iban: cb.iban || undefined,
            dovizCinsi: cb.dovizCinsi as 'TL' | 'USD' | 'EUR',
            bakiye: (cb.currentBalance || cb.acilisBakiyesi) ? parseFloat(String(cb.currentBalance || cb.acilisBakiyesi)) : 0,
            transactions: [],
          }));
          console.log('İşlenmiş kasalar:', cashBoxesData.length);
          setCashBoxes(cashBoxesData);
        } else {
          setToastMessage('Kasalar yüklenemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch (error) {
        console.error('Error fetching cash boxes:', error);
        setToastMessage('Kasalar yüklenirken bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchCashBoxes();
  }, []);

  const [addCashForm, setAddCashForm] = useState({
    kasaAdi: '',
    tur: 'Nakit' as 'Nakit' | 'POS' | 'Banka' | 'Kredi Kartı',
    iban: '',
    dovizCinsi: 'TL' as 'TL' | 'USD' | 'EUR',
    acilisBakiyesi: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    islemTuru: 'Giriş' as 'Giriş' | 'Çıkış' | 'Transfer',
    kaynakKasa: '',
    hedefKasa: '',
    tutar: '',
    aciklama: '',
    tarih: new Date().toISOString().slice(0, 16), // datetime-local format
  });

  // Seçilen kasanın bilgilerini al
  const selectedCashBoxInfo = cashBoxes.find(cb => cb.id === transactionForm.kaynakKasa);
  const selectedHedefCashBoxInfo = cashBoxes.find(cb => cb.id === transactionForm.hedefKasa);

  // Summary calculations
  const toplamBakiye = cashBoxes.reduce((sum, c) => sum + c.bakiye, 0);
  const enYuksekBakiye = cashBoxes.length > 0
    ? Math.max(...cashBoxes.map(c => c.bakiye))
    : 0;
  const enDusukBakiye = cashBoxes.length > 0
    ? Math.min(...cashBoxes.map(c => c.bakiye))
    : 0;
  const aktifKasaSayisi = cashBoxes.length;

  // Filtered and sorted cash boxes
  const filteredAndSortedCashBoxes = useMemo(() => {
    let filtered = cashBoxes.filter(cb => {
      if (filters.tur !== 'all' && cb.tur !== filters.tur) return false;
      if (filters.arama && !cb.kasaAdi.toLowerCase().includes(filters.arama.toLowerCase()) && 
          !(cb.iban && cb.iban.toLowerCase().includes(filters.arama.toLowerCase()))) return false;
      return true;
    });

    // Sort
    if (filters.siralama === 'bakiye-desc') {
      filtered.sort((a, b) => b.bakiye - a.bakiye);
    } else if (filters.siralama === 'bakiye-asc') {
      filtered.sort((a, b) => a.bakiye - b.bakiye);
    }

    return filtered;
  }, [cashBoxes, filters]);

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingCashBox(true);
    try {
      const res = await fetch('/eventra/api/cash-boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kasaAdi: addCashForm.kasaAdi,
          tur: addCashForm.tur,
          iban: addCashForm.iban || null,
          dovizCinsi: addCashForm.dovizCinsi,
          acilisBakiyesi: parseFloat(addCashForm.acilisBakiyesi) || 0,
          isActive: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newCashBox: CashBox = {
          id: data.cashBox.id,
          kasaAdi: data.cashBox.kasaAdi,
          tur: data.cashBox.tur as 'Nakit' | 'POS' | 'Banka' | 'Kredi Kartı',
          iban: data.cashBox.iban || undefined,
          dovizCinsi: data.cashBox.dovizCinsi as 'TL' | 'USD' | 'EUR',
          bakiye: parseFloat(String(data.cashBox.acilisBakiyesi || 0)),
          transactions: [],
        };
        setCashBoxes(prev => [...prev, newCashBox]);
        setShowAddCashModal(false);
        setToastMessage('Yeni kasa başarıyla eklendi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setAddCashForm({
          kasaAdi: '',
          tur: 'Nakit',
          iban: '',
          dovizCinsi: 'TL',
          acilisBakiyesi: '',
        });
      } else {
        const error = await res.json();
        setToastMessage(error.error || 'Kasa eklenemedi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error adding cash box:', error);
      setToastMessage('Kasa eklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setProcessingCashBox(false);
    }
  };

  const handleEditCashBox = (cashBox: CashBox, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingCashBox(cashBox);
    setAddCashForm({
      kasaAdi: cashBox.kasaAdi,
      tur: cashBox.tur,
      iban: cashBox.iban || '',
      dovizCinsi: cashBox.dovizCinsi,
      acilisBakiyesi: '', // Açılış bakiyesi düzenlenemez (işlemlerle değişir)
    });
    setShowEditCashModal(true);
  };

  const handleUpdateCashBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashBox) return;

    setProcessingCashBox(true);
    try {
      const res = await fetch(`/eventra/api/cash-boxes/${editingCashBox.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kasaAdi: addCashForm.kasaAdi,
          tur: addCashForm.tur,
          iban: addCashForm.iban || null,
          dovizCinsi: addCashForm.dovizCinsi,
          // acilisBakiyesi düzenlenemez - işlemlerle değişir
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await refreshCashBoxes();
        setShowEditCashModal(false);
        setEditingCashBox(null);
        setToastMessage('Kasa bilgileri başarıyla güncellendi ✅');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setAddCashForm({
          kasaAdi: '',
          tur: 'Nakit',
          iban: '',
          dovizCinsi: 'TL',
          acilisBakiyesi: '',
        });
      } else {
        const error = await res.json();
        setToastMessage(error.error || 'Kasa güncellenemedi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error updating cash box:', error);
      setToastMessage('Kasa güncellenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setProcessingCashBox(false);
    }
  };

  // Kasaları yeniden yükle
  const refreshCashBoxes = async () => {
    try {
      const res = await fetch('/eventra/api/cash-boxes?isActive=true', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const cashBoxesData = (data.cashBoxes || []).map((cb: any) => ({
          id: cb.id,
          kasaAdi: cb.kasaAdi,
          tur: cb.tur as 'Nakit' | 'POS' | 'Banka' | 'Kredi Kartı',
          iban: cb.iban || undefined,
          dovizCinsi: cb.dovizCinsi as 'TL' | 'USD' | 'EUR',
          bakiye: (cb.currentBalance || cb.acilisBakiyesi) ? parseFloat(String(cb.currentBalance || cb.acilisBakiyesi)) : 0,
          transactions: [],
        }));
        setCashBoxes(cashBoxesData);
      }
    } catch (error) {
      console.error('Error refreshing cash boxes:', error);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(transactionForm.tutar);
    
    // Tutar validasyonu
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

    // Negatif bakiye kontrolü
    if (transactionForm.islemTuru === 'Çıkış' && selectedCashBoxInfo && tutar > selectedCashBoxInfo.bakiye) {
      setToastMessage(`Kasa bakiyesi yetersiz! Mevcut bakiye: ${selectedCashBoxInfo.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (transactionForm.islemTuru === 'Transfer') {
      const hedefKasa = cashBoxes.find(cb => cb.id === transactionForm.hedefKasa);
      if (!hedefKasa) {
        setToastMessage('Hedef kasa seçilmedi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      if (selectedCashBoxInfo && tutar > selectedCashBoxInfo.bakiye) {
        setToastMessage(`Kasa bakiyesi yetersiz! Mevcut bakiye: ${selectedCashBoxInfo.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
    }
    
    setProcessingTransaction(true);
    try {
      if (transactionForm.islemTuru === 'Transfer') {
        // Transfer işlemi
        const res = await fetch('/eventra/api/cash-box-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cashBoxId: transactionForm.kaynakKasa,
            hedefCashBoxId: transactionForm.hedefKasa || null,
            islemTuru: 'Transfer',
            tutar,
            aciklama: transactionForm.aciklama || null,
            tarih: transactionForm.tarih,
          }),
        });

        if (res.ok) {
          await refreshCashBoxes();
          setShowTransferModal(false);
          setToastMessage('Transfer işlemi başarıyla kaydedildi ✅');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setTransactionForm({
            islemTuru: 'Giriş',
            kaynakKasa: '',
            hedefKasa: '',
            tutar: '',
            aciklama: '',
            tarih: new Date().toISOString().slice(0, 16), // datetime-local format
          });
        } else {
          const error = await res.json();
          setToastMessage(error.error || 'Transfer işlemi kaydedilemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } else {
        // Giriş/Çıkış işlemi
        const islemTuru = transactionForm.islemTuru === 'Giriş' ? 'Gelir' : 'Gider';
        const res = await fetch('/eventra/api/cash-box-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cashBoxId: transactionForm.kaynakKasa,
            islemTuru,
            tutar,
            aciklama: transactionForm.aciklama,
            tarih: transactionForm.tarih,
          }),
        });

        if (res.ok) {
          await refreshCashBoxes();
          setShowTransactionModal(false);
          setToastMessage('Kasa işlemi başarıyla kaydedildi ✅');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          setTransactionForm({
            islemTuru: 'Giriş',
            kaynakKasa: '',
            hedefKasa: '',
            tutar: '',
            aciklama: '',
            tarih: new Date().toISOString().slice(0, 16), // datetime-local format
          });
        } else {
          const error = await res.json();
          setToastMessage(error.error || 'Kasa işlemi kaydedilemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      }
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      setToastMessage(error?.message || 'İşlem kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleRowClick = async (cashBox: CashBox) => {
    setSelectedCashBox(cashBox);
    setShowDetailDrawer(true);
    
    // İşlem geçmişini çek (hem cashBoxTransaction hem de payments tablosundan)
    try {
      // CashBoxTransaction işlemlerini çek
      const transactionsRes = await fetch(`/eventra/api/cash-box-transactions?cashBoxId=${cashBox.id}`, {
        credentials: 'include',
      });
      
      const allTransactions: Array<{type: 'transaction' | 'payment', data: any, date: Date}> = [];
      
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        (transactionsData.transactions || []).forEach((t: any) => {
          allTransactions.push({
            type: 'transaction',
            data: t,
            date: new Date(t.tarih),
          });
        });
      }
      
      // Rezervasyon ödemelerini çek (payments tablosundan)
      const paymentsRes = await fetch(`/eventra/api/payments?cashBoxId=${cashBox.id}`, {
        credentials: 'include',
      });
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        (paymentsData.payments || []).forEach((p: any) => {
          if (!p.isCancelled) {
            allTransactions.push({
              type: 'payment',
              data: p,
              date: new Date(p.paymentDate),
            });
          }
        });
      }
      
           // Tüm işlemleri tarih + saat sırasına göre sırala (en eski önce)
           allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Kasa açılış bakiyesini al (API'den gelen currentBalance'dan hesapla)
      // Önce tüm işlemlerin toplamını çıkarıp açılış bakiyesini bulalım
      const cashBoxRes = await fetch(`/eventra/api/cash-boxes/${cashBox.id}`, {
        credentials: 'include',
      });
      
      let acilisBakiyesi = 0;
      if (cashBoxRes.ok) {
        const cashBoxData = await cashBoxRes.json();
        const currentBalance = parseFloat(String(cashBoxData.cashBox?.currentBalance || cashBox.bakiye || 0));
        
        // Tüm işlemlerin toplamını hesapla
        let totalTransactions = 0;
        allTransactions.forEach(item => {
          if (item.type === 'transaction') {
            const t = item.data;
            if (t.islemTuru === 'Gelir' || t.islemTuru === 'Transfer Giriş') {
              totalTransactions += parseFloat(String(t.tutar || 0));
            } else {
              totalTransactions -= parseFloat(String(t.tutar || 0));
            }
          } else if (item.type === 'payment') {
            totalTransactions += parseFloat(String(item.data.amount || 0));
          }
        });
        
        acilisBakiyesi = currentBalance - totalTransactions;
      }
      
      // İşlemleri oluştur ve bakiyeyi hesapla
      let runningBalance = acilisBakiyesi;
      const finalTransactions: Transaction[] = [];
      
      allTransactions.forEach(item => {
        if (item.type === 'transaction') {
          const t = item.data;
          const tutar = parseFloat(String(t.tutar || 0));
          const isGelir = t.islemTuru === 'Gelir' || t.islemTuru === 'Transfer Giriş';
          const isGider = t.islemTuru === 'Gider' || t.islemTuru === 'Transfer Çıkış' || t.islemTuru === 'Transfer';
          
          runningBalance += isGelir ? tutar : -tutar;
          
          // Açıklamaya rezervasyon no ekle (varsa)
          let aciklama = t.aciklama || '';
          if (t.reservationId || t.rezervasyonNo) {
            const rezervasyonNo = t.rezervasyonNo || t.reservationId;
            if (aciklama) {
              aciklama = `${aciklama} (Rez No: ${rezervasyonNo})`;
            } else {
              aciklama = `Rez No: ${rezervasyonNo}`;
            }
          }
          
          finalTransactions.push({
            id: t.id,
            tarih: formatDate(t.tarih),
            aciklama: aciklama,
            islemTuru: (isGelir ? 'Giriş' : isGider ? 'Çıkış' : 'Transfer') as 'Giriş' | 'Çıkış' | 'Transfer',
            tutar: isGelir ? tutar : -tutar,
            yeniBakiye: runningBalance,
          });
        } else if (item.type === 'payment') {
          const p = item.data;
          const tutar = parseFloat(String(p.amount || 0));
          const isRefund = tutar < 0;
          runningBalance += tutar; // Negatif tutarlar otomatik olarak çıkarılır
          
          // Rezervasyon no'yu açıklamaya ekle
          const rezervasyonNo = p.Reservation?.rezervasyonNo || '';
          let aciklama = '';
          if (p.notes) {
            aciklama = `${p.notes}${rezervasyonNo ? ` (Rez No: ${rezervasyonNo})` : ''}`;
          } else if (rezervasyonNo) {
            aciklama = `${isRefund ? 'İADE: ' : ''}Rezervasyon ${isRefund ? 'İadesi' : 'Ödemesi'} (Rez No: ${rezervasyonNo})`;
          } else {
            aciklama = `${isRefund ? 'İADE: ' : ''}Rezervasyon ${isRefund ? 'İadesi' : 'Ödemesi'}`;
          }
          
          finalTransactions.push({
            id: p.id,
            tarih: formatDate(p.paymentDate),
            aciklama: aciklama,
            islemTuru: isRefund ? 'Çıkış' as 'Çıkış' : 'Giriş' as 'Giriş',
            tutar: isRefund ? tutar : tutar, // Negatif tutar zaten negatif
            yeniBakiye: runningBalance,
          });
        }
      });
      
      // En yeni önce sırala (tarih + saat bazında)
      // allTransactions zaten tarih + saat bazında sıralanmış (en eski önce)
      // finalTransactions'ı ters çevirerek en yeni önce sıralıyoruz
      // Ancak formatDate çıktısı string olduğu için, orijinal Date objelerini kullanarak sıralama yapıyoruz
      // allTransactions'daki date field'ını kullanarak sıralama yapıyoruz
      // finalTransactions oluşturulurken allTransactions'daki sıralama korunuyor
      // Bu yüzden sadece ters çevirmemiz yeterli
      finalTransactions.reverse(); // En yeni önce (zaten allTransactions en eski önce sıralı)
      
      setSelectedCashBox({
        ...cashBox,
        transactions: finalTransactions,
      });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
  };

  const formatIBAN = (iban?: string) => {
    if (!iban) return '—';
    if (iban.length > 20) {
      return `${iban.substring(0, 12)} ... ${iban.substring(iban.length - 2)}`;
    }
    return iban;
  };

  const formatBakiye = (bakiye: number, doviz: string) => {
    const formatted = Math.abs(bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${bakiye < 0 ? '-' : ''}${formatted}₺`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Kasa Yönetimi
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Nakit ve banka hesaplarınızı tek ekrandan yönetin.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddCashModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Kasa Ekle
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewTransactionDropdown(!showNewTransactionDropdown);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
            >
              Yeni İşlem
              <svg className={`w-4 h-4 transition-transform ${showNewTransactionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNewTransactionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNewTransactionDropdown(false)}
                />
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionForm(prev => ({ ...prev, islemTuru: 'Giriş', kaynakKasa: '', tutar: '', aciklama: '', tarih: new Date().toISOString().slice(0, 16) }));
                      setShowTransactionModal(true);
                      setShowNewTransactionDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Para Girişi
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionForm(prev => ({ ...prev, islemTuru: 'Çıkış', kaynakKasa: '', tutar: '', aciklama: '', tarih: new Date().toISOString().slice(0, 16) }));
                      setShowTransactionModal(true);
                      setShowNewTransactionDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Para Çıkışı
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionForm(prev => ({ ...prev, islemTuru: 'Transfer', kaynakKasa: '', hedefKasa: '', tutar: '', aciklama: '', tarih: new Date().toISOString().slice(0, 16) }));
                      setShowTransferModal(true);
                      setShowNewTransactionDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-200 dark:border-slate-700"
                  >
                    Transfer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Toplam Bakiye</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{toplamBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">En Yüksek Bakiye</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{enYuksekBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">En Düşük Bakiye</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{enDusukBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Aktif Kasa Sayısı</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{aktifKasaSayisi}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full md:w-auto">
            <select
              value={filters.tur}
              onChange={(e) => setFilters(prev => ({ ...prev, tur: e.target.value }))}
              className="w-full md:w-auto px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Filtrele: Tümü</option>
              <option value="Nakit">Nakit</option>
              <option value="POS">POS</option>
              <option value="Banka">Banka</option>
              <option value="Kredi Kartı">Kredi Kartı</option>
            </select>
          </div>
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              value={filters.arama}
              onChange={(e) => setFilters(prev => ({ ...prev, arama: e.target.value }))}
              placeholder="Hesap adı veya IBAN ara..."
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex-1 w-full md:w-auto">
            <select
              value={filters.siralama}
              onChange={(e) => setFilters(prev => ({ ...prev, siralama: e.target.value }))}
              className="w-full md:w-auto px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="bakiye-desc">Sırala: Bakiye ↓</option>
              <option value="bakiye-asc">Sırala: Bakiye ↑</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">HESAP İSMİ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">TÜR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">IBAN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">DÖVİZ CİNSİ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">BAKİYE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">İŞLEMLER</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Yükleniyor...</p>
                  </td>
                </tr>
              ) : filteredAndSortedCashBoxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz kasa bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCashBoxes.map((cashBox) => (
                  <tr
                    key={cashBox.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                      onClick={() => handleRowClick(cashBox)}
                    >
                      {cashBox.kasaAdi}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => handleRowClick(cashBox)}
                    >
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cashBox.tur === 'Nakit'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : cashBox.tur === 'POS'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : cashBox.tur === 'Banka'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                      }`}>
                        {cashBox.tur}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                      onClick={() => handleRowClick(cashBox)}
                    >
                      {formatIBAN(cashBox.iban)}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                      onClick={() => handleRowClick(cashBox)}
                    >
                      {cashBox.dovizCinsi}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer"
                      onClick={() => handleRowClick(cashBox)}
                    >
                      <span className={
                        cashBox.bakiye > 0
                          ? 'text-green-600 dark:text-green-400'
                          : cashBox.bakiye < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }>
                        {formatBakiye(cashBox.bakiye, cashBox.dovizCinsi)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => handleEditCashBox(cashBox, e)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors mr-3"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {showDetailDrawer && selectedCashBox && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowDetailDrawer(false)}>
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-2xl h-full shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedCashBox.kasaAdi}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {selectedCashBox.tur}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ×
                </button>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Mevcut Bakiye</p>
                <p className={`text-3xl font-bold mt-1 ${
                  selectedCashBox.bakiye > 0
                    ? 'text-green-600 dark:text-green-400'
                    : selectedCashBox.bakiye < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {formatBakiye(selectedCashBox.bakiye, selectedCashBox.dovizCinsi)}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    setTransactionForm(prev => ({ ...prev, islemTuru: 'Giriş', kaynakKasa: selectedCashBox.id }));
                    setShowTransactionModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Para Girişi
                </button>
                <button
                  onClick={() => {
                    setTransactionForm(prev => ({ ...prev, islemTuru: 'Çıkış', kaynakKasa: selectedCashBox.id }));
                    setShowTransactionModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Para Çıkışı
                </button>
                <button
                  onClick={() => {
                    setTransactionForm(prev => ({ ...prev, islemTuru: 'Transfer', kaynakKasa: selectedCashBox.id }));
                    setShowTransferModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Transfer
                </button>
              </div>

              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">İşlem Geçmişi</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Tarih</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Açıklama</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">İşlem Türü</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Tutar</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Yeni Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {selectedCashBox.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          Henüz işlem bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      selectedCashBox.transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{transaction.tarih}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{transaction.aciklama}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.islemTuru === 'Giriş'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : transaction.islemTuru === 'Çıkış'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {transaction.islemTuru}
                            </span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                            transaction.tutar > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.tutar > 0 ? '+' : ''}{transaction.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {transaction.yeniBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cash Modal */}
      {showEditCashModal && editingCashBox && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Kasa Düzenle
            </h3>
            <form onSubmit={handleUpdateCashBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kasa Adı
                </label>
                <input
                  type="text"
                  value={addCashForm.kasaAdi}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, kasaAdi: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tür
                </label>
                <select
                  value={addCashForm.tur}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, tur: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Nakit">Nakit</option>
                  <option value="POS">POS</option>
                  <option value="Banka">Banka</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  IBAN (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={addCashForm.iban}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Döviz Cinsi
                </label>
                <select
                  value={addCashForm.dovizCinsi}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, dovizCinsi: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="TL">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ Açılış bakiyesi düzenlenemez. Bakiye, kasa işlemleri ile otomatik olarak güncellenir.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCashModal(false);
                    setEditingCashBox(null);
                    setAddCashForm({
                      kasaAdi: '',
                      tur: 'Nakit',
                      iban: '',
                      dovizCinsi: 'TL',
                      acilisBakiyesi: '',
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingCashBox}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingCashBox && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Cash Modal */}
      {showAddCashModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Kasa Ekle
            </h3>
            <form onSubmit={handleAddCash} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kasa Adı
                </label>
                <input
                  type="text"
                  value={addCashForm.kasaAdi}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, kasaAdi: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tür
                </label>
                <select
                  value={addCashForm.tur}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, tur: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="Nakit">Nakit</option>
                  <option value="POS">POS</option>
                  <option value="Banka">Banka</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  IBAN (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={addCashForm.iban}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, iban: e.target.value }))}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Döviz Cinsi
                </label>
                <select
                  value={addCashForm.dovizCinsi}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, dovizCinsi: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="TL">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Açılış Bakiyesi
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addCashForm.acilisBakiyesi}
                  onChange={(e) => setAddCashForm(prev => ({ ...prev, acilisBakiyesi: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCashModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingTransaction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingTransaction && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {transactionForm.islemTuru === 'Giriş' ? 'Para Girişi' : 'Para Çıkışı'}
            </h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kasa *
                </label>
                <select
                  value={transactionForm.kaynakKasa}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, kaynakKasa: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Seçiniz</option>
                  {cashBoxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.kasaAdi} {cb.bakiye >= 0 ? `(${cb.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)` : ''}
                    </option>
                  ))}
                </select>
                {selectedCashBoxInfo && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Mevcut Bakiye:</span>
                      <span className={`text-sm font-semibold ${
                        selectedCashBoxInfo.bakiye >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedCashBoxInfo.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    {transactionForm.islemTuru === 'Çıkış' && transactionForm.tutar && !isNaN(parseFloat(transactionForm.tutar)) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Yeni Bakiye:</span>
                          <span className={`text-sm font-semibold ${
                            (selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)) >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                        {(selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)) < 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Bakiye yetersiz!</p>
                        )}
                      </div>
                    )}
                    {transactionForm.islemTuru === 'Giriş' && transactionForm.tutar && !isNaN(parseFloat(transactionForm.tutar)) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Yeni Bakiye:</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {(selectedCashBoxInfo.bakiye + parseFloat(transactionForm.tutar)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.tutar}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, tutar: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tarih
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="transactionTarih"
                    value={formatDateForInput(transactionForm.tarih)}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, tarih: e.target.value }))}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <label
                    htmlFor="transactionTarih"
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
                  value={transactionForm.aciklama}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setTransactionForm({
                      islemTuru: 'Giriş',
                      kaynakKasa: '',
                      hedefKasa: '',
                      tutar: '',
                      aciklama: '',
                      tarih: new Date().toISOString().slice(0, 16), // datetime-local format
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingTransaction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingTransaction && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Kasadan Kasaya Transfer
            </h3>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Kaynak Kasa *
                </label>
                <select
                  value={transactionForm.kaynakKasa}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, kaynakKasa: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Seçiniz</option>
                  {cashBoxes.map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.kasaAdi} {cb.bakiye >= 0 ? `(${cb.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)` : ''}
                    </option>
                  ))}
                </select>
                {selectedCashBoxInfo && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Mevcut Bakiye:</span>
                      <span className={`text-sm font-semibold ${
                        selectedCashBoxInfo.bakiye >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedCashBoxInfo.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    {transactionForm.tutar && !isNaN(parseFloat(transactionForm.tutar)) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Transfer Sonrası:</span>
                          <span className={`text-sm font-semibold ${
                            (selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)) >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </div>
                        {(selectedCashBoxInfo.bakiye - parseFloat(transactionForm.tutar)) < 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Bakiye yetersiz!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Hedef Kasa *
                </label>
                <select
                  value={transactionForm.hedefKasa}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, hedefKasa: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Seçiniz</option>
                  {cashBoxes.filter(cb => cb.id !== transactionForm.kaynakKasa).map(cb => (
                    <option key={cb.id} value={cb.id}>
                      {cb.kasaAdi} {cb.bakiye >= 0 ? `(${cb.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺)` : ''}
                    </option>
                  ))}
                </select>
                {selectedHedefCashBoxInfo && transactionForm.tutar && !isNaN(parseFloat(transactionForm.tutar)) && (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Mevcut Bakiye:</span>
                      <span className={`text-sm font-semibold ${
                        selectedHedefCashBoxInfo.bakiye >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedHedefCashBoxInfo.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Transfer Sonrası:</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {(selectedHedefCashBoxInfo.bakiye + parseFloat(transactionForm.tutar)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionForm.tutar}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, tutar: e.target.value }))}
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Tarih *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="transferTarih"
                    value={transactionForm.tarih}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, tarih: e.target.value }))}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <label
                    htmlFor="transferTarih"
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
                  value={transactionForm.aciklama}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  rows={3}
                  placeholder="Transfer açıklaması (opsiyonel)"
                  className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransactionForm({
                      islemTuru: 'Giriş',
                      kaynakKasa: '',
                      hedefKasa: '',
                      tutar: '',
                      aciklama: '',
                      tarih: new Date().toISOString().slice(0, 16), // datetime-local format
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processingTransaction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingTransaction && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Transfer Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
