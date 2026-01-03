'use client';

import { useState, useEffect } from 'react';

interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export default function OrganizasyonlarPage() {
  const [groups, setGroups] = useState<OrganizationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OrganizationGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/organizasyon-gruplari', {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Organizasyonlar yüklenemedi');
      }
      
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error: any) {
      console.error('Fetch groups error:', error);
      setToastMessage(error.message || 'Organizasyonlar yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (group?: OrganizationGroup) => {
    if (group) {
      // "Bilinmiyor" grubunu düzenlemeye izin verme
      if (group.name === 'Bilinmiyor' || group.slug === 'bilinmiyor') {
        setToastMessage('Bu grup sistem tarafından korunmaktadır ve düzenlenemez');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        active: group.active
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', description: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData({ name: '', description: '', active: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setToastMessage('Organizasyon adı zorunludur');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      let res;
      if (editingGroup) {
        res = await fetch('/eventra/api/organizasyon-gruplari', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingGroup.id,
            name: formData.name,
            description: formData.description,
            active: formData.active,
            sortOrder: groups.length,
          }),
        });
      } else {
        res = await fetch('/eventra/api/organizasyon-gruplari', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            active: formData.active,
            sortOrder: groups.length,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setShowToast(true);
      setToastMessage(`Organizasyon başarıyla ${editingGroup ? 'güncellendi' : 'oluşturuldu'} ✅`);
      setTimeout(() => setShowToast(false), 3000);
      handleCloseModal();
      fetchGroups(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteClick = (groupId: string) => {
    setDeletingGroupId(groupId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGroupId) {
      setShowDeleteModal(false);
      return;
    }

    try {
      const res = await fetch(`/eventra/api/organizasyon-gruplari?id=${deletingGroupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Organizasyon silinirken bir hata oluştu');
      }

      const data = await res.json();
      setToastMessage(data.message || 'Organizasyon başarıyla silindi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      fetchGroups(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Organizasyon silinirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }

    setShowDeleteModal(false);
    setDeletingGroupId(null);
  };

  const handleToggleActive = async (group: OrganizationGroup) => {
    // "Bilinmiyor" grubunun durumunu değiştirmeye izin verme
    if (group.name === 'Bilinmiyor' || group.slug === 'bilinmiyor') {
      setToastMessage('Bu grup sistem tarafından korunmaktadır');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const res = await fetch('/eventra/api/organizasyon-gruplari', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: group.id,
          name: group.name,
          description: group.description,
          active: !group.active,
          sortOrder: group.sortOrder,
        }),
      });

      if (!res.ok) {
        throw new Error('Durum güncellenemedi');
      }

      setToastMessage(group.active ? 'Organizasyon pasif edildi' : 'Organizasyon aktif edildi');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      fetchGroups(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Organizasyonlar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Düğün, kına, nişan gibi organizasyon türlerini yönetin
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          + Yeni Grup Ekle
        </button>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Grup Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Açıklama
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
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {group.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {group.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(group)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        group.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700/20 dark:text-slate-400'
                      }`}
                    >
                      {group.active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleOpenModal(group)}
                        className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                      >
                        Düzenle
                      </button>
                      {/* "Bilinmiyor" grubunu silme butonunu gizle */}
                      {group.name !== 'Bilinmiyor' && group.slug !== 'bilinmiyor' && (
                        <button
                          onClick={() => handleDeleteClick(group.id)}
                          className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Yükleniyor...</p>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              Henüz organizasyon eklenmemiş.
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
                {editingGroup ? 'Organizasyonu Düzenle' : 'Yeni Organizasyon'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grup Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Örn: Düğün, Kına, Nişan"
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
                  placeholder="Grup hakkında kısa açıklama"
                  rows={3}
                />
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
                  {editingGroup ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Organizasyonu Sil
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Bu organizasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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



