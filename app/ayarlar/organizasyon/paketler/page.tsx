'use client';

import { useState, useEffect, useMemo } from 'react';

interface OrganizationPackage {
  id: string;
  name: string;
  slug: string;
  description?: string;
  groupId?: string;
  price?: number | string;
  perPersonPrice?: number | string;
  minGuests?: number;
  maxGuests?: number;
  details?: string;
  isActive: boolean;
  sortOrder: number;
  OrganizasyonGrup?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  active?: boolean; // API'den gelen field
}

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number | string;
  groupId: string;
  isActive: boolean;
}

export default function PaketlerPage() {
  const [packages, setPackages] = useState<OrganizationPackage[]>([]);
  const [groups, setGroups] = useState<OrganizationGroup[]>([]);
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<OrganizationPackage | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packagePrice, setPackagePrice] = useState('');
  const [perPersonPrice, setPerPersonPrice] = useState('');
  const [minGuests, setMinGuests] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    fetchGroups();
    fetchItems();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/organizasyon-paketleri', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Fetch packages error:', error);
      setToastMessage('Paketler yüklenirken bir hata oluştu');
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
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        // API'den gelen active field'ını isActive'e map et
        const mappedGroups = (data.groups || []).map((group: any) => ({
          ...group,
          isActive: group.active !== false, // active field'ını isActive'e çevir
        }));
        setGroups(mappedGroups);
      } else {
        console.error('Fetch groups failed:', res.status);
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/eventra/api/organizasyon-urunleri', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Fetch items error:', error);
    }
  };

  const availableItems = useMemo(() => {
    return items.filter(item => 
      item.isActive && (!selectedGroupId || item.groupId === selectedGroupId)
    );
  }, [items, selectedGroupId]);

  const calculatedTotal = useMemo(() => {
    return availableItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        return sum + price;
      }, 0);
  }, [selectedItems, availableItems]);

  const finalPrice = packagePrice ? parseFloat(packagePrice) : calculatedTotal;

  const handleOpenBuilder = (pkg?: OrganizationPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageName(pkg.name);
      setPackageDescription(pkg.description || '');
      setSelectedGroupId(pkg.groupId || '');
      setPackagePrice(pkg.price?.toString() || '');
      setPerPersonPrice(pkg.perPersonPrice?.toString() || '');
      setMinGuests(pkg.minGuests?.toString() || '');
      setMaxGuests(pkg.maxGuests?.toString() || '');
      
      // Details'dan item ID'lerini parse et (JSON formatında olabilir)
      try {
        if (pkg.details) {
          const details = JSON.parse(pkg.details);
          if (details.items && Array.isArray(details.items)) {
            setSelectedItems(details.items);
          }
        }
      } catch (e) {
        // JSON parse edilemezse boş bırak
        setSelectedItems([]);
      }
    } else {
      resetBuilder();
    }
    setIsBuilderOpen(true);
  };

  const resetBuilder = () => {
    setEditingPackage(null);
    setPackageName('');
    setPackageDescription('');
    setSelectedGroupId('');
    setSelectedItems([]);
    setPackagePrice('');
    setPerPersonPrice('');
    setMinGuests('');
    setMaxGuests('');
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    resetBuilder();
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSavePackage = async () => {
    if (!packageName.trim() || !selectedGroupId) {
      setToastMessage('Lütfen paket adı ve grup seçin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const details = {
        items: selectedItems,
      };

      const packageData: any = {
        name: packageName,
        description: packageDescription,
        groupId: selectedGroupId,
        price: packagePrice || null,
        perPersonPrice: perPersonPrice || null,
        minGuests: minGuests ? parseInt(minGuests) : null,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        details: JSON.stringify(details),
        isActive: true,
      };

      let res;
      if (editingPackage) {
        res = await fetch('/eventra/api/organizasyon-paketleri', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: editingPackage.id, ...packageData }),
        });
        setToastMessage('Paket güncellendi ✅');
      } else {
        res = await fetch('/eventra/api/organizasyon-paketleri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(packageData),
        });
        setToastMessage('Paket oluşturuldu ✅');
      }

      if (res.ok) {
        await fetchPackages();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        handleCloseBuilder();
      } else {
        const error = await res.json();
        setToastMessage(error.error || 'Bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Save package error:', error);
      setToastMessage('Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteClick = (packageId: string) => {
    setDeletingPackageId(packageId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPackageId) {
      try {
        const res = await fetch(`/eventra/api/organizasyon-paketleri?id=${deletingPackageId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.ok) {
          setToastMessage('Paket silindi ✅');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          await fetchPackages();
        } else {
          const error = await res.json();
          setToastMessage(error.error || 'Paket silinemedi');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch (error) {
        console.error('Delete package error:', error);
        setToastMessage('Bir hata oluştu');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
    setShowDeleteModal(false);
    setDeletingPackageId(null);
  };

  const handleToggleActive = async (pkg: OrganizationPackage) => {
    try {
      const res = await fetch('/eventra/api/organizasyon-paketleri', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          groupId: pkg.groupId,
          price: pkg.price,
          perPersonPrice: pkg.perPersonPrice,
          minGuests: pkg.minGuests,
          maxGuests: pkg.maxGuests,
          details: pkg.details,
          isActive: !pkg.isActive,
          sortOrder: pkg.sortOrder,
        }),
      });

      if (res.ok) {
        setToastMessage(pkg.isActive ? 'Paket pasif edildi' : 'Paket aktif edildi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        await fetchPackages();
      }
    } catch (error) {
      console.error('Toggle active error:', error);
    }
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Bilinmiyor';
    return groups.find(g => g.id === groupId)?.name || 'Bilinmiyor';
  };

  const getPackageItems = (pkg: OrganizationPackage) => {
    try {
      if (pkg.details) {
        const details = JSON.parse(pkg.details);
        if (details.items && Array.isArray(details.items)) {
          return items.filter(item => details.items.includes(item.id));
        }
      }
    } catch (e) {
      // JSON parse edilemezse boş döndür
    }
    return [];
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
            Organizasyon Paketleri
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organizasyon ürünlerinden paketler oluşturun
          </p>
        </div>
        
        <button
          onClick={() => handleOpenBuilder()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          + Yeni Paket Oluştur
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const packageItems = getPackageItems(pkg);
          const displayPrice = pkg.price 
            ? (typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price)
            : 0;
          
          return (
            <div
              key={pkg.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {pkg.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                  pkg.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400'
                }`}>
                  {pkg.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Grup:</span> {getGroupName(pkg.groupId)}
                </p>
                {pkg.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {pkg.description}
                  </p>
                )}
                {packageItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                      Kalemler ({packageItems.length}):
                    </p>
                    <ul className="space-y-1">
                      {packageItems.slice(0, 3).map(item => {
                        const itemPrice = typeof item.price === 'string' 
                          ? parseFloat(item.price) 
                          : (item.price || 0);
                        return (
                          <li key={item.id} className="text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                            <span>• {item.name}</span>
                            <span className="font-medium">₺{itemPrice.toLocaleString('tr-TR')}</span>
                          </li>
                        );
                      })}
                      {packageItems.length > 3 && (
                        <li className="text-xs text-slate-500 dark:text-slate-500 italic">
                          +{packageItems.length - 3} kalem daha...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Toplam Fiyat:
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₺{displayPrice.toLocaleString('tr-TR')}
                  </span>
                </div>
                {pkg.perPersonPrice && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kişi başı: ₺{(typeof pkg.perPersonPrice === 'string' ? parseFloat(pkg.perPersonPrice) : pkg.perPersonPrice).toLocaleString('tr-TR')}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenBuilder(pkg)}
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleToggleActive(pkg)}
                  className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {pkg.isActive ? 'Pasif' : 'Aktif'}
                </button>
                <button
                  onClick={() => handleDeleteClick(pkg.id)}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {packages.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Henüz paket oluşturulmamış.
          </p>
          <button
            onClick={() => handleOpenBuilder()}
            className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            İlk paketinizi oluşturun
          </button>
        </div>
      )}

      {/* Package Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-5xl w-full my-8">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingPackage ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Panel - Item Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Organizasyon Grubu *
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Seçiniz...</option>
                      {groups.filter(g => g.isActive !== false && g.isActive !== undefined).map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                    {groups.length === 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        Gruplar yüklenemedi. Lütfen sayfayı yenileyin.
                      </p>
                    )}
                    {groups.length > 0 && groups.filter(g => g.isActive !== false && g.isActive !== undefined).length === 0 && (
                      <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
                        Aktif grup bulunamadı. Lütfen önce organizasyon grubu oluşturun.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Organizasyon Ürünleri ({selectedItems.length} seçili)
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                      {availableItems.length > 0 ? (
                        availableItems.map(item => {
                          const itemPrice = typeof item.price === 'string' 
                            ? parseFloat(item.price) 
                            : (item.price || 0);
                          return (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => toggleItemSelection(item.id)}
                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                  ₺{itemPrice.toLocaleString('tr-TR')}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-500 text-center py-4">
                          {selectedGroupId ? 'Bu grupta aktif ürün yok' : 'Önce bir grup seçin'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel - Package Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Paket Adı *
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Örn: Ekonomik Düğün Paketi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Paket hakkında açıklama"
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hesaplanan Toplam:
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        ₺{calculatedTotal.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedItems.length} ürün seçildi
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Paket Fiyatı
                    </label>
                    <input
                      type="number"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Manuel fiyat (boş bırakılırsa toplam hesaplanır)"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Kişi Başı Fiyat
                      </label>
                      <input
                        type="number"
                        value={perPersonPrice}
                        onChange={(e) => setPerPersonPrice(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Min. Misafir
                      </label>
                      <input
                        type="number"
                        value={minGuests}
                        onChange={(e) => setMinGuests(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Max. Misafir
                      </label>
                      <input
                        type="number"
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        Paket Fiyatı:
                      </span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₺{finalPrice.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseBuilder}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSavePackage}
                  disabled={!packageName.trim() || !selectedGroupId}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPackage ? 'Güncelle' : 'Paketi Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Paketi Sil
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Bu paketi silmek istediğinize emin misiniz?
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
