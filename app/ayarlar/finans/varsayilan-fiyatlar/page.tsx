'use client';

import { useState, useEffect } from 'react';
import { Save, DollarSign, Edit, Plus, Trash2 } from 'lucide-react';

interface VarsayilanFiyat {
  id: string;
  kategori: string;
  birim: string;
  fiyat: number;
  kdvOrani: number;
  aciklama?: string;
}

export default function VarsayilanFiyatlarPage() {
  const [prices, setPrices] = useState<VarsayilanFiyat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<VarsayilanFiyat | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    kategori: '',
    birim: '',
    fiyat: '',
    kdvOrani: 20,
    aciklama: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('varsayilanFiyatlar');
    if (saved) {
      try {
        setPrices(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading prices:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleOpenModal = (price?: VarsayilanFiyat) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        kategori: price.kategori,
        birim: price.birim,
        fiyat: price.fiyat.toString(),
        kdvOrani: price.kdvOrani,
        aciklama: price.aciklama || '',
      });
    } else {
      setEditingPrice(null);
      setFormData({
        kategori: '',
        birim: '',
        fiyat: '',
        kdvOrani: 20,
        aciklama: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updated;
      if (editingPrice) {
        updated = prices.map(p =>
          p.id === editingPrice.id
            ? { ...p, ...formData, fiyat: parseFloat(formData.fiyat) }
            : p
        );
      } else {
        const newPrice: VarsayilanFiyat = {
          id: Date.now().toString(),
          ...formData,
          fiyat: parseFloat(formData.fiyat),
        };
        updated = [...prices, newPrice];
      }
      
      setPrices(updated);
      localStorage.setItem('varsayilanFiyatlar', JSON.stringify(updated));
      
      setToastMessage(`Fiyat başarıyla ${editingPrice ? 'güncellendi' : 'oluşturuldu'} ✅`);
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
    if (confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) {
      const updated = prices.filter(p => p.id !== id);
      setPrices(updated);
      localStorage.setItem('varsayilanFiyatlar', JSON.stringify(updated));
      setToastMessage('Fiyat başarıyla silindi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Varsayılan Fiyatlar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sistem genelinde kullanılacak varsayılan fiyatları yönetin
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Fiyat
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">Henüz fiyat eklenmemiş</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Birim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fiyat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">KDV</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {prices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{price.kategori}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{price.birim}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{price.fiyat.toLocaleString('tr-TR')} ₺</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">%{price.kdvOrani}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(price)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
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
              {editingPrice ? 'Fiyat Düzenle' : 'Yeni Fiyat'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori *</label>
                <input
                  type="text"
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birim *</label>
                <input
                  type="text"
                  value={formData.birim}
                  onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fiyat *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fiyat}
                    onChange={(e) => setFormData({ ...formData, fiyat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">KDV (%)</label>
                  <input
                    type="number"
                    value={formData.kdvOrani}
                    onChange={(e) => setFormData({ ...formData, kdvOrani: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
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
                  {editingPrice ? 'Güncelle' : 'Oluştur'}
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

