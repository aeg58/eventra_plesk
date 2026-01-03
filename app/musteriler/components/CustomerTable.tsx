'use client';

import { Customer } from '../data/customers';

interface CustomerTableProps {
  customers: Customer[];
  onViewDetails: (id: string) => void;
}

const durumColors = {
  'Kesin': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  'İptal': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  'Tamamlandı': 'bg-slate-100 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400'
};

export default function CustomerTable({ customers, onViewDetails }: CustomerTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Etkinlik Tarihi
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Etkinlik
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Salon
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Misafir
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kalan Ödeme
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {customer.adSoyad}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      {customer.telefon}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                  {customer.tarih}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                  {customer.etkinlikTuru}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                  {customer.salon}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                  {customer.misafirSayisi} kişi
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {customer.odenecekTutar > 0 ? (
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      ₺{customer.odenecekTutar.toLocaleString('tr-TR')}
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Ödendi
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${durumColors[customer.durum]}`}>
                    {customer.durum}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onViewDetails(customer.id)}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                  >
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {customers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            Henüz kayıtlı müşteri bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}

