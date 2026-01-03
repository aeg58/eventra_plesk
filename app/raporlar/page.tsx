'use client';

import { useState, useEffect, useRef } from 'react';
import { ChartIcon } from '@/app/components/Icons';
import DatePicker from '@/app/components/DatePicker';

interface ReportData {
  totalReservations?: number;
  totalRevenue?: number;
  byStatus?: Record<string, number>;
  byOrganization?: Record<string, number>;
  byMonth?: Record<string, number>;
  reservations?: any[];
  customers?: any[];
  revenue?: {
    total: number;
    byMonth: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export default function Raporlar() {
  const [selectedReport, setSelectedReport] = useState<string>('reservations');
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const reportTypes = [
    { id: 'reservations', label: 'Rezervasyon Raporu', icon: '📅' },
    { id: 'revenue', label: 'Gelir Raporu', icon: '💰' },
    { id: 'customers', label: 'Müşteri Raporu', icon: '👥' },
    { id: 'status', label: 'Durum Analizi', icon: '📊' },
    { id: 'organization', label: 'Organizasyon Analizi', icon: '🎉' },
    { id: 'monthly', label: 'Aylık Dağılım', icon: '📈' },
  ];

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Lütfen başlangıç ve bitiş tarihlerini seçin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = '';
      if (selectedReport === 'reservations' || selectedReport === 'status' || selectedReport === 'organization' || selectedReport === 'monthly') {
        url = `/eventra/api/reports/reservations?startDate=${startDate}&endDate=${endDate}`;
      } else if (selectedReport === 'revenue') {
        url = `/eventra/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`;
      } else if (selectedReport === 'customers') {
        url = `/eventra/api/reports/customers?startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        // API response formatını kontrol et ve düzelt
        if (data.report) {
          setReportData(data.report);
        } else if (data.totalReservations !== undefined || data.totalRevenue !== undefined) {
          // Direkt report data geliyorsa
          setReportData(data);
        } else {
          setReportData(data);
        }
        setError(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError('Oturum süreniz dolmuş. Lütfen sayfayı yenileyin.');
        } else {
          setError(errorData.error || errorData.message || 'Rapor yüklenemedi');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Rapor yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, startDate, endDate]);

  // PDF Export fonksiyonu - Popup engelleyici olmadan
  const exportToPDF = () => {
    if (!reportRef.current || !reportData) {
      alert('Rapor verisi bulunamadı. Lütfen önce raporu yükleyin.');
      return;
    }

    try {
      const reportTitle = reportTypes.find(t => t.id === selectedReport)?.label || 'Rapor';
      const dateRange = `${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`;
      
      // Mevcut sayfayı print için hazırla
      const originalTitle = document.title;
      document.title = `${reportTitle} - ${dateRange}`;
      
      // Print stillerini ekle
      const printStyleId = 'report-print-styles';
      let printStyle = document.getElementById(printStyleId) as HTMLStyleElement;
      
      if (!printStyle) {
        printStyle = document.createElement('style');
        printStyle.id = printStyleId;
        printStyle.textContent = `
          @media print {
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            header, aside, button, .no-print, nav, input, select, label:not(.print-keep) {
              display: none !important;
            }
            /* report-print-header no-print'ten muaf tutulmalı - yazdırma sırasında görünür olmalı */
            .report-print-header {
              display: block !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
            }
            .report-print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              page-break-after: avoid;
            }
            .report-print-header h1 {
              margin: 0;
              font-size: 24pt;
              font-weight: bold;
            }
            .report-print-header p {
              margin: 5px 0;
              font-size: 12pt;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2 !important;
              font-weight: bold;
              color: #000 !important;
            }
            .stat-card {
              display: inline-block;
              margin: 10px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              min-width: 150px;
            }
          }
        `;
        document.head.appendChild(printStyle);
      }

      // Rapor başlığını ekle
      const reportHeader = document.createElement('div');
      reportHeader.className = 'report-print-header';
      reportHeader.innerHTML = `
        <h1>${reportTitle}</h1>
        <p>Tarih Aralığı: ${dateRange}</p>
        <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      `;
      
      // Rapor içeriğinin başına ekle
      if (reportRef.current.firstChild) {
        reportRef.current.insertBefore(reportHeader, reportRef.current.firstChild);
      } else {
        reportRef.current.appendChild(reportHeader);
      }

      // Print dialog'u aç
      setTimeout(() => {
        window.print();
        
        // Temizlik
        setTimeout(() => {
          reportHeader.remove();
          document.title = originalTitle;
        }, 500);
      }, 100);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Rapor yükleniyor...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-400 mb-4 font-medium">{error}</p>
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Rapor verisi bulunamadı</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'reservations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Toplam Rezervasyon</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {reportData.totalReservations || 0}
                </div>
              </div>
              {reportData.totalRevenue && (
                <div className={`border rounded-xl p-4 ${Number(reportData.totalRevenue) >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                  <div className={`text-sm mb-1 ${Number(reportData.totalRevenue) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Toplam Gelir</div>
                  <div className={`text-2xl font-bold ${Number(reportData.totalRevenue) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {Number(reportData.totalRevenue) >= 0 
                      ? `₺${Number(reportData.totalRevenue).toLocaleString('tr-TR')}` 
                      : `-₺${Math.abs(Number(reportData.totalRevenue)).toLocaleString('tr-TR')} (Negatif)`}
                  </div>
                </div>
              )}
            </div>

            {reportData.reservations && reportData.reservations.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rezervasyon Listesi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rezervasyon No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organizasyon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Salon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kişi Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {reportData.reservations.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.rezervasyonNo || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.musteri || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.tarih ? new Date(r.tarih).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.zamanDilimi || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.organizasyonAdi || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.salonAdi || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                              {r.durum || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {r.fiyat ? `₺${Number(r.fiyat).toLocaleString('tr-TR')}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.davetiSayisi || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'status':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Durum Dağılımı</h3>
              <div className="space-y-3">
                {reportData.byStatus && Object.entries(reportData.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${((count as number) / (reportData.totalReservations || 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                        {count as number}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'organization':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Organizasyon Dağılımı</h3>
              <div className="space-y-3">
                {reportData.byOrganization && Object.entries(reportData.byOrganization).map(([orgName, count]) => (
                  <div key={orgName} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{orgName}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${((count as number) / (reportData.totalReservations || 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                        {count as number}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'monthly':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aylık Dağılım</h3>
              <div className="space-y-3">
                {reportData.byMonth && Object.entries(reportData.byMonth)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(month + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${((count as number) / (reportData.totalReservations || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-right">
                          {count as number}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      case 'revenue':
        // API'den gelen veri formatını kontrol et
        const revenueData = reportData.report || reportData;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Toplam Gelir</div>
                <div className={`text-3xl font-bold ${Number(revenueData?.totalRevenue || 0) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {Number(revenueData?.totalRevenue || 0) >= 0 
                    ? `₺${Number(revenueData?.totalRevenue || 0).toLocaleString('tr-TR')}` 
                    : `-₺${Math.abs(Number(revenueData?.totalRevenue || 0)).toLocaleString('tr-TR')} (Negatif)`}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Toplam Ödeme</div>
                <div className={`text-3xl font-bold ${Number(revenueData?.totalPayments || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                  {Number(revenueData?.totalPayments || 0) >= 0 
                    ? `₺${Number(revenueData?.totalPayments || 0).toLocaleString('tr-TR')}` 
                    : `-₺${Math.abs(Number(revenueData?.totalPayments || 0)).toLocaleString('tr-TR')} (Negatif)`}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Bekleyen Ödeme</div>
                <div className={`text-3xl font-bold ${Number(revenueData?.pendingPayment || 0) >= 0 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>
                  {Number(revenueData?.pendingPayment || 0) >= 0 
                    ? `₺${Number(revenueData?.pendingPayment || 0).toLocaleString('tr-TR')}` 
                    : `-₺${Math.abs(Number(revenueData?.pendingPayment || 0)).toLocaleString('tr-TR')} (Fazla Ödeme)`}
                </div>
              </div>
            </div>

            {revenueData?.groupedData && Object.keys(revenueData.groupedData).length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aylık Gelir</h3>
                <div className="space-y-3">
                  {Object.entries(revenueData.groupedData)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, data]: [string, any]) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(month + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {data.count || 0} rezervasyon
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            ₺{Number(data.revenue || 0).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {revenueData?.reservations && revenueData.reservations.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gelir Detayları</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rezervasyon No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fiyat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ödeme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {revenueData.reservations.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.rezervasyonNo || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.musteri || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {r.tarih ? new Date(r.tarih).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${Number(r.fiyat || 0) >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                            {r.fiyat ? (Number(r.fiyat) >= 0 
                              ? `₺${Number(r.fiyat).toLocaleString('tr-TR')}` 
                              : `-₺${Math.abs(Number(r.fiyat)).toLocaleString('tr-TR')} (Negatif)`) : '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${Number(r.odeme || 0) >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                            {r.odeme ? (Number(r.odeme) >= 0 
                              ? `₺${Number(r.odeme).toLocaleString('tr-TR')}` 
                              : `-₺${Math.abs(Number(r.odeme)).toLocaleString('tr-TR')} (Negatif)`) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 'customers':
        // API'den gelen veri formatını kontrol et
        const customerData = reportData.report || reportData;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Toplam Müşteri</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {customerData?.totalCustomers || 0}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Yeni Müşteriler (30 gün)</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {customerData?.newCustomers || 0}
                </div>
              </div>
            </div>

            {customerData?.customers && customerData.customers.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Müşteri Listesi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Müşteri</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Telefon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rezervasyon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Toplam Gelir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {customerData.customers.map((c: any, index: number) => (
                        <tr key={c.customerId || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{c.adSoyad || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.telefon || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.email || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{c.totalReservations || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            ₺{Number(c.totalRevenue || 0).toLocaleString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Bu tarih aralığında müşteri bulunamadı.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Raporlar
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          İstatistik ve raporlarınızı görüntüleyin
        </p>
      </div>

      {/* Tarih Filtreleri - Geliştirilmiş DatePicker ile */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Başlangıç Tarihi
            </label>
            <DatePicker
              value={startDate}
              onChange={(value) => setStartDate(value)}
              placeholder="gg.aa.yyyy"
              maxDate={endDate || undefined}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bitiş Tarihi
            </label>
            <DatePicker
              value={endDate}
              onChange={(value) => setEndDate(value)}
              placeholder="gg.aa.yyyy"
              minDate={startDate || undefined}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Raporu Yenile
            </button>
            <button
              onClick={exportToPDF}
              disabled={!reportData || loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF İndir
            </button>
          </div>
        </div>
      </div>

      {/* Rapor Türleri */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedReport(type.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedReport === type.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.label}</div>
          </button>
        ))}
      </div>

      {/* Rapor İçeriği */}
      <div ref={reportRef} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        {renderReport()}
      </div>
    </div>
  );
}
