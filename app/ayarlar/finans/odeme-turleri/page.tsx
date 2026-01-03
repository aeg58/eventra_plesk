'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, Search, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface OdemeTuru {
  id: string;
  ad: string;
  kod: string;
  aciklama?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function OdemeTurleriPage() {
  const [paymentTypes, setPaymentTypes] = useState<OdemeTuru[]>([
    { id: '1', ad: 'Nakit', kod: 'NAKIT', isActive: true, sortOrder: 0 },
    { id: '2', ad: 'Kredi Kartı', kod: 'KREDI', isActive: true, sortOrder: 1 },
    { id: '3', ad: 'Banka Transferi', kod: 'HAVALE', isActive: true, sortOrder: 2 },
  ]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<OdemeTuru | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    ad: '',
    kod: '',
    aciklama: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('odemeTurleri');
    if (saved) {
      try {
        setPaymentTypes(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading payment types:', e);
      }
    }
  }, []);

  const handleOpenModal = (type?: OdemeTuru) => {
    if (type) {
      setEditingType(type);
      setFormData({
        ad: type.ad,
        kod: type.kod,
        aciklama: type.aciklama || '',
        isActive: type.isActive,
        sortOrder: type.sortOrder,
      });
    } else {
      setEditingType(null);
      setFormData({
        ad: '',
        kod: '',
        aciklama: '',
        isActive: true,
        sortOrder: paymentTypes.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updated;
      if (editingType) {
        updated = paymentTypes.map(t =>
          t.id === editingType.id ? { ...editingType, ...formData } : t
        );
      } else {
        const newType: OdemeTuru = {
          id: Date.now().toString(),
          ...formData,
        };
        updated = [...paymentTypes, newType];
      }
      
      setPaymentTypes(updated);
      localStorage.setItem('odemeTurleri', JSON.stringify(updated));
      
      setToastMessage(`Ödeme türü başarıyla ${editingType ? 'güncellendi' : 'oluşturuldu'} ✅`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsModalOpen(false);
    } catch (error) {
      setToastMessage('Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu ödeme türünü silmek istediğinizden emin misiniz?')) {
      const updated = paymentTypes.filter(t => t.id !== id);
      setPaymentTypes(updated);
      localStorage.setItem('odemeTurleri', JSON.stringify(updated));
      setToastMessage('Ödeme türü başarıyla silindi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const filteredTypes = paymentTypes.filter(t =>
    t.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.kod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ödeme Türleri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ödeme yöntemlerini yönetin
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Ödeme Türü
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Ödeme türü ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {filteredTypes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Henüz ödeme türü eklenmemiş</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{type.ad}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{type.kod}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        const updated = paymentTypes.map(t =>
                          t.id === type.id ? { ...t, isActive: !t.isActive } : t
                        );
                        setPaymentTypes(updated);
                        localStorage.setItem('odemeTurleri', JSON.stringify(updated));
                      }}
                    >
                      {type.isActive ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(type)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingType ? 'Ödeme Türü Düzenle' : 'Yeni Ödeme Türü'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad *</label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kod *</label>
                <input
                  type="text"
                  value={formData.kod}
                  onChange={(e) => setFormData({ ...formData, kod: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama</label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingType ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

