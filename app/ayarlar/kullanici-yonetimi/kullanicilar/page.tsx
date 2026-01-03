'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  username: string;
  roles: string[];
  lastLogin: string;
  createdAt: string;
  status: 'Aktif' | 'Pasif';
}

// Mock users kaldırıldı - artık veritabanından çekiliyor

// Roller veritabanından çekilecek

export default function Kullanicilar() {
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'bilgiler' | 'roller'>('bilgiler');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Veritabanından kullanıcıları ve rolleri çek
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/eventra/api/roles', {
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Roller yüklenemedi');
      }
      
      const data = await res.json();
      setAvailableRoles(data.roles?.map((r: any) => r.name) || []);
    } catch (error: any) {
      console.error('Fetch roles error:', error);
      // Hata durumunda varsayılan roller
      setAvailableRoles(['Admin', 'User']);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/eventra/api/users', {
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Kullanıcılar yüklenemedi');
      }
      
      const data = await res.json();
      setUsers(data.users || []);
      
      // Başarılı yükleme sonrası toast'ı temizle
      if (showToast) {
        setShowToast(false);
      }
    } catch (error: any) {
      console.error('Fetch users error:', error);
      setToastMessage(error.message || 'Kullanıcılar yüklenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    ofis: '',
    username: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username) {
      setToastMessage('Ad, E-posta ve Kullanıcı Adı zorunludur');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const fullName = `${formData.name} ${formData.surname}`.trim();
      const userData: any = {
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        roles: formData.selectedRoles,
        aktif: formData.aktif,
        rastgeleSifre: formData.rastgeleSifre,
        password: formData.password, // Manuel şifre
      };

      // Düzenleme sırasında şifre değiştiriliyorsa ekle
      if (editingUser && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setToastMessage('Yeni şifreler eşleşmiyor');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          return;
        }
        if (formData.newPassword.length < 6) {
          setToastMessage('Şifre en az 6 karakter olmalıdır');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          return;
        }
        userData.newPassword = formData.newPassword;
      }

      let res;
      if (editingUser) {
        // Update existing user
        res = await fetch('/eventra/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: editingUser.id, ...userData }),
        });
      } else {
        // Create new user
        res = await fetch('/eventra/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(userData),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'İşlem başarısız');
      }

      // Eğer yeni kullanıcı oluşturulduysa ve şifre varsa göster
      if (!editingUser && data.password) {
        setGeneratedPassword(data.password);
        setShowPasswordModal(true);
      }

      setShowModal(false);
      setToastMessage(`Kullanıcı başarıyla ${editingUser ? 'güncellendi' : 'oluşturuldu'}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      resetForm();
      fetchUsers(); // Listeyi yenile
    } catch (error: any) {
      setToastMessage(error.message || 'Bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
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
      password: '',
      newPassword: '',
      confirmPassword: '',
      rastgeleSifre: false,
      ilkGiristeDegistir: false,
      emailGonder: false,
      aktif: user.status === 'Aktif',
      kilitlemeEtkin: false,
      selectedRoles: user.roles || [],
      organizasyonBirimleri: [],
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (userId: string | number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const res = await fetch('/eventra/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          username: user.username,
          roles: user.roles,
          aktif: user.status !== 'Aktif',
        }),
      });

      if (res.ok) {
        fetchUsers(); // Listeyi yenile
        setToastMessage('Kullanıcı durumu güncellendi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error: any) {
      setToastMessage('Durum güncellenirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = async (userId: string | number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/eventra/api/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        fetchUsers(); // Listeyi yenile
        setToastMessage('Kullanıcı başarıyla silindi');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Kullanıcı silinirken bir hata oluştu');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
      password: '',
      newPassword: '',
      confirmPassword: '',
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
          <span>{toastMessage || `Kullanıcı başarıyla ${editingUser ? 'güncellendi' : 'oluşturuldu'}`} ✅</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Kullanıcılar yükleniyor...</p>
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
      {!loading && (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">AD SOYAD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-POSTA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ROL(LER)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SON GİRİŞ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">DURUM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">İŞLEMLER</th>
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
                        {user.roles.length > 0 ? (
                          user.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-medium ${
                          user.status === 'Aktif'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium hover:underline"
                        >
                          {user.status === 'Aktif' ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium hover:underline"
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
                  {editingUser && (
                    <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)
                        </label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Yeni şifre (en az 6 karakter)"
                          minLength={6}
                        />
                      </div>
                      {formData.newPassword && (
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Yeni Şifre Tekrar
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Yeni şifreyi tekrar girin"
                            minLength={6}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    {!editingUser && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Şifre (Boş bırakılırsa varsayılan şifre kullanılır)
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value, rastgeleSifre: false }))}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Şifre (en az 6 karakter)"
                            minLength={6}
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.rastgeleSifre}
                            onChange={(e) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                rastgeleSifre: e.target.checked,
                                password: e.target.checked ? '' : prev.password
                              }));
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Rastgele şifre belirle</span>
                        </label>
                      </>
                    )}
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

      {/* Şifre Gösterim Modalı */}
      {showPasswordModal && generatedPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Kullanıcı Oluşturuldu
                </h2>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Kullanıcı için oluşturulan şifre:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <code className="text-lg font-mono font-bold text-gray-900 dark:text-white select-all">
                      {generatedPassword}
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setToastMessage('Şifre kopyalandı!');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 2000);
                    }}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Kopyala"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Bu şifreyi güvenli bir yerde saklayın. Şifre bir daha gösterilmeyecektir.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setGeneratedPassword(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

