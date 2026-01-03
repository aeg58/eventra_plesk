'use client';

import { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  username: string;
  roles: string[];
  lastLogin: string;
  createdAt: string;
  status: 'Aktif' | 'Pasif';
}

const mockUsers: User[] = [
  {
    id: 1,
    name: 'Enes Gedik',
    email: 'enes.gedik@eventra.com',
    phone: '0555 123 45 67',
    username: 'enes.gedik',
    roles: ['Admin'],
    lastLogin: '06.11.2025',
    createdAt: '01.04.2024',
    status: 'Aktif',
  },
  {
    id: 2,
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@eventra.com',
    username: 'ayse.yilmaz',
    roles: ['Çağrı Merkezi ve Rezervasyon', 'Satış ve Pazarlama'],
    lastLogin: '05.11.2025',
    createdAt: '15.05.2024',
    status: 'Aktif',
  },
  {
    id: 3,
    name: 'Mehmet Demir',
    email: 'mehmet.demir@eventra.com',
    username: 'mehmet.demir',
    roles: ['Muhasebe'],
    lastLogin: '04.11.2025',
    createdAt: '20.06.2024',
    status: 'Pasif',
  },
];

const availableRoles = [
  'Admin',
  'Çağrı Merkezi ve Rezervasyon',
  'Dijital Pazarlama',
  'Satış ve Pazarlama',
  'Muhasebe',
  'User',
];

export default function Kullanicilar() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'bilgiler' | 'roller'>('bilgiler');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    ofis: '',
    username: '',
    rastgeleSifre: false,
    ilkGiristeDegistir: false,
    emailGonder: false,
    aktif: true,
    kilitlemeEtkin: false,
    selectedRoles: [] as string[],
    organizasyonBirimleri: [] as string[],
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRoleToggle = (role: string) => {
    const current = formData.selectedRoles;
    if (current.includes(role)) {
      setFormData(prev => ({
        ...prev,
        selectedRoles: current.filter(r => r !== role),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedRoles: [...current, role],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username) {
      alert('Ad, E-posta ve Kullanıcı Adı zorunludur');
      return;
    }

    if (editingUser) {
      // Update existing user
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id
          ? {
              ...user,
              name: `${formData.name} ${formData.surname}`,
              email: formData.email,
              phone: formData.phone,
              username: formData.username,
              roles: formData.selectedRoles,
              status: formData.aktif ? 'Aktif' : 'Pasif',
            }
          : user
      ));
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now(),
        name: `${formData.name} ${formData.surname}`,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        roles: formData.selectedRoles,
        lastLogin: '-',
        createdAt: new Date().toLocaleDateString('tr-TR'),
        status: formData.aktif ? 'Aktif' : 'Pasif',
      };
      setUsers(prev => [...prev, newUser]);
    }

    setShowModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    resetForm();
  };

  const handleEdit = (user: User) => {
    const nameParts = user.name.split(' ');
    setEditingUser(user);
    setFormData({
      name: nameParts[0] || '',
      surname: nameParts.slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '',
      ofis: '',
      username: user.username,
      rastgeleSifre: false,
      ilkGiristeDegistir: false,
      emailGonder: false,
      aktif: user.status === 'Aktif',
      kilitlemeEtkin: false,
      selectedRoles: user.roles,
      organizasyonBirimleri: [],
    });
    setShowModal(true);
  };

  const handleToggleStatus = (userId: number) => {
    setUsers(prev => prev.map(user =>
      user.id === userId
        ? { ...user, status: user.status === 'Aktif' ? 'Pasif' : 'Aktif' }
        : user
    ));
  };

  const handleDelete = (userId: number) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      surname: '',
      email: '',
      phone: '',
      ofis: '',
      username: '',
      rastgeleSifre: false,
      ilkGiristeDegistir: false,
      emailGonder: false,
      aktif: true,
      kilitlemeEtkin: false,
      selectedRoles: [],
      organizasyonBirimleri: [],
    });
    setEditingUser(null);
    setActiveTab('bilgiler');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Kullanıcılar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistem kullanıcılarını yönetin ve roller atayın.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Yeni Kullanıcı Oluştur
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>Kullanıcı başarıyla {editingUser ? 'güncellendi' : 'oluşturuldu'} ✅</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Arama
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ad, e-posta veya kullanıcı adı..."
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Durum
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">Tümü</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-posta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol(ler)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Son Giriş</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.status === 'Aktif'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          {user.status === 'Aktif' ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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

      {/* New/Edit User Modal */}
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
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Oluştur'}
            </h3>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
              <button
                onClick={() => setActiveTab('bilgiler')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'bilgiler'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Kullanıcı Bilgileri
              </button>
              <button
                onClick={() => setActiveTab('roller')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'roller'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Roller
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'bilgiler' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Ad
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
                        Soyad
                      </label>
                      <input
                        type="text"
                        value={formData.surname}
                        onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Ofis
                    </label>
                    <select
                      value={formData.ofis}
                      onChange={(e) => setFormData(prev => ({ ...prev, ofis: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Seçiniz</option>
                      <option value="ofis1">Ana Ofis</option>
                      <option value="ofis2">Şube 1</option>
                      <option value="ofis3">Şube 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.rastgeleSifre}
                        onChange={(e) => setFormData(prev => ({ ...prev, rastgeleSifre: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rastgele şifre belirle</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.ilkGiristeDegistir}
                        onChange={(e) => setFormData(prev => ({ ...prev, ilkGiristeDegistir: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">İlk girişte değiştirilmesi zorunlu</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.emailGonder}
                        onChange={(e) => setFormData(prev => ({ ...prev, emailGonder: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Hesabı etkinleştirmek için e-posta gönder</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.aktif}
                        onChange={(e) => setFormData(prev => ({ ...prev, aktif: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.kilitlemeEtkin}
                        onChange={(e) => setFormData(prev => ({ ...prev, kilitlemeEtkin: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Kilitleme etkin</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'roller' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Kullanıcıya atanacak rolleri seçin:
                  </p>
                  <div className="space-y-2">
                    {availableRoles.map((role) => (
                      <label key={role} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedRoles.includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{role}</span>
                      </label>
                    ))}
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

