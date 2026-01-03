'use client';

import { useState, useEffect } from 'react';

interface Permission {
  key: string;
  label: string;
  children?: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  permissions?: Record<string, any>;
}


const permissionTree: Permission[] = [
  {
    key: 'sayfalar',
    label: 'Sayfalar',
    children: [
      {
        key: 'rezervasyonlar',
        label: 'Rezervasyonlar',
        children: [
          { key: 'rezervasyonlar.view', label: 'Görüntüle' },
          { key: 'rezervasyonlar.edit', label: 'Düzenle' },
          { key: 'rezervasyonlar.delete', label: 'Sil' },
        ],
      },
      {
        key: 'salonlar',
        label: 'Salonlar',
        children: [
          { key: 'salonlar.view', label: 'Görüntüle' },
          { key: 'salonlar.create', label: 'Oluştur' },
          { key: 'salonlar.delete', label: 'Sil' },
        ],
      },
      {
        key: 'muhasebe',
        label: 'Muhasebe',
        children: [
          { key: 'muhasebe.view', label: 'Görüntüle' },
          { key: 'muhasebe.edit', label: 'Düzenle' },
          { key: 'muhasebe.report', label: 'Rapor Al' },
        ],
      },
    ],
  },
];

export default function Roller() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'ozellikler' | 'yetkiler'>('ozellikler');
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set(['sayfalar']));
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/roles', {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!res.ok) {
        throw new Error('Roller yüklenemedi');
      }
      
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (error: any) {
      console.error('Fetch roles error:', error);
      setToastMessage('Roller yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedPermissions);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedPermissions(newExpanded);
  };

  const renderPermissionTree = (permissions: Permission[], level = 0) => {
    return permissions.map((permission) => {
      const hasChildren = permission.children && permission.children.length > 0;
      const isExpanded = expandedPermissions.has(permission.key);
      const isChecked = rolePermissions[permission.key] || false;

      return (
        <div key={permission.key} className={level > 0 ? 'ml-6' : ''}>
          <div className="flex items-center gap-2 py-1">
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(permission.key)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => togglePermission(permission.key)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{permission.label}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderPermissionTree(permission.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToastMessage('Rol adı zorunludur');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      let res;
      if (editingRole) {
        res = await fetch('/eventra/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingRole.id,
            name: formData.name,
            description: formData.description,
            isDefault: formData.isDefault,
            isActive: formData.isActive,
            permissions: rolePermissions,
          }),
        });
      } else {
        res = await fetch('/eventra/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            isDefault: formData.isDefault,
            isActive: formData.isActive,
            permissions: rolePermissions,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      setShowModal(false);
      setToastMessage(`Rol başarıyla ${editingRole ? 'güncellendi' : 'oluşturuldu'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      resetForm();
      fetchRoles(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      isActive: role.isActive,
    });
    setRolePermissions(role.permissions || {});
    setShowModal(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Bu rolü silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/eventra/api/roles?id=${roleId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Rol silinirken bir hata oluştu');
      }

      setToastMessage('Rol başarıyla silindi');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      fetchRoles(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Rol silinirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      isActive: true,
    });
    setEditingRole(null);
    setRolePermissions({});
    setActiveTab('ozellikler');
    setExpandedPermissions(new Set(['sayfalar']));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Roller & Erişim İzinleri
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem rollerini tanımlayın ve izinleri yönetin.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Yeni Rol Oluştur
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{toastMessage || `Rol başarıyla ${editingRole ? 'güncellendi' : 'oluşturuldu'}`} ✅</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Yükleniyor...</p>
        </div>
      )}

      {/* Roles Table */}
      {!loading && (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Oluşturulma Zamanı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Henüz rol tanımlanmamış.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {role.name}
                        </span>
                        {role.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                            Varsayılan
                          </span>
                        )}
                        {!role.isActive && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs font-medium">
                            Pasif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {role.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {role.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* New/Edit Role Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingRole ? 'Rol Düzenle' : 'Yeni Rol Oluştur'}
            </h3>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
              <button
                onClick={() => setActiveTab('ozellikler')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'ozellikler'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Rol Özellikleri
              </button>
              <button
                onClick={() => setActiveTab('yetkiler')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'yetkiler'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Yetkiler
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'ozellikler' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Rol Adı
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Varsayılan Rol</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Aktif</span>
                    </label>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Kendi izinlerinizde değişiklik yapıyorsanız, F5 ile sayfayı yenileyin.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'yetkiler' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Bu role atanacak yetkileri seçin:
                  </p>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                    {renderPermissionTree(permissionTree)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

