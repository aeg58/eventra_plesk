'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, Search, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface MuhasebeGrubu {
  id: string;
  kod: string;
  ad: string;
  aciklama?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
}

export default function MuhasebeGruplariPage() {
  const [groups, setGroups] = useState<MuhasebeGrubu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MuhasebeGrubu | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    kod: '',
    ad: '',
    aciklama: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      // TODO: API endpoint'e bağlan
      const saved = localStorage.getItem('muhasebeGruplari');
      if (saved) {
        setGroups(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (group?: MuhasebeGrubu) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        kod: group.kod,
        ad: group.ad,
        aciklama: group.aciklama || '',
        parentId: group.parentId || '',
        isActive: group.isActive,
        sortOrder: group.sortOrder,
      });
    } else {
      setEditingGroup(null);
      setFormData({
        kod: '',
        ad: '',
        aciklama: '',
        parentId: '',
        isActive: true,
        sortOrder: groups.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updatedGroups;
      if (editingGroup) {
        updatedGroups = groups.map(g => 
          g.id === editingGroup.id ? { ...editingGroup, ...formData } : g
        );
      } else {
        const newGroup: MuhasebeGrubu = {
          id: Date.now().toString(),
          ...formData,
        };
        updatedGroups = [...groups, newGroup];
      }
      
      setGroups(updatedGroups);
      localStorage.setItem('muhasebeGruplari', JSON.stringify(updatedGroups));
      
      setToastMessage(`Grup başarıyla ${editingGroup ? 'güncellendi' : 'oluşturuldu'} ✅`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsModalOpen(false);
      fetchGroups();
    } catch (error: any) {
      setToastMessage('Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = (groupId: string) => {
    if (confirm('Bu grubu silmek istediğinizden emin misiniz?')) {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      setGroups(updatedGroups);
      localStorage.setItem('muhasebeGruplari', JSON.stringify(updatedGroups));
      setToastMessage('Grup başarıyla silindi ✅');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.kod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Muhasebe Grupları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Muhasebe hesaplarını gruplandırın ve organize edin
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Grup
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Grup ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz grup eklenmemiş'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kod</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{group.kod}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{group.ad}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        const updated = groups.map(g =>
                          g.id === group.id ? { ...g, isActive: !g.isActive } : g
                        );
                        setGroups(updated);
                        localStorage.setItem('muhasebeGruplari', JSON.stringify(updated));
                      }}
                    >
                      {group.isActive ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(group)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingGroup ? 'Grup Düzenle' : 'Yeni Grup'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kod *
                </label>
                <input
                  type="text"
                  value={formData.kod}
                  onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ad *
                </label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
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
                  {editingGroup ? 'Güncelle' : 'Oluştur'}
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

