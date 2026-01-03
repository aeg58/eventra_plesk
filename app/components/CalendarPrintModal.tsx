'use client';

import { useState, useEffect } from 'react';
import { PrinterIcon } from './Icons';
import { useFilters } from '@/app/context/FilterContext';

interface CalendarPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function CalendarPrintModal({ isOpen, onClose }: CalendarPrintModalProps) {
  const { date: currentDate, setDate } = useFilters();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [printType, setPrintType] = useState<'empty' | 'with-events'>('empty');

  // Mevcut tarihi parse et ve state'e set et
  useEffect(() => {
    if (currentDate) {
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                     'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      const parts = currentDate.split(' ');
      if (parts.length === 2) {
        const monthIndex = months.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        if (monthIndex !== -1 && !isNaN(year)) {
          setSelectedYear(year);
          setSelectedMonth(monthIndex);
        }
      }
    }
  }, [currentDate, isOpen]);

  // ESC tuşu ile modal'ı kapat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Modal açıkken body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrint = () => {
    // Seçilen ayı FilterContext'e set et
    const selectedMonthYear = `${MONTHS[selectedMonth]} ${selectedYear}`;
    const originalDate = currentDate;
    
    // Geçici olarak tarihi değiştir
    setDate(selectedMonthYear);

    // Kısa bir gecikme sonrası print işlemini başlat
    setTimeout(() => {
      // Print tipine göre class ekle
      if (printType === 'empty') {
        document.body.classList.add('print-empty-calendar');
      } else {
        document.body.classList.remove('print-empty-calendar');
      }

      // Print event listener'ları
      const handleAfterPrint = () => {
        // Print sonrası class'ı kaldır ve tarihi eski haline döndür
        document.body.classList.remove('print-empty-calendar');
        setDate(originalDate);
        window.removeEventListener('afterprint', handleAfterPrint);
        onClose();
      };

      window.addEventListener('afterprint', handleAfterPrint);

      // Print dialog'u aç
      try {
        window.print();
      } catch (error) {
        console.error('Print hatası:', error);
        alert('Yazdırma işlemi başlatılamadı. Lütfen tarayıcınızın yazdırma özelliğini kontrol edin.');
        // Hata durumunda da temizlik yap
        document.body.classList.remove('print-empty-calendar');
        setDate(originalDate);
        window.removeEventListener('afterprint', handleAfterPrint);
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Takvim Yazdır
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Ay Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Yazdırılacak Ay
              </label>
              
              <div className="space-y-4">
                {/* Yıl Seçimi */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Yıl
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedYear(prev => Math.max(2020, prev - 1))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedYear(prev => Math.min(2100, prev + 1))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Ay Seçimi */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Ay
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((month, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedMonth(index)}
                        className={`px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          selectedMonth === index
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Yazdırma Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Yazdırma Tipi
              </label>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  printType === 'empty' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="printType"
                    value="empty"
                    checked={printType === 'empty'}
                    onChange={(e) => setPrintType(e.target.value as 'empty' | 'with-events')}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Boş Takvim
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Sadece takvim grid'i, rezervasyonlar gösterilmez
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  printType === 'with-events' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <input
                    type="radio"
                    name="printType"
                    value="with-events"
                    checked={printType === 'with-events'}
                    onChange={(e) => setPrintType(e.target.value as 'empty' | 'with-events')}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Etkinlikli Takvim
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Takvim grid'i ve rezervasyonlar birlikte
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
            >
              İptal
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <PrinterIcon className="w-5 h-5" />
              Yazdır
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

