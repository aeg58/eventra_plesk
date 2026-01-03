'use client';

import React, { useState, useEffect } from 'react';

interface CashflowWeek {
  date: string;
  inflow: number;
  outflow: number;
  balanceStart: number;
  balanceEnd: number;
  tahsilatlar?: { ad: string; tutar: number }[];
  odemeler?: { ad: string; tutar: number }[];
}

interface Transaction {
  type: string;
  dueDate: string;
  partner: string;
  description: string;
  debit: number;
  credit: number;
}

export default function HesapTakibi() {
  const [activeTab, setActiveTab] = useState<'weeks' | 'months'>('weeks');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [cashflowWeeks, setCashflowWeeks] = useState<CashflowWeek[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verileri API'den çek (otomatik yenileme ile)
  useEffect(() => {
    fetchData();
    
    // Her 30 saniyede bir otomatik yenile
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const period = activeTab === 'weeks' ? 'weeks' : 'months';
      const [cashflowRes, transactionsRes] = await Promise.all([
        fetch(`/eventra/api/account-tracking/cashflow?period=${period}&${period}=12`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/eventra/api/account-tracking/upcoming-transactions?limit=50', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (!cashflowRes.ok || !transactionsRes.ok) {
        const cashflowError = cashflowRes.ok ? null : await cashflowRes.json();
        const transactionsError = transactionsRes.ok ? null : await transactionsRes.json();
        throw new Error(cashflowError?.error || transactionsError?.error || 'Veriler yüklenemedi');
      }

      const cashflowData = await cashflowRes.json();
      const transactionsData = await transactionsRes.json();

      setCashflowWeeks(cashflowData.cashflow || []);
      setTransactions(transactionsData.transactions || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    // CSV export
    const csvContent = [
      ['Dönem Başı', 'Tahsilatlar', 'Ödemeler', 'Dönem Sonu'].join(','),
      ...cashflowWeeks.map(w => [
        w.balanceStart.toFixed(2),
        w.inflow.toFixed(2),
        w.outflow.toFixed(2),
        w.balanceEnd.toFixed(2),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hesap-takibi-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransactions = () => {
    // CSV export for transactions
    const csvContent = [
      ['İşlem Türü', 'Vade Tarihi', 'Müşteri/Tedarikçi', 'Açıklama', 'Çıkış', 'Giriş'].join(','),
      ...transactions.map(t => [
        t.type,
        t.dueDate,
        t.partner,
        t.description,
        t.debit.toFixed(2),
        t.credit.toFixed(2),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `yaklasan-islemler-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Calculate period end balance
  const periodEndBalance = cashflowWeeks.length > 0
    ? cashflowWeeks[cashflowWeeks.length - 1].balanceEnd
    : 0;

  // Calculate min/max for chart
  const allBalances = cashflowWeeks.flatMap(w => [w.balanceStart, w.balanceEnd]);
  const minBalance = Math.min(...allBalances);
  const maxBalance = Math.max(...allBalances);
  const chartHeight = 200;
  const chartPadding = 40;

  const getYPosition = (value: number) => {
    const range = maxBalance - minBalance || 1;
    const normalized = (value - minBalance) / range;
    return chartPadding + (chartHeight - chartPadding * 2) * (1 - normalized);
  };

  return (
    <div className="max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 pt-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Hesap Takibi
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Finansal durumunuzu 12 haftalık dönem bazında görüntüleyin.
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="px-4 py-2 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
        >
          Dışa Aktar
        </button>
      </div>

      {/* Period Summary Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => {
              setActiveTab('weeks');
              setExpandedRows(new Set());
            }}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'weeks'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Önümüzdeki 12 Hafta
          </button>
          <button
            onClick={() => {
              setActiveTab('months');
              setExpandedRows(new Set());
            }}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'months'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Önümüzdeki 12 Ay
          </button>
        </div>

        {/* Balance Summary */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tahmini Dönem Sonu Bakiyesi</p>
          <p className={`text-5xl font-bold ${
            periodEndBalance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {periodEndBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </p>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height: `${chartHeight}px` }}>
          <svg width="100%" height={chartHeight} viewBox={`0 0 800 ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
            {/* Y-axis labels */}
            {[minBalance, (minBalance + maxBalance) / 2, maxBalance].map((value, idx) => (
              <g key={idx}>
                <line
                  x1={chartPadding}
                  y1={getYPosition(value)}
                  x2={800 - chartPadding}
                  y2={getYPosition(value)}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartPadding - 10}
                  y={getYPosition(value)}
                  textAnchor="end"
                  className="text-xs fill-slate-500"
                  dominantBaseline="middle"
                >
                  {value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺
                </text>
              </g>
            ))}

            {/* Gradient fill */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Calculate x positions */}
            {cashflowWeeks.length > 0 && (() => {
              const width = 800 - chartPadding * 2;
              const step = width / (cashflowWeeks.length - 1 || 1);
              
              // Area path
              const areaPath = `M ${chartPadding},${getYPosition(cashflowWeeks[0].balanceStart)} ${
                cashflowWeeks.map((week, idx) => {
                  const x = chartPadding + idx * step;
                  return `L ${x},${getYPosition(week.balanceEnd)}`;
                }).join(' ')
              } L ${800 - chartPadding},${chartHeight - chartPadding} L ${chartPadding},${chartHeight - chartPadding} Z`;

              // Line points
              const linePoints = cashflowWeeks.map((week, idx) => {
                const x = chartPadding + idx * step;
                return `${x},${getYPosition(week.balanceEnd)}`;
              }).join(' ');

              return (
                <>
                  <path
                    d={areaPath}
                    fill="url(#gradient)"
                  />
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="2"
                  />
                  {cashflowWeeks.map((week, idx) => {
                    const x = chartPadding + idx * step;
                    return (
                      <g key={idx}>
                        <circle
                          cx={x}
                          cy={getYPosition(week.balanceEnd)}
                          r="4"
                          fill="#16A34A"
                        />
                        <text
                          x={x}
                          y={getYPosition(week.balanceEnd) - 10}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                        >
                          {formatDate(week.date)}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}

            {/* Today indicator */}
            <line
              x1={chartPadding}
              y1={chartPadding}
              x2={chartPadding}
              y2={chartHeight - chartPadding}
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text
              x={chartPadding + 5}
              y={chartPadding + 15}
              className="text-xs fill-blue-600 font-medium"
            >
              Bugün
            </text>
          </svg>
        </div>
      </div>

      {/* Weekly Financial Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dönem Başı Bakiyesi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tahsilatlar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ödemeler</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tahmini Dönem Sonu Bakiyesi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tüm Ödemelerle En Az</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tüm Tahsilatlarla En Fazla</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Yükleniyor...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              ) : cashflowWeeks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz veri bulunmuyor.
                  </td>
                </tr>
              ) : (
                cashflowWeeks.map((week, index) => {
                const isExpanded = expandedRows.has(index);
                const totalTahsilat = week.tahsilatlar?.reduce((sum, t) => sum + t.tutar, 0) || 0;
                const totalOdeme = week.odemeler?.reduce((sum, o) => sum + o.tutar, 0) || 0;
                const minWithPayments = week.balanceEnd - totalOdeme;
                const maxWithReceipts = week.balanceEnd + totalTahsilat;

                return (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={week.balanceStart >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {week.balanceStart.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleRow(index)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span className={totalTahsilat > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                            {totalTahsilat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleRow(index)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span className={totalOdeme > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}>
                            {totalOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={week.balanceEnd >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {week.balanceEnd.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={minWithPayments >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {minWithPayments.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={maxWithReceipts >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {maxWithReceipts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tahsilatlar</p>
                              {week.tahsilatlar && week.tahsilatlar.length > 0 ? (
                                <ul className="space-y-1">
                                  {week.tahsilatlar.map((tahsilat, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                                      {tahsilat.ad} — {tahsilat.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">(Henüz kayıt yok)</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ödemeler</p>
                              {week.odemeler && week.odemeler.length > 0 ? (
                                <ul className="space-y-1">
                                  {week.odemeler.map((odeme, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                                      {odeme.ad} — {odeme.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">(Henüz kayıt yok)</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Transactions Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Yapılacak Tahsilat ve Ödemeler
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Vade tarihine göre planlanmış tahsilat ve ödemeleri görüntüleyin.
              </p>
            </div>
            <button 
              onClick={handleExportTransactions}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Dışa Aktar
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">İşlem Türü</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Vade Tarihi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Müşteri / Tedarikçi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Çıkış</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Giriş</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Yükleniyor...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz işlem bulunmuyor.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {formatDateLong(transaction.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {transaction.partner}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.debit > 0 ? (
                        <span className="text-amber-700 dark:text-amber-500 font-semibold">
                          {transaction.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.credit > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {transaction.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
