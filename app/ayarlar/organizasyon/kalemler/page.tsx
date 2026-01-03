'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from '@/app/components/SearchableSelect';

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number | string;
  groupId: string;
  groupIds?: string[]; // Çoklu grup desteği
  unitId?: string;
  isActive: boolean;
  sortOrder: number;
  OrganizasyonGrup?: {
    id: string;
    name: string;
    slug: string;
  };
  OrganizasyonGruplar?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  GenelBirim?: {
    id: string;
    name: string;
  };
}

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

interface Unit {
  id: string;
  name: string;
}

export default function MenuKalemleriPage() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [groups, setGroups] = useState<OrganizationGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganizationItem | null>(null);
  const [groupFilter, setGroupFilter] = useState('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    groupIds: [] as string[], // Çoklu grup desteği
    name: '',
    description: '',
    price: '',
    unitId: '',
    active: true
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchGroups();
    fetchUnits();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/organizasyon-urunleri', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Fetch items error:', error);
      setToastMessage('Ürünler yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-gruplari', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/eventra/api/birimler', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Fetch units error:', error);
      // Birimler opsiyonel, hata olsa bile devam et
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemGroupIds = item.groupIds || [item.groupId];
      const groupMatch = groupFilter === 'Hepsi' || itemGroupIds.includes(groupFilter);
      const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return groupMatch && searchMatch;
    });
  }, [items, groupFilter, searchQuery]);

  const handleOpenModal = (item?: OrganizationItem) => {
    if (item) {
      setEditingItem(item);
      const itemGroupIds = item.groupIds || [item.groupId];
      setFormData({
        groupIds: itemGroupIds,
        name: item.name,
        description: item.description || '',
        price: item.price?.toString() || '',
        unitId: item.unitId || '',
        active: item.isActive
      });
    } else {
      setEditingItem(null);
      setFormData({
        groupIds: [],
        name: '',
        description: '',
        price: '',
        unitId: '',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      groupIds: [],
      name: '',
      description: '',
      price: '',
      unitId: '',
      active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupIds || formData.groupIds.length === 0 || !formData.name.trim() || !formData.price) {
      setToastMessage('Lütfen zorunlu alanları doldurun (en az bir organizasyon grubu seçin)');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const itemData: any = {
        groupIds: formData.groupIds, // Çoklu grup desteği
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        unitId: formData.unitId || null,
        isActive: formData.active,
      };

      let res;
      if (editingItem) {
        res = await fetch('/eventra/api/organizasyon-urunleri', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...itemData }),
        });
        setToastMessage('Organizasyon ürünü güncellendi ✅');
      } else {
        res = await fetch('/eventra/api/organizasyon-urunleri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        setToastMessage('Organizasyon ürünü oluşturuldu ✅');
      }

      if (res.ok) {
        await fetchItems();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        handleCloseModal();
      } else {
        const error = await res.json();
        setToastMessage(error.error || 'Bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Save item error:', error);
      setToastMessage('Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setDeletingItemId(itemId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItemId) {
      try {
        const res = await fetch(`/eventra/api/organizasyon-urunleri?id=${deletingItemId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setToastMessage('Organizasyon ürünü silindi ✅');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          await fetchItems();
        } else {
          const error = await res.json();
          setToastMessage(error.error || 'Ürün silinemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch (error) {
        console.error('Delete item error:', error);
        setToastMessage('Bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
    setShowDeleteModal(false);
    setDeletingItemId(null);
  };

  const handleToggleActive = async (item: OrganizationItem) => {
    try {
      const res = await fetch('/eventra/api/organizasyon-urunleri', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          groupId: item.groupId,
          name: item.name,
          description: item.description,
          price: item.price,
          unitId: item.unitId,
          isActive: !item.isActive,
          sortOrder: item.sortOrder,
        }),
      });

      if (res.ok) {
        setToastMessage(item.isActive ? 'Ürün pasif edildi' : 'Ürün aktif edildi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        await fetchItems();
      }
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  };

  const getGroupName = (item: OrganizationItem) => {
    return item.OrganizasyonGrup?.name || groups.find(g => g.id === item.groupId)?.name || 'Bilinmiyor';
  };

  const getUnitName = (item: OrganizationItem) => {
    return item.GenelBirim?.name || units.find(u => u.id === item.unitId)?.name || '-';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Organizasyon Ürünleri
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organizasyon ürünlerini yönetin ve fiyatlandırın
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          + Yeni Ürün Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Organizasyon Grubu
              </label>
              <SearchableSelect
                options={[
                  { id: 'Hepsi', name: 'Tüm Gruplar' },
                  ...groups.filter(g => g.isActive !== false).map(group => ({
                    id: group.id,
                    name: group.name,
                    description: group.slug,
                  }))
                ]}
                value={groupFilter}
                onChange={(value) => setGroupFilter(value)}
                placeholder="Grup seçiniz"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Ara
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün adı veya açıklama..."
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {(groupFilter !== 'Hepsi' || searchQuery) && (
            <button
              onClick={() => {
                setGroupFilter('Hepsi');
                setSearchQuery('');
              }}
              className="self-end px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ürün Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Grup
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Birim
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
              {filteredItems.map((item) => {
                const itemPrice = typeof item.price === 'string' 
                  ? parseFloat(item.price) 
                  : (item.price || 0);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const itemGroupIds = item.groupIds || [item.groupId];
                          return itemGroupIds.map((gId, idx) => {
                            const groupName = groups.find(g => g.id === gId)?.name || getGroupName(item);
                            return (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                                {groupName}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      ₺{itemPrice.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {getUnitName(item)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          item.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || groupFilter !== 'Hepsi' 
                ? 'Aramanıza uygun ürün bulunamadı.'
                : 'Henüz ürün eklenmemiş.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingItem ? 'Organizasyon Ürününü Düzenle' : 'Yeni Organizasyon Ürünü'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Organizasyon Grupları * (Birden fazla seçebilirsiniz)
                </label>
                <div className="space-y-2">
                  {formData.groupIds.map((groupId, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <SearchableSelect
                        options={groups.filter(g => g.isActive !== false).map(group => ({
                          id: group.id,
                          name: group.name,
                          description: group.slug,
                        }))}
                        value={groupId}
                        onChange={(value) => {
                          const newGroupIds = [...formData.groupIds];
                          newGroupIds[index] = value;
                          setFormData({ ...formData, groupIds: newGroupIds });
                        }}
                        placeholder="Grup seçiniz"
                        required
                      />
                      {formData.groupIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newGroupIds = formData.groupIds.filter((_, i) => i !== index);
                            setFormData({ ...formData, groupIds: newGroupIds });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, groupIds: [...formData.groupIds, ''] })}
                    className="w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    + Grup Ekle
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Örn: DJ Performansı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ürün hakkında detay"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fiyat *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Birim
                  </label>
                  <SearchableSelect
                    options={units.map(unit => ({
                      id: unit.id,
                      name: unit.name,
                    }))}
                    value={formData.unitId}
                    onChange={(value) => setFormData({ ...formData, unitId: value })}
                    placeholder="Birim seçiniz"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">
                  Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  {editingItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Organizasyon Ürününü Sil
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Bu organizasyon ürününü silmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
